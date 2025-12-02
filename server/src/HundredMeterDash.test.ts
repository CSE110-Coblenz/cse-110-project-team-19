import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HundredMeterDash } from './services/games/HundredMeterDash.js';
import { HUNDRED_METER_DASH_PROBLEM_COUNT } from './constants.js';
import { Problem } from '../../shared/types/index.js';


describe('HundredMeterDash (stateless provider)', () => {
    let hmd: HundredMeterDash;

    beforeEach(() => {
        hmd = new HundredMeterDash();
        hmd.prepare();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generates the expected number of problems', () => {
        expect(hmd.getProblemCount()).toBe(HUNDRED_METER_DASH_PROBLEM_COUNT);
        expect(hmd.getFirstProblem()).not.toBeNull();
    });

    it('returns same first problem via getFirstProblem and index 0', () => {
        const first = hmd.getFirstProblem();
        const atZero = hmd.getProblemAt(0);
        expect(first).toEqual(atZero);
    });

    it('returns null when index beyond problem count is requested', () => {
        const beyond = hmd.getProblemAt(HUNDRED_METER_DASH_PROBLEM_COUNT);
        expect(beyond).toBeNull();
    });

    it('simulates differing player progress by index comparison', () => {
        const pStart = hmd.getProblemAt(0);
        const pLater = hmd.getProblemAt(1);
        expect(pStart).not.toEqual(pLater);
    });

    it('computes correct answers for multiplication & division problems', () => {
        const mult: Problem = { type: 'MULTIPLICATION', operand1: 7, operand2: 8 };
        expect(hmd.getCorrectAnswer(mult)).toBe(56);
        const div: Problem = { type: 'DIVISION', operand1: 56, operand2: 7 };
        expect(hmd.getCorrectAnswer(div)).toBe(8);
    });
});