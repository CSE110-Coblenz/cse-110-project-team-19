// app.ts - Main application file that manages the Konva Stage and page transitions
import Konva from 'konva';
import { createEntrancePage } from './pages/EntrancePage.js';
import { createGameRoom } from './pages/GameRoom.js';
import { socketService } from './services/socket.js';
import { GameState } from '../../shared/types/index.js';

// Create the main Konva Stage
const stage = new Konva.Stage({
    container: 'konva-container',
    width: 800,
    height: 600,
});

// Page management
type PageName = 'entrance' | 'gameRoom' | '100mDash';
let currentPage: PageName = 'entrance';
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

// TODO: Create 100m dash layer
// const dash100mLayer = createHundredMeterDash(stage);
// pages.set('100mDash', dash100mLayer);

// Add all layers to stage (initially hidden except entrance)
pages.forEach((layer, pageName) => {
    stage.add(layer);
    layer.visible(pageName === 'entrance');
});

// Function to switch between pages
function showPage(pageName: PageName): void {
    // Hide all layers
    pages.forEach((layer, name) => {
        layer.visible(false);
        // Hide entrance input when leaving entrance page
        if (name === 'entrance') {
            (layer as any).hideInput();
        }
    });

    // Show the requested page
    const page = pages.get(pageName);
    if (page) {
        page.visible(true);
        currentPage = pageName;
        // Show entrance input when entering entrance page
        if (pageName === 'entrance') {
            (page as any).showInput();
        }
        stage.draw();
    } else {
        console.error(`Page "${pageName}" not found`);
    }
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
            // TODO: Show minigame page
            showPage('gameRoom');
            break;
        case 'POSTGAME':
            showPage('gameRoom');
            break;
        default:
            console.warn('Unknown game state:', gameState);
    }
});

// Register universal leaderboard update handler with SocketService
socketService.setLeaderboardHandler((payload) => {
    console.log('app.ts: Received leaderboard update', payload.leaderboard);
    // Call GameRoom's public updateLeaderboard method
    (gameRoomLayer as any).updateLeaderboard(payload.leaderboard);
});

// Register universal countdown tick handler with SocketService
socketService.setCountdownHandler((payload) => {
    console.log('app.ts: Received countdown tick', payload);
    // Call GameRoom's public updateTimer method
    (gameRoomLayer as any).updateTimer(payload.game_state, payload.time);
});

// Initial render
stage.draw();