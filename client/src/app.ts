// app.ts - Main application file that manages the Konva Stage and page transitions
import Konva from 'konva';
import { createEntrancePage } from './pages/EntrancePage.js';
import { createGameRoom } from './pages/GameRoom.js';
import { createHundredMeterDash } from './pages/HundredMeterDash.js';
import { createJavelin } from './pages/Javelin.js';
import { socketService } from './services/socket.js';
import { GameState } from '../../shared/types/index.js';

// Create the main Konva Stage
const stage = new Konva.Stage({
    container: 'konva-container',
    width: 800,
    height: 600,
});

// Page management
type PageName = 'entrance' | 'gameRoom' | '100mDash' | 'javelin';
let _currentPage: PageName = 'entrance';
void _currentPage;
const pages: Map<PageName, Konva.Layer> = new Map();

// Create entrance page layer
const entranceLayer = createEntrancePage(stage, () => {
    showPage('gameRoom');
});
pages.set('entrance', entranceLayer);

// Create game room layer
const gameRoomLayer = createGameRoom(stage, () => {
    // Handle leave game
    console.log('Leaving game...');
    socketService.disconnect();
    showPage('entrance');
});
pages.set('gameRoom', gameRoomLayer);

// Create 100M dash layer
const dash100mLayer = createHundredMeterDash(stage, () => {
    console.log('Leaving game...');
    socketService.disconnect();
    showPage('entrance');
});
pages.set('100mDash', dash100mLayer);

// Create Javelin layer
const javelinLayer = createJavelin(stage, () => {
    console.log('Leaving game...');
    socketService.disconnect();
    showPage('entrance');
});
pages.set('javelin', javelinLayer);


// Add all layers to stage (initially hidden except entrance)
pages.forEach((layer, pageName) => {
    stage.add(layer);
    layer.visible(pageName === 'entrance');
});

// Function to switch between pages
function showPage(pageName: PageName): void {
    // Hide all layers & any page-specific inputs
    pages.forEach((layer) => {
        layer.visible(false);
        if ((layer as any).hideInput) {
            (layer as any).hideInput();
        }
    });

    const page = pages.get(pageName);
    if (!page) {
        console.error(`Page "${pageName}" not found`);
        return;
    }
    page.visible(true);
    _currentPage = pageName;
    if ((page as any).showInput) {
        (page as any).showInput();
    }
    stage.draw();
}

// Register universal transition handler with SocketService
socketService.setTransitionHandler((gameState: GameState) => {
    console.log('Handling game state transition:', gameState);

    switch (gameState) {
        case 'PREGAME':
            showPage('gameRoom');
            break;
        case '100M_DASH':
            showPage('100mDash');
            break;
        case 'BEFORE_MINIGAME':
            showPage('gameRoom');
            break;
        case 'MINIGAME':
            showPage('javelin');
            (javelinLayer as any).setPhase('MINIGAME');
            break;
        case 'JAVELIN_ANIMATION':
            showPage('javelin');
            (javelinLayer as any).setPhase('JAVELIN_ANIMATION');
            break;
        case 'POSTGAME':
            showPage('gameRoom');
            (gameRoomLayer as any).updateTimer('POSTGAME', 0);
            break;
        default:
            console.warn('Unknown game state:', gameState);
    }
});

// Register universal leaderboard update handler with SocketService
socketService.setLeaderboardHandler((payload) => {
    console.log('app.ts: Received leaderboard update', payload.leaderboard);
    (gameRoomLayer as any).updateLeaderboard(payload.leaderboard);
    // Forward progress to dash layer for track movement
    (dash100mLayer as any).updateProgress(payload.leaderboard);
});

// Register universal countdown tick handler with SocketService
socketService.setCountdownHandler((payload) => {
    console.log('app.ts: Received countdown tick', payload);
    // Call GameRoom's public updateTimer method
    (gameRoomLayer as any).updateTimer(payload.game_state, payload.time);

    // Forward to game-specific pages so they can show the same countdown
    if (payload.game_state === '100M_DASH') {
        (dash100mLayer as any).updateTimer(payload.time);
    }

    if (payload.game_state === 'MINIGAME' || payload.game_state === 'JAVELIN_ANIMATION') {
        (javelinLayer as any).updateTimer(payload.time);
    }
});

// Initial render
stage.draw();
