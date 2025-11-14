// HundredMeterDash.ts - Creates the hundred meter dash game layer
// NOTE: this will soon be split into MVC structure 
import Konva from 'konva';
import { Leaderboard, Problem } from '../../../shared/types/index.js';
import { socketService } from '../services/socket.js';

export function createHundredMeterDash(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    // ===== Problem input HTML elements =====
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Enter answer';
    answerInput.style.position = 'absolute';
    answerInput.style.left = '50%';
    answerInput.style.top = '180px';
    answerInput.style.transform = 'translateX(-50%)';
    answerInput.style.width = '160px';
    answerInput.style.padding = '6px';
    answerInput.style.fontSize = '18px';
    answerInput.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.style.position = 'absolute';
    submitBtn.style.left = '50%';
    submitBtn.style.top = '230px';
    submitBtn.style.transform = 'translateX(-50%)';
    submitBtn.style.padding = '8px 20px';
    submitBtn.style.fontSize = '16px';
    submitBtn.style.display = 'none';

    // Append inputs to the Konva container so positioning is relative to the stage
    const container = stage.container();
    container.appendChild(answerInput);
    container.appendChild(submitBtn);

    // Problem display (static problem statement)
    const problemText = new Konva.Text({
        x: 0,
        y: 100,
        width: stage.width(),
        align: 'center',
        text: 'Waiting for first problem...',
        fontSize: 28,
        fill: 'black'
    });
    layer.add(problemText);
    // Feedback display (separate so problem is always visible)
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

    // ===== Tracks & Player Dots =====
    const tracksGroup = new Konva.Group({ x: 50, y: 260 });
    layer.add(tracksGroup);
    const trackWidth = stage.width() - 120; // progress width
    const laneHeight = 30;
    const laneGap = 10;
    const localUsername = () => socketService.getUsername();
    const playerLaneMap: Map<string, { laneGroup: Konva.Group; dot: Konva.Circle; laneIndex: number }> = new Map();

    function renderTracks(leaderboard: Leaderboard) {
        tracksGroup.destroyChildren();
        playerLaneMap.clear();
        // Sort with local user first, then others alphabetically
        const sorted = [...leaderboard].sort((a, b) => {
            if (a.username === localUsername()) return -1;
            if (b.username === localUsername()) return 1;
            return a.username.localeCompare(b.username);
        });
        sorted.forEach((player, idx) => {
            const laneY = idx * (laneHeight + laneGap);
            const lane = new Konva.Rect({
                x: 0,
                y: laneY,
                width: trackWidth,
                height: laneHeight,
                fill: '#f4f4f4',
                stroke: '#ccc',
                strokeWidth: 1
            });
            const nameLabel = new Konva.Text({
                x: -40,
                y: laneY + 4,
                text: player.username,
                fontSize: 12,
                fill: player.active ? 'black' : 'red'
            });
            const dot = new Konva.Circle({
                x: 0,
                y: laneY + laneHeight / 2,
                radius: 10,
                fill: player.username === localUsername() ? 'blue' : 'green',
                stroke: 'black',
                strokeWidth: 1
            });
            tracksGroup.add(lane);
            tracksGroup.add(nameLabel);
            tracksGroup.add(dot);
            playerLaneMap.set(player.username, { laneGroup: tracksGroup, dot, laneIndex: idx });
        });
    }

    function updateDots(leaderboard: Leaderboard) {
        leaderboard.forEach(player => {
            const entry = playerLaneMap.get(player.username);
            if (!entry) return;
            const ratio = Math.min(1, Math.max(0, player['100m_score'] / 100));
            entry.dot.x(ratio * trackWidth);
        });
        layer.batchDraw();
    }

    (layer as any).updateProgress = (leaderboard: Leaderboard) => {
        // Rebuild tracks every time the leaderboard changes to ensure new players are shown.
        renderTracks(leaderboard);
        updateDots(leaderboard);
    };

    // ===== Problem flow handlers =====
    let finished = false;
    let currentProblem: Problem | null = null;
    function handleNewProblem(problem: Problem) {
        if (finished) return;
        currentProblem = problem;
        problemText.text(`${problem.operand1} × ${problem.operand2} = ?`);
        feedbackText.text('');
        answerInput.value = '';
        answerInput.style.display = 'block';
        submitBtn.style.display = 'block';
        layer.draw();
    }

    function handleSubmitResult(resp: { correct: boolean; finished: boolean }) {
        if (resp.finished) {
            finished = true;
            feedbackText.text('Finished! Waiting for others...');
            answerInput.style.display = 'none';
            submitBtn.style.display = 'none';
            layer.draw();
            return;
        }
        if (resp.correct) {
            feedbackText.text('Correct! Loading next...');
        } else {
            // Keep original problem visible
            if (currentProblem) {
                problemText.text(`${currentProblem.operand1} × ${currentProblem.operand2} = ?`);
            }
            feedbackText.text('Incorrect, try again');
        }
        layer.draw();
    }

    submitBtn.addEventListener('click', () => {
        if (!finished) {
            const val = Number(answerInput.value.trim());
            if (Number.isFinite(val)) {
                socketService.submitAnswer(val);
            } else {
                alert('Enter a valid number');
            }
        }
    });

    // Register handlers with socket service
    socketService.setProblemHandlers(handleNewProblem, handleSubmitResult);

    // Show/hide input methods for page visibility control
    (layer as any).showInput = () => {
        if (!finished) {
            answerInput.style.display = 'block';
            submitBtn.style.display = 'block';
        }
    };
    (layer as any).hideInput = () => {
        answerInput.style.display = 'none';
        submitBtn.style.display = 'none';
    };

    return layer;
}