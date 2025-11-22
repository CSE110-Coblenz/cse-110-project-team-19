import { Problem } from '../../../../shared/types/index.js';
import { HUNDRED_METER_DASH_PROBLEM_COUNT, PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX } from '../../constants.js';

export class HundredMeterDash {
    private problems: Problem[] = [];
    private indexByUser: Map<string, number> = new Map();

    // Prepare a fresh problem set and reset per-player progress
    prepare(usernames: Iterable<string>): void {
        this.generateProblems();
        this.resetProgress(usernames);
    }

    // Return the very first problem in the set (used to broadcast at game start)
    getFirstProblem(): Problem | null {
        return this.problems[0] ?? null;
    }

    // Get the current problem for a player, or null if finished
    getCurrentProblem(username: string): Problem | null {
        const idx = this.indexByUser.get(username) ?? 0;
        return this.problems[idx] ?? null;
    }

    // Advance player's index; returns true if finished after advancing
    advanceProblem(username: string): boolean {
        const cur = this.indexByUser.get(username) ?? 0;
        const next = cur + 1;
        this.indexByUser.set(username, next);
        return next >= this.problems.length;
    }

    // Compute correct answer for a problem
    getCorrectAnswer(problem: Problem): number {
        switch (problem.type) {
            case 'MULTIPLICATION':
                return problem.operand1 * problem.operand2;
            case 'DIVISION':
                // For future use: integer division expected
                return Math.floor(problem.operand1 / Math.max(1, problem.operand2));
            default:
                return 0;
        }
    }

    // Internal: generate problems
    private generateProblems(): void {
        const arr: Problem[] = [];
        for (let i = 0; i < HUNDRED_METER_DASH_PROBLEM_COUNT; i++) {
            const a = this.randInt(PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX);
            const b = this.randInt(PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX);
            arr.push({ type: 'MULTIPLICATION', operand1: a, operand2: b });
        }

        this.problems = arr;
    }

    // Internal: reset progress for provided usernames
    private resetProgress(usernames: Iterable<string>): void {
        this.indexByUser.clear();
        for (const username of usernames) {
            this.indexByUser.set(username, 0);
        }
    }

    // Public: reset a single user's progress (used when a player rejoins)
    resetUser(username: string): void {
        this.indexByUser.set(username, 0);
    }

    private randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
