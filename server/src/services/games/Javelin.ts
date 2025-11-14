import { MultipleChoiceProblem } from '../../../../shared/types/index.js';
import { JAVELIN_PROBLEM_COUNT, JAVELIN_BASE_ROUND_DURATION, JAVELIN_ROUND_DECREASE_PER_ROUND, JAVELIN_MIN_ROUND_DURATION } from '../../constants.js';

type ChoiceLabel = 'A' | 'B' | 'C' | 'D';

interface InternalMCProblem {
    operand1: number;
    operand2: number;
    choices: Record<ChoiceLabel, string>;
    correct: ChoiceLabel;
}

export class Javelin {
    // Single shared list of problems for the whole game
    private problems: InternalMCProblem[] = [];
    // Per-player progress state
    private index: Map<string, number> = new Map();
    private alive: Map<string, boolean> = new Map();

    // Prepare per-player problem lists and reset progress
    prepare(usernames: Iterable<string>): void {
        // Generate one shared list
        this.problems = this.generateProblems();
        // Reset per-player state
        for (const username of usernames) {
            this.index.set(username, 0);
            this.alive.set(username, true);
        }
    }

    // Generate a list of multiple-choice division problems
    private generateProblems(): InternalMCProblem[] {
        const out: InternalMCProblem[] = [];
        for (let i = 0; i < JAVELIN_PROBLEM_COUNT; i++) {
            // 3-digit operands
            const a = this.randInt(100, 999);
            const b = this.randInt(100, 999);
            const correctRaw = a / b;
            const correct = this.roundTwo(correctRaw);

            // create three distractors
            const distractors = new Set<number>();
            while (distractors.size < 3) {
                // perturb by up to ±10%
                const perturb = 1 + (Math.random() * 0.2 - 0.1);
                const val = this.roundTwo(correctRaw * perturb);
                if (val !== correct) distractors.add(val);
            }

            const choicesArr = [correct, ...Array.from(distractors)];
            // shuffle
            this.shuffle(choicesArr);

            // map to labels
            const labels: ChoiceLabel[] = ['A', 'B', 'C', 'D'];
            const choices: Record<ChoiceLabel, string> = {
                A: choicesArr[0].toFixed(2),
                B: choicesArr[1].toFixed(2),
                C: choicesArr[2].toFixed(2),
                D: choicesArr[3].toFixed(2)
            };

            const correctLabel = (labels[choicesArr.indexOf(correct)] ?? 'A') as ChoiceLabel;

            out.push({ operand1: a, operand2: b, choices, correct: correctLabel });
        }
        return out;
    }

    // Return problem payload for a player (or null if no more problems or dead)
    getProblemForPlayer(username: string): MultipleChoiceProblem | null {
        if (!this.alive.get(username)) return null;
        const idx = this.index.get(username) ?? 0;
        if (idx >= this.problems.length) return null;
        const p = this.problems[idx];
        return {
            type: 'DIVISION',
            operand1: p.operand1,
            operand2: p.operand2,
            A: p.choices.A,
            B: p.choices.B,
            C: p.choices.C,
            D: p.choices.D
        };
    }

    // Submit answer for a player; returns { correct, finished }
    submitAnswer(username: string, choice: ChoiceLabel): { correct: boolean; finished: boolean } {
        if (!this.alive.get(username)) return { correct: false, finished: true };
        const idx = this.index.get(username) ?? 0;
        if (idx >= this.problems.length) return { correct: false, finished: true };

        const p = this.problems[idx];
        const correct = p.correct === choice;
        if (!correct) {
            // player dies
            this.alive.set(username, false);
            return { correct: false, finished: true };
        }

        // correct: advance to next round
        this.index.set(username, idx + 1);
        const finished = idx + 1 >= this.problems.length;
        if (finished) this.alive.set(username, false); // finished sequence -> treat as done
        return { correct: true, finished };
    }

    // Timeout handler: player did not answer in time
    timeout(username: string): void {
        this.alive.set(username, false);
    }

    // Whether a player is still active/alive
    isAlive(username: string): boolean {
        return this.alive.get(username) ?? false;
    }

    // Whether all players are done (no alive players remain)
    allDone(): boolean {
        for (const v of this.alive.values()) {
            if (v) return false;
        }
        return true;
    }

    // Get current round index for player
    getRoundIndex(username: string): number {
        return this.index.get(username) ?? 0;
    }

    // Round duration (seconds) for a given round index
    getRoundDuration(roundIndex: number): number {
        const dur = JAVELIN_BASE_ROUND_DURATION - (roundIndex * JAVELIN_ROUND_DECREASE_PER_ROUND);
        return Math.max(JAVELIN_MIN_ROUND_DURATION, dur);
    }

    // Helpers
    private randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private roundTwo(n: number): number {
        return Math.round(n * 100) / 100;
    }

    private shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

// no default export
