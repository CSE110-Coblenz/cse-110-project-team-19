import { Player, GameState, Leaderboard, Problem } from '../../../shared/types/index.js';
import { PREGAME_DURATION, HUNDRED_METER_DASH_DURATION, PRE_MINIGAME_DURATION, HUNDRED_METER_DASH_PROBLEM_COUNT, JAVELIN_DURATION, JAVELIN_ANIMATION_DURATION } from '../constants.js';
import { Server } from 'socket.io';
import { HundredMeterDash } from './games/HundredMeterDash.js';
import { Javelin } from './games/Javelin.js';
import { GameManager } from './GameManager.js';

export class Game {
    private gameId: number;
    private players: Map<string, Player> = new Map();
    // Track when the 100m dash started (ms since epoch) and per-player finish elapsed seconds
    private hundredMeterStartTimeMs: number | null = null;
    private hundredMeterFinishElapsedSec: Map<string, number> = new Map();
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
            active: true,
            penalty_seconds: 0,
            finish_time_seconds: null,
            dashAnswered: 0,
            javelinAnswered: 0,
            javelinAlive: true
        };
        this.players.set(username, player);
    }

    // Increment a player's accumulated dash penalty (seconds)
    addDashPenalty(username: string, seconds: number): void {
        const player = this.players.get(username);
        if (!player) return;
        player.penalty_seconds = (player.penalty_seconds ?? 0) + seconds;
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
        this.hundredMeterDash.prepare();
        this.hundredMeterStartTimeMs = Date.now();
        this.hundredMeterFinishElapsedSec.clear();
        for (const p of this.players.values()) {
            p.dashAnswered = 0;
            p.finish_time_seconds = null;
            p.penalty_seconds = 0;
        }
    }

    // Prepare javelin shared problem list & per-player indices
    prepareJavelin(): void {
        this.javelin.prepare();
        for (const p of this.players.values()) {
            p.javelinAnswered = 0;
            p.javelinAlive = true;
        }
    }

    // Handle a player's submit for the javelin multiple-choice question
    handleJavelinSubmit(username: string, choice: 'A' | 'B' | 'C' | 'D'): { correct: boolean; finished: boolean } {
        if (this.currentState !== 'MINIGAME') return { correct: false, finished: true };
        const player = this.players.get(username);
        if (!player || !player.javelinAlive) return { correct: false, finished: true };
        const idx = player.javelinAnswered ?? 0;
        const correctLabel = this.javelin.getCorrectLabelAt(idx);
        if (correctLabel == null) return { correct: false, finished: true };
        const correct = choice === correctLabel;
        if (!correct) {
            player.javelinAlive = false;
            this.io.to(`game-${this.gameId}`).emit('updateLeaderboard', { leaderboard: this.getLeaderboard() });
            return { correct: false, finished: true };
        }
        player.javelinAnswered = idx + 1;
        this.addJavelinMeters(username, 1);
        const finished = player.javelinAnswered >= this.javelin.getProblemCount();
        if (finished) player.javelinAlive = false;
        this.io.to(`game-${this.gameId}`).emit('updateLeaderboard', { leaderboard: this.getLeaderboard() });
        return { correct: true, finished };
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
        const player = this.players.get(username);
        if (!player) return null;
        const idx = player.dashAnswered ?? 0;
        if (idx >= this.hundredMeterDash.getProblemCount()) return null;
        return this.hundredMeterDash.getProblemAt(idx);
    }

    // Advance the player's problem index; returns true if finished after advancing
    advanceProblem(username: string): boolean {
        const player = this.players.get(username);
        if (!player) return true;
        player.dashAnswered = (player.dashAnswered ?? 0) + 1;
        const finished = player.dashAnswered >= this.hundredMeterDash.getProblemCount();
        if (finished && this.currentState === '100M_DASH' && this.hundredMeterStartTimeMs) {
            if (!this.hundredMeterFinishElapsedSec.has(username)) {
                const elapsed = (Date.now() - this.hundredMeterStartTimeMs) / 1000;
                this.hundredMeterFinishElapsedSec.set(username, elapsed);
                const penalty = player.penalty_seconds ?? 0;
                player.finish_time_seconds = elapsed + penalty;
            }
            // After recording finish, check if all active players have finished to transition early
            this.checkEarlyDashCompletion();
        }
        return finished;
    }

    // Determine if all active players have finished the 100m dash; if so transition early
    private checkEarlyDashCompletion(): void {
        if (this.currentState !== '100M_DASH') return; // only relevant during dash phase
        const activePlayers = Array.from(this.players.values()).filter(p => p.active);
        if (activePlayers.length === 0) return; // nothing to do
        // Count how many active players have recorded finish time (in map) OR answered all problems
        const allFinished = activePlayers.every(p => {
            const recorded = this.hundredMeterFinishElapsedSec.has(p.username);
            const completed = (p.dashAnswered ?? 0) >= this.hundredMeterDash.getProblemCount();
            return recorded || completed;
        });
        if (!allFinished) return;
        // Prevent double finalize if timer already expired and transitioned
        // Ensure we still are in dash and timer exists
        // Perform same sequence as natural timer expiration from 100M_DASH
        this.stopTimer();
        this.finalizeHundredMeterDash();
        const nextState = this.getNextGameState(this.currentState); // should be BEFORE_MINIGAME
        this.transitionToState(nextState);
        this.io.to(`game-${this.gameId}`).emit('transitionGame', { game_state: nextState });
        if (nextState !== 'POSTGAME') {
            this.startTimer();
        }
    }

    // Compute placement bonuses for players who finished the 100m dash.
    // Uses a rank-based linear formula where first place gets (M-1)*placeMultiplier,
    // second gets (M-2)*placeMultiplier, ..., last gets 0.
    finalizeHundredMeterDash(placeMultiplier = 5): void {
        const finished: { username: string; elapsed: number; penalty: number; finalTime: number }[] = [];
        for (const [username, elapsed] of this.hundredMeterFinishElapsedSec.entries()) {
            const player = this.players.get(username);
            const penalty = player?.penalty_seconds ?? 0;
            const finalTime = elapsed + penalty;
            finished.push({ username, elapsed, penalty, finalTime });
        }

        // sort ascending by finalTime (smaller is better)
        finished.sort((a, b) => a.finalTime - b.finalTime);
        const M = finished.length;
        if (M === 0) return;

        // Award bonuses based on rank
        for (let i = 0; i < finished.length; i++) {
            const rank = i; // 0-based; 0 is first place
            const bonus = (M - 1 - rank) * placeMultiplier;
            const entry = finished[i];
            const player = this.players.get(entry.username);
            if (!player) continue;
            // Apply bonus to 100m score at finalization time
            player["100m_score"] = (player["100m_score"] ?? 0) + bonus;
            // Set finish time (elapsed + penalty) on player for leaderboard display
            player.finish_time_seconds = entry.finalTime;
            // Update total score
            player.total_score = player["100m_score"] + player.minigame1_score;
        }

        // Broadcast updated leaderboard
        this.io.to(`game-${this.gameId}`).emit('updateLeaderboard', { leaderboard: this.getLeaderboard() });
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
                this.timeRemaining = JAVELIN_DURATION;
                this.prepareJavelin();
                const gm = GameManager.getInstance();
                for (const [username, player] of this.players.entries()) {
                    if (!player.active) continue;
                    const problem = this.getJavelinProblem(username);
                    if (!problem) continue;
                    const socketId = gm.getSocketIdForUsername(username);
                    if (socketId) this.io.to(socketId).emit('sendMultipleChoice', { problem });
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

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                const nextState = this.getNextGameState(this.currentState);
                const prevState = this.currentState;
                this.transitionToState(nextState);

                if (prevState === '100M_DASH') {
                    this.finalizeHundredMeterDash();
                }

                if (nextState === '100M_DASH') {
                    this.prepareHundredMeterDash();
                }

                this.io.to(`game-${this.gameId}`).emit('transitionGame', {
                    game_state: nextState
                });

                if (nextState === '100M_DASH') {
                    const first = this.hundredMeterDash.getFirstProblem();
                    if (first) {
                        this.io.to(`game-${this.gameId}`).emit('newProblem', { problem: first });
                    }
                }

                if (nextState !== 'POSTGAME') {
                    this.startTimer();
                }
            }
        }, 1000);
    }

    // Expose current javelin problem for a player
    getJavelinProblem(username: string) {
        const player = this.players.get(username);
        if (!player) return null;
        if (!player.javelinAlive) return null;
        const idx = player.javelinAnswered ?? 0;
        if (idx >= this.javelin.getProblemCount()) return null;
        return this.javelin.getProblemAt(idx);
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