// HundredMeterDash.ts - Creates the hundred meter dash game layer
// NOTE: this will soon be split into MVC structure 
import Konva from 'konva';
import standImageSrc from "../../../shared/fanStands.jpg";

export function createHundredMeterDash(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    // Creating minigame background graphics
    const MeterDashBack = new Konva.Group({
        x: 0,
        y: 0,
    });
    Konva.Image.fromURL(standImageSrc, (image) => {
        // size it to the stage so it won’t overflow
        image.position({ x: 0, y: 0 });
        image.width(stage.width());
        image.height(stage.height()/4);
        MeterDashBack.add(image);
        layer.batchDraw(); // redraw when image finishes loading
    });

    const trackField = new Konva.Rect({
        x:0,
        y:stage.height()/4,
        width: stage.width(),
        height: stage.height()/2,
        fill: '#ED8272',
        stroke: 'white'
    });
    MeterDashBack.add(trackField);

    for(let i = 0; i < 5; i++){
        let lanesY = (stage.height()/4) + ( i* ((stage.height()/2)/5));

        const laneLine = new Konva.Line({
            points: [0, lanesY, stage.width(), lanesY],
            stroke: "white",
            strokeWidth: 5,
        });

        MeterDashBack.add(laneLine);
    }

    const finishLine = new Konva.Line({
        points: [3*stage.height()/4 + 200, (3*stage.height()/4), 7*stage.height()/8 + 200, (stage.height()/4)],
        stroke: 'white',
        strokeWidth: 5
    });
    MeterDashBack.add(finishLine);

    const grass = new Konva.Rect({
        x:0,
        y:3*stage.height()/4,
        width: stage.width(),
        height: stage.height()/4,
        fill: '#64cc68ff',
        stroke: 'white'
    });

    MeterDashBack.add(grass);
    layer.add(MeterDashBack);
    // Display game name
    const gameNameText = new Konva.Text({
        x: 0,
        y: 20,
        width: stage.width(),
        align: 'center',
        
        text: '100 Meter Dash',
        fontSize: 50,
        fontStyle: 'bold',
        fill: 'black',
    });
    layer.add(gameNameText);

    // Countdown text
    const countdownWidth = 200;
    const countdownHeight = 30;

    const countdownRect = new Konva.Rect({
        x: 0,
        y: 0,
        width: countdownWidth,
        height: countdownHeight,
        fill: 'white',
        stroke: 'black',
        align: 'center',
        strokeWidth: 2,
    });

    const countdownText = new Konva.Text({
        x: 0,
        y: 5,
        width: countdownWidth,
        height: countdownHeight,
        text: 'Time: --s',
        fontSize: 28,
        align: 'center',
        verticalAlign: 'middle',
    });

    const countdownDisplay = new Konva.Group({
        x: stage.width() / 2 - 120,
        y: 90,
    });
    countdownDisplay.add(countdownRect);
    countdownDisplay.add(countdownText);
    layer.add(countdownDisplay);

    // Local function to update the timer display
    function updateTimer(time: number): void {
        countdownText.text(`Time: ${Math.max(0, time)}s`);
        layer.draw();
    }

    // Expose public method for app.ts to push timer updates
    (layer as any).updateTimer = (time: number) => {
        updateTimer(time);
    };

    // Leave Game button (positioned below the countdown)
    const leaveButtonGroup = new Konva.Group();
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

    leaveButtonGroup.add(leaveButtonRect);
    leaveButtonGroup.add(leaveButtonText);
    layer.add(leaveButtonGroup);

    leaveButtonGroup.on('click', () => {
        onLeaveGame();
    });

    leaveButtonGroup.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
    });
    leaveButtonGroup.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
    });

    return layer;
}