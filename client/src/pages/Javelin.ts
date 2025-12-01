// Javelin.ts - Creates the javelin game layer
// NOTE: this will soon be split into MVC structure
import Konva from 'konva';
import { socketService } from '../services/socket.js';
import JavelinImageSrc from "../../../shared/JavelinIcon.png";
import { MultipleChoiceProblem, SubmitMultipleChoiceResponse } from '../../../shared/types/index.js';

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
    Konva.Image.fromURL(JavelinImageSrc, (image) => {
            // size it to the stage so it won’t overflow
            image.position({ x: 50, y: stage.height() - 400 });
            image.width(300);
            image.height(400);
            JavelinBackground.add(image);
            layer.batchDraw(); // redraw when image finishes loading
    });

    JavelinBackground.add(grass);
    JavelinBackground.add(mount);

    layer.add(JavelinBackground);

    const flightScene = new Konva.Group({
        x: 0,
        y: 0,
        visible: false,
    });

    const flightSky = new Konva.Rect({
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height() * 0.5,
        fill: '#94d8efff',
    });

    const flightGrass = new Konva.Rect({
        x: 0,
        y: stage.height() * 0.5,
        width: stage.width(),
        height: stage.height() * 0.5,
        fill: '#64cc68ff',
    });

    flightScene.add(flightSky);
    flightScene.add(flightGrass);
    layer.add(flightScene);

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
        x: 20,
        y: 20,
    });
    countdownDisplay.add(countdownRect);
    countdownDisplay.add(countdownText);
    layer.add(countdownDisplay);

    // Local function to update the timer display
    let alive = true;
    let isWaiting = false; // when player is done, replace timer with waiting text
    let animationMode = false; // true during JAVELIN_ANIMATION phase

    function updateTimer(time: number): void {
        if (animationMode) {
            countdownText.text(`Animation: ${Math.max(0, time)}s`);
            layer.draw();
            return;
        }
        if (isWaiting) {
            countdownText.text('Waiting for other players...');
            layer.draw();
            return;
        }
        countdownText.text(`Time: ${Math.max(0, time)}s`);
        layer.draw();
        // If sprint timer hit zero and player is still alive -> fall (end of sprint)
        //if (time <= 0 && alive) {
            //handlePlayerFall();
        //}
    }

    // Expose public method for app.ts to push timer updates
    (layer as any).updateTimer = (time: number) => {
        updateTimer(time);
    };
    (layer as any).resetGame = () => {
        resetGame();
    };
    (layer as any).setPhase = (phase: string) => {
        animationMode = phase === 'JAVELIN_ANIMATION';
        if (animationMode) {
            // Hide problem UI during animation phase
            Object.values(btns).forEach(b => { b.style.display = 'none'; b.disabled = true; });
            problemText.text('Throw distance animation...');
            feedbackText.text('');

            animateThrow(() => {
                JavelinBackground.visible(false);
                flightScene.visible(true);

                // put javelin in the sky view and start fall / flight there
                // position in new scene
                animateFall();      // or whatever fall animation you use
                layer.draw();
            });
            // Keep arrow where it fell; future enhancement could animate based on score
        } else if (phase === 'MINIGAME') {
            // Reset for new sprint phase
            resetArrow();
            resetArrowFlight();
        }
        layer.draw();
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

    // ===== Problem UI (HTML buttons) =====
    const problemText = new Konva.Text({
        x: 0,
        y: 100,
        width: stage.width(),
        align: 'center',
        text: 'Waiting for problem...',
        fontSize: 28,
        fill: 'black'
    });
    layer.add(problemText);

    const feedbackText = new Konva.Text({
        x: 0,
        y: 140,
        width: stage.width(),
        align: 'center',
        text: '',
        fontSize: 20,
        fill: 'black'
    });
    layer.add(feedbackText);

    // Create four HTML buttons for A-D
    const btns: Record<string, HTMLButtonElement> = {};
    const choices = ['A', 'B', 'C', 'D'];
    const container = stage.container();
    choices.forEach((label, i) => {
        const btn = document.createElement('button');
        btn.textContent = `${label}: `;
        btn.style.position = 'absolute';
        btn.style.left = `${50 + i * 170}px`;
        btn.style.top = '200px';
        btn.style.padding = '8px 12px';
        btn.style.fontSize = '16px';
        btn.style.display = 'none';
        container.appendChild(btn);
        btns[label] = btn;
        btn.addEventListener('click', () => {
            if (!alive) return;
            // disable until result
            Object.values(btns).forEach(b => b.disabled = true);
            socketService.submitMultipleChoice(label as 'A' | 'B' | 'C' | 'D');
        });
    });
    
    // ===== Javelin arrow (being thrown) =====
    
    // a bit above the bottom so the ground is visible
    const groundY = stage.height() - 40;

    // starting point near the thrower’s hand (tweak these if needed)
    const throwStartX = 3*stage.width()/4 + 100;                 // move right/left to line up with sprite
    const throwStartY = stage.height()/8; // move up/down to sit in the hand
    const pivotX = stage.width();                 // move right/left to line up with sprite
    const pivotY = 3*stage.height()/ 4; // move up/down to sit in the hand

    // Group pivot = bottom of the spear
    const arrowGroup = new Konva.Group({
        x: pivotX,
        y: pivotY,
        offsetX:1,
        offsetY:throwStartY,
    });

    // spear geometry
    const shaftLength = 300;

    // Shaft: goes UP from the pivot
    const shaft = new Konva.Rect({
        x: -throwStartX,                   // center on x = 0
        y: -throwStartY,         // top of shaft
        offsetX: 3,
        offsetY: 150,
        width: 6,
        height: shaftLength,     // down to y = 0 (pivot)
        fill: 'brown',
        rotation: 45
    });
    arrowGroup.add(shaft);
    JavelinBackground.add(arrowGroup);


    // ===== Javelin arrow (falling down) =====
    // starting point near the thrower’s hand (tweak these if needed)
    const fallStartX = 200;                 // move right/left to line up with sprite
    const fallStartY = stage.height(); // move up/down to sit in the hand
    const fallpivotX = 300;                 // move right/left to line up with sprite
    const fallpivotY = 1.3*stage.height(); // move up/down to sit in the hand

    // Group pivot = bottom of the spear
    const arrowGroup_fall = new Konva.Group({
        x: fallpivotX,
        y: fallpivotY,
    });
    // spear geometry
    const shaftLength_two = 300;

    // Shaft: goes UP from the pivot
    const shaft_two = new Konva.Rect({
        x: -fallStartX,           
        y: -fallStartY,
        offsetX: 3,
        offsetY: 150,         
        width: 6,
        height: shaftLength_two,
        fill: 'brown',
        rotation: 90,

    });
    arrowGroup_fall.add(shaft_two);
    flightScene.add(arrowGroup_fall);

    function resetArrow() {
        arrowGroup.position({ x: pivotX, y: pivotY });
        arrowGroup.rotation(0);                       // straight up
        arrowGroup.scale({ x: 1, y: 1 });            // full size
        layer.batchDraw();
    }

    function resetArrowFlight() {
        arrowGroup_fall.position({ x: fallpivotX, y: fallpivotY }); 
        arrowGroup_fall.scale({ x: 1, y: 1 });            // full size
        layer.batchDraw();
    }

    function animateFall() {
        resetArrowFlight();
        const angularSpeed = 180; 
        const scaleSpeed = 0.0005;               
        const maxRotation = 70;           
        const startAngle = arrowGroup_fall.rotation(); 
        const anim = new Konva.Animation((frame) => {
            if (!frame) return;

            const angleDiff = (frame.timeDiff * angularSpeed) / 10000;
            const newAngle = arrowGroup_fall.rotation() + angleDiff;

            if (newAngle >= startAngle + maxRotation) {
                arrowGroup_fall.rotation(startAngle + maxRotation);
                arrowGroup_fall.scale();

                const currentScale = arrowGroup_fall.scaleX();
                const newScale = currentScale - frame.timeDiff * scaleSpeed;

                arrowGroup_fall.scale({x: newScale, y: newScale});
                anim.stop();
                return;
            }
            arrowGroup_fall.rotation(newAngle);
        
        }, layer);

        anim.start();
    }

    function animateThrow(onReachSky: () => void) {
        resetArrow();
        const angularSpeed = 180;                
        const maxRotation = 60;           
        const startAngle = arrowGroup.rotation(); 

        const anim = new Konva.Animation((frame) => {
            if (!frame) return;

            const angleDiff = (frame.timeDiff * angularSpeed) / 10000;
            const newAngle = arrowGroup.rotation() + angleDiff;

            if (newAngle >= startAngle + maxRotation) {
                arrowGroup.rotation(startAngle + maxRotation);
                anim.stop();

                onReachSky();
                return;
            }

            arrowGroup.rotation(newAngle);
        
        }, layer);

        anim.start();
    }
    

    function handlePlayerFall() {
        if (!alive) return;
        alive = false;
        isWaiting = true;
        // Replace timer with waiting message
        countdownText.text('Waiting for other players...');
        feedbackText.text('');
        // hide buttons
        Object.values(btns).forEach(b => { b.style.display = 'none'; b.disabled = true; });
        animateFall();
        layer.draw();
    }

    // ===== Socket handlers =====
    function handleNewMC(problem: MultipleChoiceProblem) {
    alive = true;
    isWaiting = false;
    animationMode = false;
        const expr = problem.type === 'ADDITION'
            ? `${problem.operand1} + ${problem.operand2} = ?`
            : `${problem.operand1} ÷ ${problem.operand2} = ?`;
        problemText.text(expr);
        feedbackText.text('');
        // populate buttons
        (['A','B','C','D'] as const).forEach((label) => {
            const btn = btns[label];
            btn.textContent = `${label}: ${problem[label]}`;
            btn.style.display = 'inline-block';
            btn.disabled = false;
        });
        // reset arrow if needed
        resetArrow();
        resetArrowFlight();
        layer.draw();
    }

    function handleMCResult(resp: SubmitMultipleChoiceResponse) {
        if (animationMode) {
            // Ignore results during animation phase
            return;
        }
        if (resp.finished) {
            isWaiting = true;
            countdownText.text('Waiting for other players...');
            feedbackText.text('');
            Object.values(btns).forEach(b => { b.style.display = 'none'; b.disabled = true; });
            layer.draw();
            return;
        }
        if (resp.correct) {
            feedbackText.text('Correct!');
            // buttons will be hidden until next problem arrives
            Object.values(btns).forEach(b => b.disabled = true);
        } else {
            // incorrect -> fall
            handlePlayerFall();
        }
        layer.draw();
    }

    function resetGame() {
        // core flags
        alive = true;
        isWaiting = false;
        animationMode = false;

        // show main scene, hide flight scene
        JavelinBackground.visible(true);
        flightScene.visible(false);

        // reset arrows
        resetArrow();
        resetArrowFlight();
        arrowGroup.rotation(0);
        arrowGroup.scale({ x: 1, y: 1 });
        arrowGroup_fall.rotation(0);
        arrowGroup_fall.scale({ x: 1, y: 1 });

        // reset texts
        countdownText.text('Time: --s');
        problemText.text('Waiting for problem...');
        feedbackText.text('');

        // reset buttons (hidden but ready)
        Object.values(btns).forEach(b => {
            b.style.display = 'none';
            b.disabled = false;
        });

        layer.draw();
    }


    socketService.setJavelinHandlers(handleNewMC, handleMCResult);

    // Show/hide input methods for page visibility control
    (layer as any).showInput = () => {
        if (alive) {
            Object.values(btns).forEach(b => b.style.display = 'inline-block');
        }
    };
    (layer as any).hideInput = () => {
        Object.values(btns).forEach(b => b.style.display = 'none');
    };

    return layer;
}
