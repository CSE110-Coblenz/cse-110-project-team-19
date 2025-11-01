import { Game } from './Game.js';


interface ActiveUser {
    username: string;
    gameId: number;
    socketId: string;
}

export class GameManager {
    private static instance: GameManager;
    private games: Map<number, Game> = new Map();
    private activeUsers: Map<string, ActiveUser> = new Map(); // socketId -> ActiveUser
    private usernameToGameIdEver: Map<string, number> = new Map();

    private usernameToSocketId: Map<string, string> = new Map(); // username -> socketId
    private nextGameId: number = 1;

    private constructor() {}

    // Get singleton instance
    static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    // Check if username is already active across all games
    isUsernameActive(username: string): boolean {
        return this.usernameToSocketId.has(username);
    }

    isUsernamePresent(username: string): boolean 
    { 
        return this.usernameToGameIdEver.has(username); 
    }

    // Get or create a game for a player (for now, just get/create game ID 1)
    assignPlayerToGame(): Game {
        // For now, everyone goes to the first game
        // Create it if it doesn't exist
        if (!this.games.has(1)) {
            this.games.set(1, new Game(1));
        }
        return this.games.get(1)!;
    }

    // Add a player to a game via socket connection
   // Add a player to a game via socket connection
addPlayerToGame(socketId: string, username: string): { game: Game; gameId: number } {
  
  if (this.usernameToGameIdEver.has(username)) {
    const gameId = this.usernameToGameIdEver.get(username)!;
    
    if (!this.games.has(gameId)) {
      this.games.set(gameId, new Game(gameId));
    }
    const game = this.games.get(gameId)!;

    
    game.setPlayerActive(username, true);

    
    this.activeUsers.set(socketId, { username, gameId, socketId });
    this.usernameToSocketId.set(username, socketId);

    return { game, gameId };
  }

  
  const game = this.assignPlayerToGame();
  const gameId = game.getGameId();

  
  game.addPlayer(username);

  
  this.usernameToGameIdEver.set(username, gameId);

  
  this.activeUsers.set(socketId, { username, gameId, socketId });
  this.usernameToSocketId.set(username, socketId);

  return { game, gameId };
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



export const gameManager = GameManager.getInstance();