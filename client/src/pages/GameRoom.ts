// GameRoom.ts - Creates the game room page layer
import Konva from 'konva';
import fansImageSrc from "../../../shared/fans.jpg";
import { Leaderboard, GameState } from '../../../shared/types/index.js';

export function createGameRoom(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    // Countdown timer at the top center
    const timerText = new Konva.Text({
        x: 0,
        y: 5,
        width: 300,
        text: 'Waiting for game to start...',
        fontSize: 24,
        fontStyle: 'bold',
        align: 'center',
        fill: 'black',
    });

    const timerbox = new Konva.Rect({
        x: 0,
        y: 0,
        width: 300,
        height: 30,
        fill: "white",
        stroke: 'black',
        strokeWidth: 2,
    });

    const TimerGroup = new Konva.Group({
        x: stage.width() / 2 - 150,
        y: 20,
    });

    TimerGroup.add(timerbox);
    TimerGroup.add(timerText);

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

    //Game Room Interactive design
    let field = new Konva.Group({
        x: 0,
        y: 0
    });

    const background = new Konva.Group({ x: 0, y: 0 });

    Konva.Image.fromURL(fansImageSrc, (image) => {
        // size it to the stage so it won’t overflow
        image.position({ x: 0, y: 0 });
        image.width(stage.width());
        image.height(stage.height()/2);
        background.add(image);
        layer.batchDraw(); // redraw when image finishes loading
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
    layer.add(background);
    layer.add(field);
    stage.add(layer);

    //

    // Leave Game button
    const buttonWidth = 150;
    const buttonHeight = 40;

    const leaveButtonRect = new Konva.Rect({
        x: stage.width() - buttonWidth - 20,
        y: 20,
        width: buttonWidth,
        height: buttonHeight,
        fill: "red",
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

    // Leaderboard text group
    let leaderboardGroup = new Konva.Group({
        x: 450,
        y: 200,
    });
    layer.add(leaderboardGroup);

    // Function to render leaderboard
    function renderLeaderboard(leaderboard: Leaderboard): void {
        // Clear existing leaderboard
        leaderboardGroup.destroyChildren();

        // backboard
        const backboard = new Konva.Rect({
            x:0,
            y:0,
            height: 300,
            width: 330,
            fill: "gold",
            stroke: "black",
            strokeWidth: 2,
        });
        leaderboardGroup.add(backboard);
    
        //title
        const title = new Konva.Text({
            x: 100,
            y: 30,
            text: 'LEADERBOARD',
            fontSize: 20,
            fontStyle: 'bold',
            fill: "black"
        });
        leaderboardGroup.add(title);

        // Render each player
        leaderboard.forEach((player, index) => {
            const yPos = 70 + (index * 30);

            // Player info text
            const playerText = new Konva.Text({
                x: 10,
                y: yPos,
                text: `${index + 1}. ${player.username} - Total: ${player.total_score} (100m: ${player["100m_score"]}, Mini: ${player.minigame1_score}) ${player.active ? '' : '[INACTIVE]'}`,
                fontSize: 16,
                fill: player.active ? 'black' : 'red',
            });
            leaderboardGroup.add(playerText);
        });

        layer.draw();
    }

    // Initial render with empty leaderboard
    renderLeaderboard([]);
    layer.add(TimerGroup);
    stage.draw();

    return layer;
}