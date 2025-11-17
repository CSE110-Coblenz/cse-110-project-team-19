import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHundredMeterDash } from './pages/HundredMeterDash.ts';
import Konva from 'konva';

describe ('HudredMeterDashPage', () => {
    let stage: any;
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
        vi.restoreAllMocks();
        document.body.innerHTML = '';
        stage = makeStage();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it ('creates HudredMeterDashPage without errors and exposes input control methods', () => {
        const onFinishRace = vi.fn();
        const layer = createHundredMeterDash(stage, onFinishRace);
        expect(layer).toBeDefined();
    });

    it ('starts every player at the correct starting position', () => {
        // Test implementation goes here
    });

    it ('gives new problem and moves player position foward on correct answer', () => {
        // Test implementation goes here
    });

    it ('stays on same problem and moves player position backwards on incorrect answer', () => {
        // Test implementation goes here
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
        // Test implementation goes here
    });

    it ('does not move player past starting line', () => {
        // Test implementation goes here
    });

    it ('shows correct rankings on leaderboard when game ends', () => {
        // Test implementation goes here
    });
    
});