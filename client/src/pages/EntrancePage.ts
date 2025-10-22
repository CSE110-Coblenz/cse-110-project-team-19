// EntrancePage.ts - Creates the entrance page layer
import Konva from 'konva';
import { joinGame } from '../services/api.js';

export function createEntrancePage(stage: Konva.Stage, onSuccess: () => void): Konva.Layer {
    const layer = new Konva.Layer();

    // Create username input element (HTML)
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'username-input';
    usernameInput.placeholder = 'Enter username';
    usernameInput.maxLength = 20;
    usernameInput.style.position = 'absolute';
    usernameInput.style.left = '50%';
    usernameInput.style.top = '200px';
    usernameInput.style.transform = 'translateX(-50%)';
    usernameInput.style.width = '300px';
    usernameInput.style.padding = '10px';
    usernameInput.style.fontSize = '16px';

    // Add input to DOM
    document.body.appendChild(usernameInput);

    // Create "Join Game" button
    const buttonWidth = 200;
    const buttonHeight = 50;

    const buttonRect = new Konva.Rect({
        x: (stage.width() - buttonWidth) / 2,
        y: 300,
        width: buttonWidth,
        height: buttonHeight,
        stroke: 'black',
        strokeWidth: 2,
    });

    const buttonText = new Konva.Text({
        x: (stage.width() - buttonWidth) / 2,
        y: 300,
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
        const username = usernameInput.value.trim();

        if (!username) {
            alert('Please enter a username');
            return;
        }

        try {
            const response = await joinGame(username);

            if (response.status === 'success') {
                console.log('Successfully joined game!');
                // Hide and remove username input
                usernameInput.remove();
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

    // Clean up function when layer is hidden
    layer.on('hide', () => {
        if (usernameInput.parentNode) {
            usernameInput.style.display = 'none';
        }
    });

    layer.on('show', () => {
        if (usernameInput.parentNode) {
            usernameInput.style.display = 'block';
        }
    });

    return layer;
}