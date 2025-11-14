// HundredMeterDash.ts - Creates the hundred meter dash game layer
// NOTE: this will soon be split into MVC structure 
import Konva from 'konva';
import {HUNDRED_METER_DASH_DURATION} from 'server/src/constants.ts'
import { socketService } from 'client/src/services/socket.ts';

export function createHundredMeterDash(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    
    // Display game name
    const gameNameText = new Konva.Text({
        x: 0,
        y: 20,
        width: stage.width(),
        align: 'left',
        
        text: '100 Meter Dash',
        fontSize: 50,
        fontStyle: 'bold',
        fill: 'black',
    });
    layer.add(gameNameText);


    // Countdown text
    const countdownWidth = 200;
    const countdownHeight = 80;
    let countdownTime = 0;

    const countdownRect = new Konva.Rect({
        x: stage.width() - countdownWidth - 20,
        y: 20,
        width: countdownWidth,
        height: countdownHeight,
        stroke: 'black',
        strokeWidth: 2,
    });

    const countdownText = new Konva.Text({
        x: stage.width() - countdownWidth - 20,
        y: 20,
        width: countdownWidth,
        height: countdownHeight,
        text: 'Time: --s',
        fontSize: 32,
        align: 'center',
        verticalAlign: 'middle',
    });

    const countdownDisplay = new Konva.Group();
    countdownDisplay.add(countdownRect);
    countdownDisplay.add(countdownText);
    layer.add(countdownDisplay);

    // Local function to update the timer display
    function updateTimer(time: number): void {
        //countdownText.text(`Time: ${Math.max(0, time)}s`);
        countdownTime = Math.max(0, time);
        countdownText.text(`Time: ${countdownTime}s`)
        layer.draw();
    }

    // Expose public method for app.ts to push timer updates
    (layer as any).updateTimer = (time: number) => {
        updateTimer(time);
    };

    // Leave Game button (positioned below the countdown)
    const buttonWidth = 150;
    const buttonHeight = 40;
    const leaveButtonRect = new Konva.Rect({
        x: stage.width() - buttonWidth - 20,
        y: 20 + countdownHeight + 10,
        width: buttonWidth,
        height: buttonHeight,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
    });

    const leaveButtonText = new Konva.Text({
        x: stage.width() - buttonWidth - 20,
        y: 20 + countdownHeight + 10,
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

    leaveButton.on('click', () => {
        onLeaveGame();
    });

    leaveButton.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });
    leaveButton.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    // ADD POINTS button (for testing purposes)
    const addPointsRect = new Konva.Rect({
        width: buttonWidth * 2,
        height: buttonHeight * 2,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 2,
    });
    const addPointsText = new Konva.Text({
        width: buttonWidth * 2,
        height: buttonHeight * 2,
        text: 'ADD POINTS',
        fontSize: 16,
        align: 'center',
        verticalAlign: 'middle',
    });
    const addPointsButton = new Konva.Group({
        x: (stage.width() - buttonWidth) / 2,
        y: (stage.height() - buttonHeight) / 2,
    });
    addPointsButton.add(addPointsRect);
    addPointsButton.add(addPointsText);
    layer.add(addPointsButton);

    let lastPressTime = HUNDRED_METER_DASH_DURATION;
    const pointsCeiling = 400;
    const pointsFloor = 100;
    const timeToFloor = HUNDRED_METER_DASH_DURATION / 3;
    addPointsButton.on('click', () => {
        let timeSpent = lastPressTime - countdownTime;
        let score = pointsFloor + (pointsCeiling - pointsFloor) * (1 - (timeSpent / timeToFloor));
        score = Math.max(pointsFloor, Math.min(pointsCeiling, Math.floor(score)));
        socketService.addPoints(socketService.getUsername(), '100m_score', score);
        
        console.log(`Added ${score} points, time to answer: ${timeSpent}s`);
        lastPressTime = countdownTime;
    });
    addPointsButton.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });
    addPointsButton.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    return layer;
}