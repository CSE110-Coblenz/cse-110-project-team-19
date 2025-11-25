import { MultipleChoiceProblem } from '../../../../shared/types/index.js';
import { JAVELIN_PROBLEM_COUNT } from '../../constants.js';

type ChoiceLabel = 'A' | 'B' | 'C' | 'D';

interface InternalMCProblem {
    operand1: number;
    operand2: number;
    choices: Record<ChoiceLabel, string>;
    correct: ChoiceLabel;
}

export class Javelin {
    // Shared list of problems for the whole game
    private problems: InternalMCProblem[] = [];

    // Generate problems (stateless w.r.t players)
    prepare(): void {
        this.problems = this.generateProblems();
    }

    getProblemCount(): number {
        return this.problems.length;
    }

    getProblemAt(index: number): MultipleChoiceProblem | null {
        const p = this.problems[index];
        if (!p) return null;
        return {
            type: 'ADDITION',
            operand1: p.operand1,
            operand2: p.operand2,
            A: p.choices.A,
            B: p.choices.B,
            C: p.choices.C,
            D: p.choices.D
        };
    }

    getCorrectLabelAt(index: number): ChoiceLabel | null {
        const p = this.problems[index];
        return p ? p.correct : null;
    }

    // Generate a list of multiple-choice addition problems (two addends, 1–3 digits)
    private generateProblems(): InternalMCProblem[] {
        const out: InternalMCProblem[] = [];
        for (let i = 0; i < JAVELIN_PROBLEM_COUNT; i++) {
            // Two addends in [1, 999]
            const a = this.randInt(1, 999);
            const b = this.randInt(1, 999);
            const correct = a + b;

            // create three integer distractors near the correct value
            const distractors = new Set<number>();
            const absOffsets = [3, 5, 7, 10, 15, 20, 25, 30, 50];
            while (distractors.size < 3) {
                // mix proportional and absolute offsets
                const useProp = Math.random() < 0.5;
                let candidate: number;
                if (useProp) {
                    const pct = 0.02 + Math.random() * 0.06; // 2%–8%
                    const sign = Math.random() < 0.5 ? -1 : 1;
                    candidate = Math.round(correct * (1 + sign * pct));
                } else {
                    const offset = absOffsets[Math.floor(Math.random() * absOffsets.length)];
                    const sign = Math.random() < 0.5 ? -1 : 1;
                    candidate = correct + sign * offset;
                }
                if (candidate < 1) continue;
                if (candidate !== correct) distractors.add(candidate);
            }

            const choicesArr = [correct, ...Array.from(distractors)];
            // shuffle
            this.shuffle(choicesArr);

            // map to labels
            const labels: ChoiceLabel[] = ['A', 'B', 'C', 'D'];
            const choices: Record<ChoiceLabel, string> = {
                A: String(choicesArr[0]),
                B: String(choicesArr[1]),
                C: String(choicesArr[2]),
                D: String(choicesArr[3])
            };

            const correctLabel = (labels[choicesArr.indexOf(correct)] ?? 'A') as ChoiceLabel;

            out.push({ operand1: a, operand2: b, choices, correct: correctLabel });
        }
        return out;
    }

    // Player progress & alive state now lives in Game.Player (javelinAnswered / javelinAlive)

    // Helpers
    private randInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // roundTwo no longer needed (we use integers for addition)

    private shuffle<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

// no default export
