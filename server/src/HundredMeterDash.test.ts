import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HundredMeterDash } from './services/games/HundredMeterDash.js';
import { HUNDRED_METER_DASH_PROBLEM_COUNT} from './constants.js';
import { Problem } from '../../shared/types/index.js';


describe('HundredMeterDash Game Logic', () => {
    let hmd: HundredMeterDash;
    const testUser = 'testPlayer';

    beforeEach(() => {
        hmd = new HundredMeterDash();
        hmd.prepare([testUser]);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generates the correct number of problems on prepare', () => {
        const firstProblem = hmd.getFirstProblem();
        expect(firstProblem).not.toBeNull();
    });

    it('returns the correct current problem for a player', () => {
        const currentProblem = hmd.getCurrentProblem(testUser);
        const firstProblem = hmd.getFirstProblem();
        expect(currentProblem).toEqual(firstProblem);
    });

    it ('gives each player the same initial problem', () => {
        const anotherUser = 'anotherPlayer';
        hmd.prepare([testUser, anotherUser]);
        const firstProblemUser1 = hmd.getCurrentProblem(testUser);
        const firstProblemUser2 = hmd.getCurrentProblem(anotherUser);
        expect(firstProblemUser1).toEqual(firstProblemUser2);
    });

    it ('advances problem index correctly and indicates completion', () => {
        const problemCount = HUNDRED_METER_DASH_PROBLEM_COUNT;
        let finished = false;
        for (let i = 0; i < problemCount; i++) {
            finished = hmd.advanceProblem(testUser);
            if (i < problemCount - 1) {
                expect(finished).toBe(false);
            }
        }
        expect(finished).toBe(true);
        const afterFinishProblem = hmd.getCurrentProblem(testUser);
        expect(afterFinishProblem).toBeNull();
    });

    it ('advances a player without affecting others players', () => {
        const anotherUser = 'anotherPlayer';
        hmd.prepare([testUser, anotherUser]);
        hmd.advanceProblem(testUser);
        const currentProblemUser1 = hmd.getCurrentProblem(testUser);
        const currentProblemUser2 = hmd.getCurrentProblem(anotherUser);
        expect(currentProblemUser1).not.toEqual(currentProblemUser2);
    });
    
    it ('computes correct answers for multiplication problems and division problems', () => {
        const multiplicationProblem: Problem = { type: 'MULTIPLICATION', operand1: 7, operand2: 8 };
        const multiplicationAnswer = hmd.getCorrectAnswer(multiplicationProblem);
        expect(multiplicationAnswer).toBe(56);

        const divisionProblem: Problem = { type: 'DIVISION', operand1: 56, operand2: 7 };
        const divisionAnswer = hmd.getCorrectAnswer(divisionProblem);
        expect(divisionAnswer).toBe(8);
    });
});