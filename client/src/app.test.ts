// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Not worth it to keep mocking Konva or DOM, just import the real thing
import { createEntrancePage } from './pages/EntrancePage.js';
import { createGameRoom } from './pages/GameRoom.js';
import { createHundredMeterDash } from './pages/HundredMeterDash.js';
import { createJavelin } from './pages/Javelin.js';
import * as api from './services/api.js';
import { socketService } from './services/socket.js';

describe('Client Pages', () => {
    let stage: any;

    function makeStageMock() {
        // Ensure a container exists in DOM for Konva usage
        let container = document.getElementById('konva-container') as HTMLDivElement | null;
        if (!container) {
            container = document.createElement('div');
            container.id = 'konva-container';
            document.body.appendChild(container);
        }

        // Provide a minimal fake stage with the methods pages expect
        return {
            width: () => 800,
            height: () => 600,
            container: () => container as HTMLDivElement,
            add: vi.fn(),
            draw: vi.fn(),
        } as any;
    }

    beforeEach(() => {
        vi.restoreAllMocks();
        // create fresh DOM container for each test
        document.body.innerHTML = '';
        stage = makeStageMock();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        // createGameRoom calls stage.add(layer) internally
        expect(stage.add).toHaveBeenCalledWith(layer);
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

        // Fire the join button click
        const joinGroup = entranceLayer.findOne('Group');
        expect(joinGroup).toBeTruthy();
        joinGroup!.fire('click');

        // Wait for async operations (joinGame -> connect -> transition)
        await new Promise((r) => setTimeout(r, 0));

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
        // Find the join button group and fire click
        const joinGroup = entranceLayer.findOne('Group');
        expect(joinGroup).toBeTruthy();
        joinGroup!.fire('click');
        // Wait a tick for handlers
        await new Promise((r) => setTimeout(r, 0));
        expect(alertSpy).toHaveBeenCalled();

        // now test with invalid username
        alertSpy.mockClear();
        input.value = '!!'; // mimic invalid username
        joinGroup!.fire('click');
        await new Promise((r) => setTimeout(r, 0));
        expect(alertSpy).toHaveBeenCalled();

        alertSpy.mockRestore();
    });
    

});