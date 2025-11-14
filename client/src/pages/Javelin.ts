// Javelin.ts - Creates the javelin game layer
// NOTE: this will soon be split into MVC structure
import Konva from 'konva';

export function createJavelin(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    
    //MiniGame background display
    const JavelinBackground = new Konva.Group({
        x: 0,
        y: 0,
    });

    //sky
    const sky = new Konva.Rect({
        x:0,
        y:0,
        width: stage.width(),
        height: stage.height()/4,
        fill: '#94d8efff',
        stroke: 'black'
    });
    JavelinBackground.add(sky);
    //grass
    const grass = new Konva.Rect({
        x:0,
        y:stage.height()/4,
        width: stage.width(),
        height: 3*stage.height()/4,
        fill: '#64cc68ff',
        stroke: 'black'
    });
    //Javelin throw mount
    const mount = new Konva.Ellipse({
        x: 50,
        y: stage.height(),
        radiusX: 400,
        radiusY: 200,
        fill: '#ED8272',
        stroke: 'white',
        strokeWidth: 4
    });

    JavelinBackground.add(grass);
    JavelinBackground.add(mount);

    layer.add(JavelinBackground);

    // Display game name
    const gameNameText = new Konva.Text({
        x: 0,
        y: 20,
        width: stage.width(),
        align: 'center',
        
        text: 'Javelin Throw',
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