// GameRoom.ts - Creates the game room page layer
import Konva from 'konva';
import { Leaderboard, GameState } from '../../../shared/types/index.js';

export function createGameRoom(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    // Countdown timer at the top center
    const timerText = new Konva.Text({
        x: stage.width() / 2 - 150,
        y: 20,
        width: 300,
        text: 'Waiting for game to start...',
        fontSize: 24,
        fontStyle: 'bold',
        align: 'center',
        fill: 'blue',
    });
    layer.add(timerText);

    //Game Room Interactive design
    let field = new Konva.Group({
        x: 0,
        y: 0
    });

    const grassTop = stage.height() / 4;
    const grassHeight = (3 * stage.height()) / 4;

    let grass = new Konva.Rect({
        x: 0,
        y: grassTop,
        width: stage.width(),
        height: grassHeight,
        fill: 'green',
        stroke: 'white',
        strokeWidth: 4
    });

    field.add(grass);

    const laneCount = 5;
    const laneGap = 12;
    const laneHeight = (25 + (grassHeight - laneGap * (laneCount + 1))) / laneCount;

    for (let i = 0; i < laneCount; i++) {
        const laneY = grassTop + laneGap * (i + 1) + laneHeight * i;

        const remaining = grassTop + grassHeight - laneY;
        const h = Math.max(0, Math.min(laneHeight, remaining));

        const lane = new Konva.Rect({
        x: 0,
        y: laneY,
        width: stage.width(),
        height: h/2,
        fill: "#ED8272", //
        stroke: "white",
        strokeWidth: 4,
    });
        field.add(lane);
    }

    // adding the entire field to the game
    layer.add(field);
    layer.draw();
    stage.add(layer);
    
    // Leaderboard text group
    let leaderboardGroup = new Konva.Group({
        x: 50,
        y: 100,
    });
    layer.add(leaderboardGroup);

    // Leave Game button
    const buttonWidth = 150;
    const buttonHeight = 40;

    const leaveButtonRect = new Konva.Rect({
        x: stage.width() - buttonWidth - 20,
        y: 20,
        width: buttonWidth,
        height: buttonHeight,
        stroke: 'black',
        strokeWidth: 2,
    });

    const leaveButtonText = new Konva.Text({
        x: stage.width() - buttonWidth - 20,
        y: 20,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Leave Game',
        fontSize: 16,
        align: 'center',
        verticalAlign: 'middle',
    });

    const leaveButton = new Konva.Group();
    leaveButton.add(leaveButtonRect);
    leaveButton.add(leaveButtonText);
    layer.add(leaveButton);

    // Make button clickable
    leaveButton.on('click', () => {
        onLeaveGame();
    });

    // Add pointer cursor on hover
    leaveButton.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });

    leaveButton.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    // Function to render leaderboard
    function renderLeaderboard(leaderboard: Leaderboard): void {
        // Clear existing leaderboard
        leaderboardGroup.destroyChildren();

        // Title
        const title = new Konva.Text({
            x: 0,
            y: 0,
            text: 'LEADERBOARD',
            fontSize: 24,
            fontStyle: 'bold',
        });
        leaderboardGroup.add(title);

        // Render each player
        leaderboard.forEach((player, index) => {
            const yPos = 40 + (index * 30);

            // Player info text
            const playerText = new Konva.Text({
                x: 0,
                y: yPos,
                text: `${index + 1}. ${player.username} - Total: ${player.total_score} (100m: ${player["100m_score"]}, Mini: ${player.minigame1_score}) ${player.active ? '' : '[INACTIVE]'}`,
                fontSize: 16,
                fill: player.active ? 'black' : 'gray',
            });
            leaderboardGroup.add(playerText);
        });

        layer.draw();
    }

    // Function to update countdown timer
    function updateTimer(gameState: GameState, time: number): void {
        let message = '';

        if (gameState === 'PREGAME') {
            message = `Game starts in: ${time}s`;
        } else if (gameState === 'BEFORE_MINIGAME') {
            message = `Next minigame in: ${time}s`;
        } else if (gameState === 'POSTGAME') {
            message = `Game Over!`;
        } else {
            message = `Time: ${time}s`;
        }

        timerText.text(message);
        layer.draw();
    }

    // Expose public method to update leaderboard (called by app.ts)
    (layer as any).updateLeaderboard = (leaderboard: Leaderboard) => {
        console.log('GameRoom: Updating leaderboard', leaderboard);
        renderLeaderboard(leaderboard);
    };

    // Expose public method to update timer (called by app.ts)
    (layer as any).updateTimer = (gameState: GameState, time: number) => {
        console.log('GameRoom: Updating timer', gameState, time);
        updateTimer(gameState, time);
    };

    // Initial render with empty leaderboard
    renderLeaderboard([]);
    
    stage.add(layer);

    return layer;
}