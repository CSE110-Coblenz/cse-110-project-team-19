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
    function updateTimer(time: number): void {
        countdownText.text(`Time: ${Math.max(0, time)}s`);
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