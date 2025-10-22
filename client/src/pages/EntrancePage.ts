// EntrancePage.ts - Creates the entrance page layer
import Konva from 'konva';
import { joinGame } from '../services/api.js';

export function createEntrancePage(stage: Konva.Stage, onSuccess: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    // Create "Join Game" button
    const buttonWidth = 200;
    const buttonHeight = 50;

    const buttonRect = new Konva.Rect({
        x: (stage.width() - buttonWidth) / 2,
        y: 250,
        width: buttonWidth,
        height: buttonHeight,
        stroke: 'black',
        strokeWidth: 2,
    });

    const buttonText = new Konva.Text({
        x: (stage.width() - buttonWidth) / 2,
        y: 250,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Join Game',
        fontSize: 20,
        align: 'center',
        verticalAlign: 'middle',
    });

    // Group button elements
    const joinButton = new Konva.Group();
    joinButton.add(buttonRect);
    joinButton.add(buttonText);
    layer.add(joinButton);

    // Make button clickable
    joinButton.on('click', async () => {
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const username = usernameInput.value.trim();

        if (!username) {
            alert('Please enter a username');
            return;
        }

        try {
            const response = await joinGame(username);

            if (response.status === 'success') {
                console.log('Successfully joined game!');
                onSuccess(); // Transition to next page
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game. Please try again.');
        }
    });

    // Add pointer cursor on hover
    joinButton.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });

    joinButton.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    return layer;
}