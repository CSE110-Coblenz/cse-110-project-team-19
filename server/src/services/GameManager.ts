import { Game } from './Game.js';
import { Server } from 'socket.io';
import { MAX_PLAYERS_PER_ROOM, JOINABLE_TIME_THRESHOLD } from '../constants.js';

interface ActiveUser {
    username: string;
    gameId: number;
    socketId: string;
}

export class GameManager {
    private static instance: GameManager;
    private games: Map<number, Game> = new Map();
    private activeUsers: Map<string, ActiveUser> = new Map(); // socketId -> ActiveUser
    private usernameToSocketId: Map<string, string> = new Map(); // username -> socketId
    private nextGameId: number = 1;
    private io: Server;

    private constructor(io: Server) {
        this.io = io;
    }

    // Get singleton instance
    static getInstance(io?: Server): GameManager {
        if (!GameManager.instance) {
            if (!io) {
                throw new Error('GameManager must be initialized with io Server on first call');
            }
            GameManager.instance = new GameManager(io);
        }
        return GameManager.instance;
    }

    // Check if username is already active across all games
    isUsernameActive(username: string): boolean {
        return this.usernameToSocketId.has(username);
    }

    // Find an available game that meets the matching criteria
    // Returns a game if one is available, otherwise null
    private findAvailableGame(): Game | null {
        for (const game of this.games.values()) {
            // Only consider games in PREGAME state
            if (game.getGameState() === 'PREGAME') {
                const timeRemaining = game.getTimeRemaining();
                const activePlayerCount = game.getActivePlayerCount();

                // Check if game meets criteria:
                // 1. More than JOINABLE_TIME_THRESHOLD seconds remaining
                // 2. Less than MAX_PLAYERS_PER_ROOM active players
                if (timeRemaining > JOINABLE_TIME_THRESHOLD && activePlayerCount < MAX_PLAYERS_PER_ROOM) {
                    return game;
                }
            }
        }
        return null;
    }

    // Create a new game with the given ID
    private createNewGame(): Game {
        const gameId = this.nextGameId++;
        const game = new Game(gameId, this.io);
        this.games.set(gameId, game);
        return game;
    }

    // Add a player to a game via socket connection
    addPlayerToGame(socketId: string, username: string): { game: Game; gameId: number; isNewGame: boolean } {
        // Try to find an available game that meets the matching criteria
        let game = this.findAvailableGame();
        let isNewGame = false;

        // If no available game found, create a new one
        if (!game) {
            game = this.createNewGame();
            isNewGame = true;
        }

        const gameId = game.getGameId();

        // Add player to the game
        game.addPlayer(username);

        // Track in global active users
        this.activeUsers.set(socketId, { username, gameId, socketId });
        this.usernameToSocketId.set(username, socketId);

        return { game, gameId, isNewGame };
    }

    // Handle player disconnect
    removePlayer(socketId: string): { game: Game | undefined; username: string } | null {
        const activeUser = this.activeUsers.get(socketId);
        if (!activeUser) {
            return null;
        }

        const { username, gameId } = activeUser;
        const game = this.games.get(gameId);

        if (game) {
            game.setPlayerActive(username, false);
            game.removePlayer(username);
        }

        // Remove from global tracking
        this.activeUsers.delete(socketId);
        this.usernameToSocketId.delete(username);

        return { game, username };
    }

    // Get game by ID
    getGame(gameId: number): Game | undefined {
        return this.games.get(gameId);
    }

    // Get game for a specific socket
    getGameBySocketId(socketId: string): Game | undefined {
        const activeUser = this.activeUsers.get(socketId);
        if (!activeUser) {
            return undefined;
        }
        return this.games.get(activeUser.gameId);
    }

    // Get user info by socket ID
    getActiveUser(socketId: string): ActiveUser | undefined {
        return this.activeUsers.get(socketId);
    }

    // Clean up empty games (optional, for later)
    cleanupEmptyGames(): void {
        for (const [gameId, game] of this.games.entries()) {
            if (game.isEmpty()) {
                this.games.delete(gameId);
            }
        }
    }
}