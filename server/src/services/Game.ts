import { Player, GameState, Leaderboard, Problem } from '../../../shared/types/index.js';
import { PREGAME_DURATION, HUNDRED_METER_DASH_DURATION, PRE_MINIGAME_DURATION, HUNDRED_METER_DASH_PROBLEM_COUNT, JAVELIN_DURATION, JAVELIN_ANIMATION_DURATION } from '../constants.js';
import { Server } from 'socket.io';
import { HundredMeterDash } from './games/HundredMeterDash.js';
import { Javelin } from './games/Javelin.js';
import { GameManager } from './GameManager.js';

export class Game {
    private gameId: number;
    private players: Map<string, Player> = new Map();
    private currentState: GameState = 'PREGAME';
    private gameTimer: NodeJS.Timeout | null = null;
    private timeRemaining: number = 0;
    private io: Server;
    // 100m dash logic encapsulated in separate class
    private hundredMeterDash: HundredMeterDash = new HundredMeterDash();
    // Javelin minigame instance (global sprint timer, per-player problem indices)
    private javelin: Javelin = new Javelin();
    // Removed per-player timers; global sprint timer handled via startTimer when in MINIGAME

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

    // get next game state (updated for Javelin animation phase)
    getNextGameState(curState: GameState): GameState {
        switch (curState) {
            case 'PREGAME':
                return '100M_DASH';
            case '100M_DASH':
                return 'BEFORE_MINIGAME';
            case 'BEFORE_MINIGAME':
                return 'MINIGAME';
            case 'MINIGAME':
                return 'JAVELIN_ANIMATION';
            case 'JAVELIN_ANIMATION':
                return 'POSTGAME';
            default:
                return 'POSTGAME';
        }
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
        // Ensure per-game minigame state for this username is reset so a
        // returning player starts fresh instead of inheriting previous progress.
        try {
            this.hundredMeterDash.resetUser(username);
        } catch (e) {
            // noop: if resetUser isn't available for some reason, don't crash
        }
        try {
            this.javelin.resetUser(username);
        } catch (e) {
            // noop
        }
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

    // Public hook to prepare the 100m dash (called on transition into 100M_DASH)
    prepareHundredMeterDash(): void {
        this.hundredMeterDash.prepare(this.players.keys());
    }

    // Prepare javelin shared problem list & per-player indices
    prepareJavelin(): void {
        this.javelin.prepare(this.players.keys());
    }

    // Handle a player's submit for the javelin multiple-choice question
    handleJavelinSubmit(username: string, choice: 'A' | 'B' | 'C' | 'D'): { correct: boolean; finished: boolean } {
        // Ignore submissions outside sprint phase
        if (this.currentState !== 'MINIGAME') {
            return { correct: false, finished: true };
        }
        const res = this.javelin.submitAnswer(username, choice);
        if (res.correct) {
            // Award +1 per correct answer in sprint
            this.addJavelinMeters(username, 1);
        }
        // Broadcast leaderboard after every attempt
        this.io.to(`game-${this.gameId}`).emit('updateLeaderboard', { leaderboard: this.getLeaderboard() });
        return res;
    }

    // Add meters/points to javelin (minigame1) score
    addJavelinMeters(username: string, delta: number): void {
        const player = this.players.get(username);
        if (!player) return;
        player.minigame1_score = Math.max(0, player.minigame1_score + delta);
        player.total_score = player["100m_score"] + player.minigame1_score;
    }

    // Get the current problem for a player (or null if finished)
    getCurrentProblem(username: string): Problem | null {
        return this.hundredMeterDash.getCurrentProblem(username);
    }

    // Advance the player's problem index; returns true if finished after advancing
    advanceProblem(username: string): boolean {
        return this.hundredMeterDash.advanceProblem(username);
    }

    // How many problems a player has answered correctly (their progress)
    getAnsweredCount(username: string): number {
        // Derived from index inside HundredMeterDash (exposed via current problem index)
        // For now, approximate as number advanced which equals meters/10 in our scoring scheme
        const p = this.getCurrentProblem(username);
        // Not strictly needed; kept for backward compatibility if referenced elsewhere
        return p ? 0 : 0;
    }

    // Adjust a player's 100m dash score by delta meters (clamped to [0, maxMeters])
    addDashMeters(username: string, delta: number): void {
        const player = this.players.get(username);
        if (!player) return;
        const maxMeters = HUNDRED_METER_DASH_PROBLEM_COUNT * 10;
        const next = Math.max(0, Math.min(maxMeters, player["100m_score"] + delta));
        player["100m_score"] = next;
        player.total_score = player["100m_score"] + player.minigame1_score;
    }

    // Get correct answer for a problem
    getCorrectAnswer(problem: Problem): number {
        return this.hundredMeterDash.getCorrectAnswer(problem);
    }

    // Early finish logic removed: players who finish wait until global timer reaches 0.

    // Removed local randInt; handled by game-specific class

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
                // Global sprint timer for Javelin
                this.timeRemaining = JAVELIN_DURATION;
                this.prepareJavelin();
                // Send first problem to each alive player privately
                const gm = GameManager.getInstance();
                for (const [username, player] of this.players.entries()) {
                    if (!player.active) continue;
                    const problem = this.javelin.getProblemForPlayer(username);
                    if (!problem) continue;
                    const socketId = gm.getSocketIdForUsername(username);
                    if (socketId) {
                        this.io.to(socketId).emit('sendMultipleChoice', { problem });
                    }
                }
                break;
            case 'JAVELIN_ANIMATION':
                this.timeRemaining = JAVELIN_ANIMATION_DURATION;
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

                // Prepare data when entering specific states
                if (nextState === '100M_DASH') {
                    this.prepareHundredMeterDash();
                }
                // If entering animation phase, no new data needed; clients will switch UI

                // Emit transition event to all players in this game room
                this.io.to(`game-${this.gameId}`).emit('transitionGame', {
                    game_state: nextState
                });

                // If we just entered 100M_DASH, broadcast the first problem to everyone
                if (nextState === '100M_DASH') {
                    const first = this.hundredMeterDash.getFirstProblem();
                    if (first) {
                        this.io.to(`game-${this.gameId}`).emit('newProblem', { problem: first });
                    }
                }

                // Automatically start the next state's timer unless we're in POSTGAME
                if (nextState !== 'POSTGAME') {
                    this.startTimer();
                }
            }
        }, 1000);
    }

    // Expose current javelin problem for a player
    getJavelinProblem(username: string) {
        return this.javelin.getProblemForPlayer(username);
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