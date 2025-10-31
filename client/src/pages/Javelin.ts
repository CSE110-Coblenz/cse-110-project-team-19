// Javelin.ts - Creates the javelin game layer
// NOTE: this will soon be split into MVC structure
import Konva from 'konva';

export function createJavelin(stage: Konva.Stage, onSuccess: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    
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
    const countdownHeight = 80;

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
        text: 'Time: xx:xx',
        fontSize: 32,
        align: 'center',
        verticalAlign: 'middle',
    });

    const countdownDisplay = new Konva.Group();
    countdownDisplay.add(countdownRect);
    countdownDisplay.add(countdownText);
    layer.add(countdownDisplay);

    return layer;
}