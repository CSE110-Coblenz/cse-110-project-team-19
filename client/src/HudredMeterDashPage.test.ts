// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHundredMeterDash } from './pages/HundredMeterDash.ts';
import Konva from 'konva';
import { socketService } from './services/socket.js';

describe ('HudredMeterDashPage', () => {
    let stage: any;
    let layer: any;
    let onNew: ((p: any) => void) | null = null;
    let onResult: ((r: any) => void) | null = null;
    
    // helper function to find the position for a given username
    function findPositionFor(username: string, layer: Konva.Layer ): number | null {
        // Find the tracks group that contains a Text with the username
        const groups = layer.find('Group');
        for (const g of groups) {
            try {
                const txt = (g as any).findOne && (g as any).findOne('Text');
                if (txt && (txt as any).text && (txt as any).text() === username) {
                    // return the circle inside this group
                    const circle = (g as any).findOne('Circle');
                    if (circle) return circle.x();
                }
            } catch {}
        }
        return null;
    }

    function makeStage() {
        let container = document.getElementById('konva-container') as HTMLDivElement | null;
        if (!container) {
            container = document.createElement('div');
            container.id = 'konva-container';
            document.body.appendChild(container);
        }
        return new Konva.Stage({
            container: 'konva-container',
            width: 500,
            height: 500
        });
    }
    beforeEach(() => {
        // Reset mocks and DOM
        vi.restoreAllMocks();
        document.body.innerHTML = '';
        stage = makeStage();

        // Capture handlers registered with socketService
        // Do BEFORE creating the layer so they are captured
        // since createHundredMeterDash calls setProblemHandlers
        vi.spyOn(socketService, 'setProblemHandlers').mockImplementation((n: any, res: any) => {
            onNew = n;
            onResult = res;
        });

        // create the HundredMeterDash layer
        const onFinishRace = vi.fn();
        layer = createHundredMeterDash(stage, onFinishRace);
        
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it ('creates HudredMeterDashPage without errors and exposes input control methods', () => {
        
        expect(layer).toBeDefined();
    });

    it ('starts every player at the same starting position', () => {
        // Test implementation goes here
    });

    it ('gives new problem and moves player position forward on correct answer', () => {
        
        // Ensure getUsername returns our only test player
        vi.spyOn(socketService, 'getUsername').mockReturnValue('alice');

        // Render initial leaderboard with alice at score 0
        (layer as any).updateProgress([{ username: 'alice', '100m_score': 0, active: true }]);

        // Find initial position for the test player
        const initialX = findPositionFor('alice', layer);
        expect(initialX).toBeDefined();

        // Ensure the page received a new problem handler
        expect(onNew).toBeTruthy();

        // Simulate server sending a new problem
        const problem = { operand1: 3, operand2: 4 } as any;
        onNew!(problem);

        // Find answer input and submit button in stage container
        const input = stage.container().querySelector('input') as HTMLInputElement;
        const btn = stage.container().querySelector('button') as HTMLButtonElement;
        // Make sure both answer input and button exist
        expect(input).toBeTruthy();
        expect(btn).toBeTruthy();

        // Prepare submitAnswer spy that will invoke the result handler and update scores
        vi.spyOn(socketService, 'submitAnswer').mockImplementation((_val: number) => {
            // Simulate server response indicating correct answer
            if (onResult) onResult({ correct: true, finished: false });
            // Also simulate a leaderboard update that moves alice forward
            (layer as any).updateProgress([{ username: 'alice', '100m_score': 30, active: true }]);
        });

        // Enter correct answer and click submit
        input.value = String(problem.operand1 * problem.operand2);
        btn.click();

        // After click, the leaderboard update should have moved the player
        // Get the position for test player after the update
        const afterX = findPositionFor('alice', layer);
        // Make sure position exists
        expect(afterX).toBeDefined();

        // Make sure the player moved forward
        expect(afterX).toBeGreaterThan(initialX as number);
    });

    it ('stays on same problem and moves player position backwards on incorrect answer', () => {
       
    });

    it ('does not update position of other players when one player answers', () => {
        // Test implementation goes here
    });

    it ('lets player see live progress of other players', () => {
        // Test implementation goes here
    });

    it ('calls onFinishRace callback when player reaches finish line', () => {
        // Test implementation goes here
    });

    it ('does not move player beyond finish line', () => {

        // Ensure getUsername returns our test player
        vi.spyOn(socketService, 'getUsername').mockReturnValue('alice');


        // Render initial leaderboard with alice at score 0
        // cast to any to access updateProgress in testing
        (layer as any).updateProgress([{ username: 'alice', '100m_score': 0, active: true }]);

        // Find initial position for the test player
        const initialX = findPositionFor('alice', layer);
        expect(initialX).toBeDefined();

        // Ensure the page received a new problem handler
        expect(onNew).toBeTruthy();

        // Simulate server sending a new problem
        const problem = { operand1: 3, operand2: 4 } as any;
        onNew!(problem);

        // Find answer input and submit button in stage container
        const input = stage.container().querySelector('input') as HTMLInputElement;
        const btn = stage.container().querySelector('button') as HTMLButtonElement;
        expect(input).toBeTruthy();
        expect(btn).toBeTruthy();

        // Prepare submitAnswer spy that will invoke the result handler and update scores
        vi.spyOn(socketService, 'submitAnswer').mockImplementation((_val: number) => {
            // Simulate server response indicating correct answer
            if (onResult) onResult({ correct: false, finished: false });
        });

        // Enter incorrect answer and click submit
        input.value = String(problem.operand1 * problem.operand2 - 5); // incorrect answer (note that Mock implementation above always says incorrect)
        btn.click();

        // After click, the leaderboard update should NOT have moved the player
        // Get the position for test player after the update
        const afterX = findPositionFor('alice', layer);
        // Make sure position exists
        expect(afterX).toBeDefined();

        expect(afterX).toEqual(initialX);
    });

    it ('does not move player past starting line', () => {
        // Test implementation goes here
    });

    it ('shows correct rankings on leaderboard when game ends', () => {
        // Test implementation goes here
    });
    
});