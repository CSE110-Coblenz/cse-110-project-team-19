import { Player } from '../../../shared/types/index.js';

class GameState {
    private players: Map<string, Player> = new Map();

    // Check if username already exists
    usernameExists(username: string): boolean {
        return this.players.has(username);
    }

    // Add a new player (initially inactive until socket connects)
    addPlayer(username: string): void {
        const player: Player = {
            username,
            "100m_score": 0,
            minigame1_score: 0,
            total_score: 0,
            active: false
        };
        this.players.set(username, player);
    }

    // Get all players as a leaderboard
    getLeaderboard(): Player[] {
        return Array.from(this.players.values())
            .sort((a, b) => b.total_score - a.total_score);
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
}

// Single instance of game state
export const gameState = new GameState();