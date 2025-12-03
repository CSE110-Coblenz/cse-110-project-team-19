// GameRoom.ts - Creates the game room page layer
import Konva from 'konva';
// @ts-ignore
import fansImageSrc from "../../../shared/fans.jpg";
import { Leaderboard, GameState } from '../../../shared/types/index.js';

export function createGameRoom(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    let currentGameState: GameState = 'PREGAME';
    // ============ TIMER ============
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

         currentGameState = gameState;

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

        if (gameState === 'POSTGAME') {
            timerbox.fill('#ffd700');
        } else {
            timerbox.fill('white');
        }

        layer.draw();
    }

    // ============ UPDATE VIEW ============
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

    (layer as any).setRules = (game: 'dash' | 'javelin') => {
        switch (game) { 
            case 'dash':
                rulesTitle.text('100 METER DASH RULES:');
                rulesText.text(
                    '• All players will start at the starting line when the game begins\n'+
                    '\n• Each Player will need to answer 10 questions correctly to cross the finish line \n'+
                    '\n• Each correct answer will move your player forward\n' +
                    '\n• Each incorrect answer will deduct 2 points from your score\n' +
                    '\n• All players have 60 seconds to play the game \n' 
                );
                rulesBoard.visible(true);
                rulesTitle.visible(true);
                rulesText.visible(true);
                break;
            case 'javelin':
                rulesTitle.text('JAVELIN THROW RULES:');
                rulesText.text(
                    '• All players will be given 20 seconds to answer as many questions correctly as possible\n'+
                    '\n• If the players answer incorrectly, the game will end early \n'+
                    '\n• The more questions you answer, the more points are added to your score \n' 
                );
                rulesBoard.visible(true);
                rulesTitle.visible(true);
                rulesText.visible(true);
                break;
            default:
                rulesBoard.visible(false);
                rulesTitle.visible(false);
                rulesText.visible(false);
                break;
        }
    }

    // ============ GRAPHIC UI ============
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
        fill: '#64cc68ff',
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

    // ============ LEAVE BUTTON ============

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

    // ============ RULES ============
    const rulesBoard = new Konva.Rect({
        x:100,
        y:200,
        height: 300,
        width: 330,
        fill:"#ffd700",
        stroke: "black",
        strokeWidth: 2,
    });
    const rulesTitle = new Konva.Text({
        x: rulesBoard.x() + 20,
        y: rulesBoard.y() + 8,
        text: 'GAME RULES',
        fontSize: 22,
        fontStyle: 'bold',
        fill: "black"
    });
    const rulesText = new Konva.Text({
        x: rulesTitle.x() + 12,
        y: rulesTitle.y() + 30,
        width: rulesBoard.width() - 30,
        text: '',
        fontSize: 14,
        lineHeight: 1.3,
        fill: "black"
    });
    layer.add(rulesBoard);
    layer.add(rulesText);
    layer.add(rulesTitle);

    // ============ LEADERBOARD ============
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

        const isFinalScreen = currentGameState === 'POSTGAME';

        let maxTotalScore = 0;
        if (leaderboard.length > 0) {
            maxTotalScore = Math.max(...leaderboard.map((p) => p.total_score));
        }

        // backboard
        const backboard = new Konva.Rect({
            x:0,
            y:0,
            height: 300,
            width: 330,
            fill: isFinalScreen ? "#ffd700" : "gold",
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

            const isWinner =
                isFinalScreen && leaderboard.length > 0 && player.total_score === maxTotalScore;


            // Player info text
            const playerText = new Konva.Text({
                x: 10,
                y: yPos,
                text: `${index + 1}. ${player.username} - Total: ${player.total_score} (100m: ${player["100m_score"]}, Mini: ${player.minigame1_score}) ${player.active ? '' : '[INACTIVE]'}`,
                fontSize: 16,
                fill: isWinner ? 'darkred' : (player.active ? 'black' : 'red'),
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