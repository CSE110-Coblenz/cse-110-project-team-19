import { Player, GameState, Leaderboard, ScoreType } from '../../../shared/types/index.js';
import { PREGAME_DURATION, HUNDRED_METER_DASH_DURATION, PRE_MINIGAME_DURATION, JAVELIN_MINIGAME_DURATION } from '../constants.js';
import { Server } from 'socket.io';

export class Game {
    private gameId: number;
    private players: Map<string, Player> = new Map();
    private currentState: GameState = 'PREGAME';
    private gameTimer: NodeJS.Timeout | null = null;
    private timeRemaining: number = 0;
    private io: Server;

    constructor(gameId: number, io: Server) {
        this.gameId = gameId;
        this.io = io;
    }

    // Get the game ID
    getGameId(): number {
        return this.gameId;
    }

    // Get current game state
    getGameState(): GameState {
        return this.currentState;
    }

    // get next game state
    getNextGameState(curState: GameState): GameState {
        let newState : GameState | null = null;
        if (curState == "PREGAME") {newState = "100M_DASH";}
        else if (curState == "100M_DASH") {newState = "BEFORE_MINIGAME";}
        else if (curState == "BEFORE_MINIGAME") {newState = "MINIGAME";}
        else if (curState == "MINIGAME") {newState = "POSTGAME";}
        return newState!;
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
    // Used when cleaning up after disconnect
    removePlayer(username: string): void {
        this.players.delete(username);
    }

    // Get leaderboard sorted by total score
    getLeaderboard(): Leaderboard {
        return Array.from(this.players.values())
            .sort((a, b) => b.total_score - a.total_score);
    }

    // Update player score
    updateScore(username: string, scoreType: ScoreType, value: number, updateType: 'add' | 'set'): void {
        const player = this.players.get(username);
        if (player) {
            let newScore = value;
            if (updateType === 'add') {
                newScore = (player[scoreType] || 0) + value;
            }
            else if (updateType === 'set') {
                newScore = value;
            }
            player[scoreType] = newScore;
            player.total_score = player["100m_score"] + player.minigame1_score;
        }
    }

    // Transition to a new game state
    transitionToState(newState: GameState): void {
        this.currentState = newState;
    }

    // Get number of players in this game
    getPlayerCount(): number {
        // Iterate through players, only return number of active players
        return Array.from(this.players.values()).filter(player => player.active).length;
    }

    // Check if game has any players
    isEmpty(): boolean {
        return this.getPlayerCount() === 0;
    }

    // Start the game timer and emit countdown events
    startTimer(): void {
        // Safety: clear any existing timer before starting a new one
        this.stopTimer();
        // Set timer duration based on current state
        switch (this.currentState) {
            case 'PREGAME':
                this.timeRemaining = PREGAME_DURATION;
                break;
            case '100M_DASH':
                this.timeRemaining = HUNDRED_METER_DASH_DURATION;
                break;
            case 'BEFORE_MINIGAME':
                this.timeRemaining = PRE_MINIGAME_DURATION;
                break;
            case 'MINIGAME':
                // Use javelin minigame duration for now; adjust if more minigames are added
                this.timeRemaining = JAVELIN_MINIGAME_DURATION;
                break;
            default:
                this.timeRemaining = 0;
        }

        // Emit initial countdown tick immediately
        this.io.to(`game-${this.gameId}`).emit('countDownTick', {
            game_state: this.currentState,
            time: this.timeRemaining
        });

        // Start interval that ticks every second
        this.gameTimer = setInterval(() => {
            this.timeRemaining--;

            // Emit countdown tick to all players in this game room
            this.io.to(`game-${this.gameId}`).emit('countDownTick', {
                game_state: this.currentState,
                time: this.timeRemaining
            });

            // When timer reaches 0, transition to next state
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                const nextState = this.getNextGameState(this.currentState);
                this.transitionToState(nextState);

                // Emit transition event to all players in this game room
                this.io.to(`game-${this.gameId}`).emit('transitionGame', {
                    game_state: nextState
                });

                // Automatically start the next state's timer unless we're in POSTGAME
                if (nextState !== 'POSTGAME') {
                    this.startTimer();
                }
            }
        }, 1000);
    }

    // Stop the game timer
    stopTimer(): void {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    // Get time remaining on current timer
    getTimeRemaining(): number {
        return this.timeRemaining;
    }

    // Get count of active players only
    getActivePlayerCount(): number {
        return Array.from(this.players.values()).filter(player => player.active).length;
    }
}