// Javelin.ts - Creates the javelin game layer
// NOTE: this will soon be split into MVC structure
import Konva from 'konva';
import { socketService } from '../services/socket.js';
import { MultipleChoiceProblem, SubmitMultipleChoiceResponse } from '../../../shared/types/index.js';

export function createJavelin(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
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
    let alive = true;
    let currentProblem: MultipleChoiceProblem | null = null;

    function updateTimer(time: number): void {
        countdownText.text(`Time: ${Math.max(0, time)}s`);
        layer.draw();
        // If timer hit zero and player is still alive and a problem was present -> fall
        if (time <= 0 && alive) {
            handlePlayerFall();
        }
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

    // ===== Javelin arrow (local only) =====
    const arrowGroup = new Konva.Group({ x: stage.width() / 2 - 60, y: 220 });
    const shaft = new Konva.Rect({ x: 0, y: 0, width: 120, height: 6, fill: 'brown' });
    const head = new Konva.Line({ points: [120, 3, 140, -7, 140, 13], closed: true, fill: 'gray', stroke: 'black' });
    arrowGroup.add(shaft);
    arrowGroup.add(head);
    layer.add(arrowGroup);

    const groundY = 460;

    function resetArrow() {
        arrowGroup.y(220);
        arrowGroup.rotation(0);
        layer.batchDraw();
    }

    function animateFall() {
        const tween = new Konva.Tween({
            node: arrowGroup,
            duration: 0.8,
            y: groundY,
            easing: Konva.Easings.EaseIn,
        });
        tween.play();
    }

    function handlePlayerFall() {
        if (!alive) return;
        alive = false;
        feedbackText.text('You fell!');
        // hide buttons
        Object.values(btns).forEach(b => { b.style.display = 'none'; b.disabled = true; });
        animateFall();
        layer.draw();
    }

    // ===== Socket handlers =====
    function handleNewMC(problem: MultipleChoiceProblem) {
        // player receives a new MC problem
        alive = true;
        currentProblem = problem;
        problemText.text(`${problem.operand1} ÷ ${problem.operand2} = ?`);
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
        layer.draw();
    }

    function handleMCResult(resp: SubmitMultipleChoiceResponse) {
        if (resp.finished) {
            feedbackText.text('Finished! Waiting for others...');
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
