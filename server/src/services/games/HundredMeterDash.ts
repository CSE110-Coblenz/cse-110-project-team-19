import { Problem } from '../../../../shared/types/index.js';
import { HUNDRED_METER_DASH_PROBLEM_COUNT, PROBLEM_OPERAND_MIN, PROBLEM_OPERAND_MAX } from '../../constants.js';

export class HundredMeterDash {
    private problems: Problem[] = [];

    // Prepare (generate) a fresh problem set for the dash. Player progress now lives on Player objects.
    prepare(): void {
        this.generateProblems();
    }

    getProblemCount(): number {
        return this.problems.length;
    }

    // Return problem at given index or null if out of range
    getProblemAt(index: number): Problem | null {
        return this.problems[index] ?? null;
    }

    // Return first problem (convenience)
    getFirstProblem(): Problem | null {
        return this.getProblemAt(0);
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

    // Progress reset now handled by Game on Player objects

    private randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
