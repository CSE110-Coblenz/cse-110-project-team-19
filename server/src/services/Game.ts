import { Player, GameState, Leaderboard, Problem } from '../../../shared/types/index.js';
import { PREGAME_DURATION, HUNDRED_METER_DASH_DURATION, PRE_MINIGAME_DURATION, JAVELIN_MINIGAME_DURATION, HUNDRED_METER_DASH_PROBLEM_COUNT, PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX } from '../constants.js';
import { Server } from 'socket.io';

export class Game {
    private gameId: number;
    private players: Map<string, Player> = new Map();
    private currentState: GameState = 'PREGAME';
    private gameTimer: NodeJS.Timeout | null = null;
    private timeRemaining: number = 0;
    private io: Server;
    // 100m dash problem set and per-player progress
    private dashProblems: Problem[] = [];
    private currentProblemIndex: Map<string, number> = new Map(); // username -> current index
    // Removed early finish timeout; transition now waits for natural timer expiry

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

    // ===== 100m Dash: Problem Generation & Maintenance =====
    // Generate a fresh set of multiplication problems for the 100m dash
    private generateDashProblems(): void {
        const problems: Problem[] = [];
        for (let i = 0; i < HUNDRED_METER_DASH_PROBLEM_COUNT; i++) {
            const a = this.randInt(PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX);
            const b = this.randInt(PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX);
            problems.push({ type: 'MULTIPLICATION', operand1: a, operand2: b });
        }
        this.dashProblems = problems;
    }

    // Prepare per-player progress for a new 100m dash round
    private resetDashProgress(): void {
        this.currentProblemIndex.clear();
        for (const username of this.players.keys()) {
            this.currentProblemIndex.set(username, 0);
        }
    }

    // Public hook to prepare the 100m dash (called on transition into 100M_DASH)
    prepareHundredMeterDash(): void {
        this.generateDashProblems();
        this.resetDashProgress();
    }

    // Get the current problem for a player (or null if finished)
    getCurrentProblem(username: string): Problem | null {
        const idx = this.currentProblemIndex.get(username) ?? 0;
        return this.dashProblems[idx] ?? null;
    }

    // Advance the player's problem index; returns true if finished after advancing
    advanceProblem(username: string): boolean {
        const cur = this.currentProblemIndex.get(username) ?? 0;
        const next = cur + 1;
        this.currentProblemIndex.set(username, next);
        return next >= this.dashProblems.length;
    }

    // How many problems a player has answered correctly (their progress)
    getAnsweredCount(username: string): number {
        return this.currentProblemIndex.get(username) ?? 0;
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
        if (problem.type === 'MULTIPLICATION') {
            return problem.operand1 * problem.operand2;
        }
        // Future: division support (integer division expected)
        return 0;
    }

    // Early finish logic removed: players who finish wait until global timer reaches 0.

    // Helper: inclusive integer random in [min, max]
    private randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Get number of players in this game
    getPlayerCount(): number {
        return this.players.size;
    }

    // Check if game has any players
    isEmpty(): boolean {
        return this.players.size === 0;
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

                // Prepare data when entering specific states
                if (nextState === '100M_DASH') {
                    this.prepareHundredMeterDash();
                }

                // Emit transition event to all players in this game room
                this.io.to(`game-${this.gameId}`).emit('transitionGame', {
                    game_state: nextState
                });

                // If we just entered 100M_DASH, broadcast the first problem to everyone
                if (nextState === '100M_DASH') {
                    const first = this.dashProblems[0];
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