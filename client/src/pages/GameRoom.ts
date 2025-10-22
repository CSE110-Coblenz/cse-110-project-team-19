// GameRoom.ts - Creates the game room page layer
import Konva from 'konva';
import { Leaderboard } from '../../../shared/types/index.js';

export function createGameRoom(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    // Leaderboard text group
    let leaderboardGroup = new Konva.Group({
        x: 50,
        y: 50,
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

    // Expose public method to update leaderboard (called by app.ts)
    (layer as any).updateLeaderboard = (leaderboard: Leaderboard) => {
        console.log('GameRoom: Updating leaderboard', leaderboard);
        renderLeaderboard(leaderboard);
    };

    // Initial render with empty leaderboard
    renderLeaderboard([]);

    return layer;
}