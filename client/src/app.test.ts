// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Not worth it to keep mocking Konva or DOM, just import the real thing
import { createEntrancePage } from './pages/EntrancePage.js';
import { createGameRoom } from './pages/GameRoom.js';
import { createHundredMeterDash } from './pages/HundredMeterDash.js';
import { createJavelin } from './pages/Javelin.js';
import * as api from './services/api.js';
import { socketService } from './services/socket.js';
import Konva from 'konva';

describe('Client Pages', () => {
    let stage: any;

    function makeStage() {
        // Ensure a container exists in DOM for Konva usage
        let container = document.getElementById('konva-container') as HTMLDivElement | null;
        if (!container) {
            container = document.createElement('div');
            container.id = 'konva-container';
            // set an explicit size so Konva can initialize canvas
            container.style.width = '800px';
            container.style.height = '600px';
            document.body.appendChild(container);
        }

        // Create a real Konva Stage (requires `canvas` + jsdom present in test env)
        const stage = new Konva.Stage({ container: 'konva-container', width: 800, height: 600 });
        return stage as any;
    }

    beforeEach(() => {
        vi.restoreAllMocks();
        // create fresh DOM container for each test
        document.body.innerHTML = '';
        stage = makeStage();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // destroy Konva stage to clean up canvases
        try { stage && stage.destroy && stage.destroy(); } catch { }
        document.body.innerHTML = '';
    });

    // PAGE CREATION TESTS
    it('creates EntrancePage without errors and exposes input control methods', () => {
        const onJoinGame = vi.fn();
        const layer = createEntrancePage(stage, onJoinGame);
        expect(layer).toBeDefined();

        // EntrancePage creates an HTML input with id 'username-input'
        const input = document.getElementById('username-input') as HTMLInputElement | null;
        expect(input).toBeTruthy();

        // The layer should expose showInput/hideInput
        expect(typeof (layer as any).showInput).toBe('function');
        expect(typeof (layer as any).hideInput).toBe('function');
    });

    it('creates GameRoom without errors and adds it to stage', () => {
        const onLeaveGame = vi.fn();
        const layer = createGameRoom(stage, onLeaveGame);
        expect(layer).toBeDefined();
        // createGameRoom should have added the layer to the stage
        const layers = stage.getLayers();
        expect(layers).toContain(layer);
    });

    it('creates HundredMeterDash without errors', () => {
        const onLeaveGame = vi.fn();
        const layer = createHundredMeterDash(stage, onLeaveGame);
        expect(layer).toBeDefined();
    });

    it('creates Javelin without errors', () => {
        const onLeaveGame = vi.fn();
        const layer = createJavelin(stage, onLeaveGame);
        expect(layer).toBeDefined();
    });

    // TRANSITION TESTS (simulate app.showPage behavior)
    it('transitions between pages correctly', () => {
        const entranceLayer = createEntrancePage(stage, () => {});
        const gameRoomLayer = createGameRoom(stage, () => {});
        const dashLayer = createHundredMeterDash(stage, () => {});

        const pages = new Map<string, any>([
            ['entrance', entranceLayer],
            ['gameRoom', gameRoomLayer],
            ['100mDash', dashLayer],
        ]);

        function showPage(pageName: string) {
            pages.forEach((layer, name) => {
                layer.visible(false);
                if (name === 'entrance' && (layer as any).hideInput) (layer as any).hideInput();
            });

            const page = pages.get(pageName);
            if (page) {
                page.visible(true);
                if (pageName === 'entrance' && (page as any).showInput) (page as any).showInput();
            }
        }

        // Start at entrance
        showPage('entrance');
        expect(entranceLayer.visible()).toBe(true);
        expect(gameRoomLayer.visible()).toBe(false);

        // Move to gameRoom
        showPage('gameRoom');
        expect(gameRoomLayer.visible()).toBe(true);
        expect(entranceLayer.visible()).toBe(false);

        // Move to 100mDash
        showPage('100mDash');
        expect(dashLayer.visible()).toBe(true);
        expect(gameRoomLayer.visible()).toBe(false);
    });

    it('transitions from EntrancePage to GameRoom on button click with valid username', async () => {
        // Mock API to accept the username
        vi.spyOn(api, 'joinGame').mockResolvedValue({ status: 'success' } as any);

        // Capture transition handler registered on socketService
        let capturedTransitionHandler: ((state: string) => void) | null = null;
        vi.spyOn(socketService, 'setTransitionHandler').mockImplementation((h: any) => {
            capturedTransitionHandler = h;
        });

        // When connect is called, simulate server pushing a transition
        vi.spyOn(socketService, 'connect').mockImplementation(() => {
            if (capturedTransitionHandler) capturedTransitionHandler('PREGAME');
        });

        const entranceLayer = createEntrancePage(stage, () => {});
        const gameRoomLayer = createGameRoom(stage, () => {});

        const pages = new Map<string, any>([
            ['entrance', entranceLayer],
            ['gameRoom', gameRoomLayer],
        ]);

        function showPage(pageName: string) {
            pages.forEach((layer, name) => {
                layer.visible(false);
                if (name === 'entrance' && (layer as any).hideInput) (layer as any).hideInput();
            });

            const page = pages.get(pageName);
            if (page) {
                page.visible(true);
                if (pageName === 'entrance' && (page as any).showInput) (page as any).showInput();
            }
        }

        // Register the transition handler to show the gameRoom when invoked
        socketService.setTransitionHandler(() => { showPage('gameRoom'); });

        // Ensure entrance input exists and set a valid username
        const input = document.getElementById('username-input') as HTMLInputElement;
        expect(input).toBeTruthy();
        input.value = 'alice_123';

        // Simulate click by calling the attached handler directly
        expect(typeof (entranceLayer as any).handleJoinClick).toBe('function');
        await (entranceLayer as any).handleJoinClick();

        // Wait until the transition handler runs and the page becomes visible
        async function waitFor(condition: () => boolean, timeout = 200) {
            const start = Date.now();
            while (!condition()) {
                if (Date.now() - start > timeout) throw new Error('timeout waiting for condition');
                await new Promise((r) => setTimeout(r, 5));
            }
        }

        await waitFor(() => gameRoomLayer.visible() === true, 500);

        expect(gameRoomLayer.visible()).toBe(true);
        expect(entranceLayer.visible()).toBe(false);
    });

    

    // TIMER UPDATE TESTS
    it('updates timer in GameRoom correctly (does not throw and triggers draw)', () => {
        const drawSpy = vi.spyOn(stage, 'draw');
        const gameRoom = createGameRoom(stage, () => {});
        expect(gameRoom).toBeDefined();

        // Call exposed updateTimer which should call layer.draw internally
        (gameRoom as any).updateTimer('PREGAME', 10);

        // ensure stage.draw was called at least once from the page rendering logic
        expect(drawSpy).toHaveBeenCalled();
    });

    // ERROR HANDLING TESTS
    it('handles missing or invalid username input in EntrancePage', async () => {
        // Test that an empty/invalid username triggers an alert
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        const entranceLayer = createEntrancePage(stage, () => {});
        // Ensure input exists and is empty
        const input = document.getElementById('username-input') as HTMLInputElement;
        expect(input).toBeTruthy();
        
        // first test with empty username
        input.value = ''; // mimic empty username
        // Simulate click by calling the attached handler directly
        expect(typeof (entranceLayer as any).handleJoinClick).toBe('function');
        await (entranceLayer as any).handleJoinClick();
        // Wait a tick for handlers
        await new Promise((r) => setTimeout(r, 50));
        expect(alertSpy).toHaveBeenCalled();

        // now test with invalid username
        alertSpy.mockClear();
        input.value = '!!'; // mimic invalid username
        await (entranceLayer as any).handleJoinClick();
        await new Promise((r) => setTimeout(r, 50));
        expect(alertSpy).toHaveBeenCalled();

        alertSpy.mockRestore();
    });
    

});