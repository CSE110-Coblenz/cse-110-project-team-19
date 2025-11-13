// EntrancePage.ts - Creates the entrance page layer
import Konva from 'konva';
import { joinGame } from '../services/api.js';
import { socketService } from '../services/socket.js';
import { Group } from 'konva/lib/Group.js';

export function createEntrancePage(stage: Konva.Stage, _onSuccess: () => void): Konva.Layer {
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
        fill: 'white',
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

    // Make button clickable
    joinButton.on('click', async () => {
        const username = usernameInput.value.trim();

        if (!username) {
            alert('Please enter a username');
            return;
        }

        const REG = /^[A-Za-z0-9_]{3,16}$/;                    
        if (!REG.test(username)) {                              
            alert('Username must be 3–16 chars: letters, numbers, underscore only');
            return;
        }
         joinButton.listening(false);

        try {
            // First, call the API to validate username
            const response = await joinGame(username);

             if (response.status === 'success') {
                console.log('API join successful, connecting to socket...');

                // Hide username input
                usernameInput.style.display = 'none';
                 

                // Connect to socket with username
                // Transition will be handled by universal transition handler in app.ts
                socketService.connect(username);
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game. Please try again.');
        }finally {
         joinButton.listening(true); 
        }
    });

    // Add pointer cursor on hover
    joinButton.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });

    joinButton.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    const rect1 = new Konva.Rect({
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height(),
        fill: '#7ec850',
        stroke: 'black',
        strokeWidth: 4
        });
    layer.add(rect1);

    //Entrance Page elements
    //Title: TRACK AND SOLVE
    const gamePage = new Konva.Group();
    const gameTitle = new Konva.Text({
        text: "Track and Solve",
        x: 0,
        y: 40,
        width: stage.width(),
        align: "center",
        fontSize: Math.max(36, stage.width() * 0.1),
        fontFamily: "Impact, system-ui, sans-serif",
        fill: "#e31e24",
        stroke: "black",
        strokeWidth: 3,
    });
    
    const laneNumbersGroup = new Konva.Group();

    const target = { x: 395, y: 0 }; // your vanishing point
    const lanes = 5;

    const laneXs = [
        170,  // lane 1 bottom
        290,  // lane 2 bottom
        405,  // lane 3 bottom
        520,  // lane 4 bottom
        635   // lane 5 bottom
    ];

    for (let i = 0; i < lanes; i++) {
        // example bottom positions; replace with your own x,y
        const x = laneXs[i];                 // near left edge
        const y = stage.height() - 40;    // stacked near bottom

        const text = new Konva.Text({
            text: String(i + 1),
            x,
            y,  
            fontSize: 80,
            fontStyle: "bold",
            fill: "white",
            stroke: "black",
            strokeWidth: 3,
            fontFamily: "Impact, system-ui, sans-serif",
        });

        // rotate around center for correct aiming
        text.offsetX(text.width() / 2);
        text.offsetY(text.height() / 2);

        // angle from this text to the target
        const dx = target.x - x;
        const dy = target.y - y;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;

        // Rotate text so its "top" faces the target (add 90 degrees)
        text.rotation(angleDeg + 90);

        laneNumbersGroup.add(text);
    }

    const trackLanes = new Konva.Line({
        points: [80, stage.height(), 360, 0, 420, 0, 710, stage.height()],
        fill: '#ED8272',
        stroke: 'black',
        strokeWidth: 5,
        closed: true
    });

    const Line1 = new Konva.Line({
        points: [206, stage.height(), 372, 0],
        stroke: 'white',
        strokeWidth: 5,
        lineCap: 'square',
    });
    const Line2 = new Konva.Line({
        points: [332, stage.height(), 384, 0],
        stroke: 'white',
        strokeWidth: 5,
        lineCap: 'square',
    });
    const Line3 = new Konva.Line({
        points: [458, stage.height(), 396, 0],
        stroke: 'white',
        strokeWidth: 5,
        lineCap: 'square',
    });
    const Line4 = new Konva.Line({
        points: [584, stage.height(), 408, 0],
        stroke: 'white',
        strokeWidth: 5,
        lineCap: 'square',
    });

    gamePage.add(trackLanes);
    gamePage.add(Line1);
    gamePage.add(Line2);
    gamePage.add(Line3);
    gamePage.add(Line4);
    gamePage.add(laneNumbersGroup);
    gamePage.add(gameTitle);

    //Adding the gameEntrance background
    layer.add(gamePage);

    // Expose method to manually show/hide the input (called by app.ts)
    (layer as any).showInput = () => {
        if (usernameInput.parentNode) {
            usernameInput.style.display = 'block';
        }
    };

    (layer as any).hideInput = () => {
        if (usernameInput.parentNode) {
            usernameInput.style.display = 'none';
        }
    };
    layer.add(joinButton);
    return layer;
}