import { Player, GameState, Leaderboard } from '../../../shared/types/index.js';

export class Game {
    private gameId: number;
    private players: Map<string, Player> = new Map();
    private currentState: GameState = 'PREGAME';

    constructor(gameId: number) {
        this.gameId = gameId;
    }

    // Get the game ID
    getGameId(): number {
        return this.gameId;
    }

    // Get current game state
    getGameState(): GameState {
        return this.currentState;
    }

    // Add a new player to this game
    addPlayer(username: string): void {
        const player: Player = {
            username,
            "100m_score": 0,
            minigame1_score: 0,
            total_score: 0,
            active: true
        };
        this.players.set(username, player);
    }

    // Check if username exists in this game
    hasPlayer(username: string): boolean {
        return this.players.has(username);
    }

    // Get a specific player
    getPlayer(username: string): Player | undefined {
        return this.players.get(username);
    }

    // Set player active status
    setPlayerActive(username: string, active: boolean): void {
        const player = this.players.get(username);
        if (player) {
            player.active = active;
        }
    }

    // Remove a player from this game
    removePlayer(username: string): void {
        this.players.delete(username);
    }

    // Get leaderboard sorted by total score
    getLeaderboard(): Leaderboard {
        return Array.from(this.players.values())
            .sort((a, b) => b.total_score - a.total_score);
    }

    // Update player score
    updateScore(username: string, scoreType: '100m_score' | 'minigame1_score', value: number): void {
        const player = this.players.get(username);
        if (player) {
            player[scoreType] = value;
            player.total_score = player["100m_score"] + player.minigame1_score;
        }
    }

    // Transition to a new game state
    transitionToState(newState: GameState): void {
        this.currentState = newState;
    }

    // Get number of players in this game
    getPlayerCount(): number {
        return this.players.size;
    }

    // Check if game has any players
    isEmpty(): boolean {
        return this.players.size === 0;
    }
}