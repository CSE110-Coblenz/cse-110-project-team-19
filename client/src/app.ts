// app.ts - Main application file that manages the Konva Stage and page transitions
import Konva from 'konva';
import { createEntrancePage } from './pages/EntrancePage.js';

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

// TODO: Create game room and 100m dash layers
// const gameRoomLayer = createGameRoom(stage, ...);
// pages.set('gameRoom', gameRoomLayer);

// Add all layers to stage (initially hidden except entrance)
pages.forEach((layer, pageName) => {
    stage.add(layer);
    layer.visible(pageName === 'entrance');
});

// Function to switch between pages
function showPage(pageName: PageName): void {
    // Hide all layers
    pages.forEach((layer) => {
        layer.visible(false);
    });

    // Show the requested page
    const page = pages.get(pageName);
    if (page) {
        page.visible(true);
        currentPage = pageName;
        stage.draw();
    } else {
        console.error(`Page "${pageName}" not found`);
    }
}

// Initial render
stage.draw();