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

        if (gameState === 'POSTGAME') {
            // Change 'Game Over' timer color to gold, hide leaderboard, render podium
            message = `Game Over!`;
            timerbox.fill('#ffd700');
            leaderboardGroup.hide();
            renderPodium();
        } else {
            if (gameState === 'PREGAME') {
                message = `Game starts in: ${time}s`;
            } else if (gameState === 'BEFORE_MINIGAME') {
                message = `Next minigame in: ${time}s`;
            } else {
                message = `Time: ${time}s`;
            }

            if (podiumGroup) {
                podiumGroup.destroy(); 
                podiumGroup = null;
            }
            timerbox.fill('white');
            leaderboardGroup.show();
            
        }

        timerText.text(message);
        layer.draw();
    }

    // ============ UPDATE VIEW ============
    // Store latest leaderboard for access and modification during POSTGAME
    let latestLeaderboard: Leaderboard = [];
    let podiumGroup: Konva.Group | null = null;

    // Expose public method to update leaderboard (called by app.ts)
    (layer as any).updateLeaderboard = (leaderboard: Leaderboard) => {
        console.log('GameRoom: Updating leaderboard', leaderboard);
        latestLeaderboard = leaderboard;
        renderLeaderboard(latestLeaderboard);
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

    function renderPodium() {
        if (currentGameState !== 'POSTGAME') return;
        
        if (podiumGroup) {
            podiumGroup.destroy(); 
            podiumGroup = null;
        }

        podiumGroup = new Konva.Group();
        

        const podiumWidth = 200;
        const podiumSpacing = 10;
        const stageHeight = stage.height();
        const stageWidth = stage.width();
        
        const totalWidth = (podiumWidth * 3) + (podiumSpacing * 2);
        const podiumX = (stageWidth - totalWidth) / 2;
        const podiumY = stageHeight * 0.8;

        // Background
        podiumGroup.add(new Konva.Rect({
            x: podiumX - 20,
            y: podiumY - stageHeight * 0.5 - 50,
            width: totalWidth + 40,
            height: stageHeight * 0.5 + 90,
            fill: 'rgba(0, 0, 0, 0.4)',
            cornerRadius: 10,
        }));

        // Podium configurations (order: 3rd, 1st, 2nd for left-to-right positioning)
        const podiums = [
            {
                place: 2, // 3rd place
                height: 0.2,
                fill: '#cd7f32ff',
                textShadow: 'black',
            },
            {
                place: 0, // 1st place
                height: 0.5,
                fill: '#ffbf00ff',
                textShadow: '#d19900ff',
            },
            {
                place: 1, // 2nd place
                height: 0.3,
                fill: 'silver',
                textShadow: 'black',
            },
        ];

        // Create each podium
        podiums.forEach(({ place, height, fill, textShadow }, index) => {
            if (podiumGroup === null) return; // TypeScript null check, technically unnecessary but VSCode complains otherwise
            const leaderboardEntry = latestLeaderboard[place];
            
            const xPos = podiumX + (podiumWidth + podiumSpacing) * index;
            const podiumHeight = stageHeight * height;
            const yPos = podiumY - podiumHeight;

            // Podium rectangle (always render)
            podiumGroup.add(new Konva.Rect({
                x: xPos,
                y: yPos,
                width: podiumWidth,
                height: podiumHeight,
                fill: fill,
                stroke: 'black',
                strokeWidth: 2,
            }));

            // Only add text if player exists
            if (leaderboardEntry) {
                // Player name
                podiumGroup.add(new Konva.Text({
                    x: xPos,
                    y: yPos - 35,
                    width: podiumWidth,
                    text: leaderboardEntry.username,
                    fontSize: 30,
                    fontStyle: 'bold',
                    shadowColor: textShadow,
                    shadowBlur: place === 0 ? 10 : 16,
                    fill: place === 0 ? '#fffcf6ff' : (leaderboardEntry.active ? 'white' : '#f49a9aff'),
                    align: 'center',
                }));

                // Score details
                podiumGroup.add(new Konva.Text({
                    x: xPos,
                    y: yPos + 15,
                    width: podiumWidth,
                    text: `Total: ${leaderboardEntry.total_score} pts\n100M Dash: ${leaderboardEntry['100m_score']}\nMini: ${leaderboardEntry.minigame1_score}`,
                    fontSize: 24,
                    fill: 'white',
                    align: 'center',
                }));
            }
        });

        layer.add(podiumGroup);
    }            

    // Initial render with empty leaderboard
    renderLeaderboard([]);
    layer.add(TimerGroup);
    stage.draw();

    return layer;
}