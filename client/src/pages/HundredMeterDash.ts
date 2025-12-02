// HundredMeterDash.ts - Creates the hundred meter dash game layer
import Konva from 'konva';
import { Leaderboard, Problem } from '../../../shared/types/index.js';
import standImageSrc from '../../../shared/fanStands.jpg';
import playerIcon from '../../../shared/PlayerIcon.png';
import { socketService } from '../services/socket.js';

export function createHundredMeterDash(stage: Konva.Stage, onLeaveGame: () => void): Konva.Layer {
    const layer = new Konva.Layer();
    const backgroundGroup = new Konva.Group();
    layer.add(backgroundGroup);

    const trackTop = stage.height() / 4;           // visual track start Y
    const trackHeight = stage.height() / 2;        // visual track height (middle half)
    const trackLeft = 0;                          // left margin for track
    const trackRightMargin = 0;                   // right margin
    const trackWidthVisual = stage.width() - trackLeft - trackRightMargin;

    const standsHeight = stage.height() / 4;
    Konva.Image.fromURL(standImageSrc, (image) => {
        image.position({ x: 0, y: trackTop - standsHeight });
        image.width(stage.width());
        image.height(standsHeight);
        image.listening(false);
        backgroundGroup.add(image);
        layer.batchDraw(); // redraw when image finishes loading
    });

    // Track surface
    const trackRect = new Konva.Rect({
        x: trackLeft,
        y: trackTop,
        width: trackWidthVisual,
        height: trackHeight,
        fill: '#c86a35', // clay track color
        stroke: '#8b4513',
        strokeWidth: 2,
        listening: false,
    });
    backgroundGroup.add(trackRect);

    const laneCount = 5;
    for (let i = 1; i < laneCount; i++) {
        const y = trackTop + (trackHeight / laneCount) * i;
        const laneLine = new Konva.Line({
            points: [trackLeft, y, trackLeft + trackWidthVisual, y],
            stroke: 'white',
            strokeWidth: 2,
            dash: [12, 8],
            listening: false,
        });
        backgroundGroup.add(laneLine);
    }

    const finishLine = new Konva.Rect({
        x: trackLeft + trackWidthVisual - 4,
        y: trackTop,
        width: 4,
        height: trackHeight,
        fill: 'white',
        listening: false,
    });
    backgroundGroup.add(finishLine);

    const grassTop = trackTop + trackHeight;
    const grassHeight = Math.max(60, stage.height() - grassTop);
    const grassRect = new Konva.Rect({
        x: 0,
        y: grassTop,
        width: stage.width(),
        height: grassHeight,
        fill: '#4caf50',
        listening: false,
    });
    backgroundGroup.add(grassRect);

    const startLine = new Konva.Line({
        points: [trackLeft + 30, trackTop, trackLeft + 30, trackTop + trackRect.height()],
        stroke: '#ffffffff',
        listening: false,
    });
    backgroundGroup.add(startLine);

    const problemAreaY = grassTop + 10;
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Enter answer';
    answerInput.style.position = 'absolute';
    answerInput.style.left = '50%';
    answerInput.style.top = `${problemAreaY + 70}px`; // below problem & feedback
    answerInput.style.transform = 'translateX(-50%)';
    answerInput.style.width = '160px';
    answerInput.style.padding = '6px';
    answerInput.style.fontSize = '18px';
    answerInput.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.style.position = 'absolute';
    submitBtn.style.left = '50%';
    submitBtn.style.top = `${problemAreaY + 115}px`;
    submitBtn.style.transform = 'translateX(110%) translateY(-120%)';
    submitBtn.style.padding = '8px 20px';
    submitBtn.style.fontSize = '16px';
    submitBtn.style.display = 'none';

    stage.container().appendChild(answerInput);
    stage.container().appendChild(submitBtn);

    const problemText = new Konva.Text({
        x: 0,
        y: problemAreaY,
        width: stage.width(),
        align: 'center',
        text: 'Waiting for first problem...',
        fontSize: 32,
        fontStyle: 'bold',
        fill: 'white'
    });
    layer.add(problemText);
    const feedbackText = new Konva.Text({
        x: 0,
        y: problemAreaY + 40,
        width: stage.width(),
        align: 'center',
        text: '',
        fontSize: 24,
        fill: 'white'
    });
    layer.add(feedbackText);
    
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

    function updateTimer(time: number): void {
        countdownText.text(`Time: ${Math.max(0, time)}s`);
        layer.draw();
    }

    (layer as any).updateTimer = (time: number) => {
        updateTimer(time);
    };

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

    const tracksGroup = new Konva.Group();
    layer.add(tracksGroup);
    const localUsername = () => socketService.getUsername();
    const playerLaneMap: Map<string, { dot: Konva.Circle; playerIcon? : Konva.Image; laneIndex: number; label: Konva.Text }> = new Map();

    function renderTracks(leaderboard: Leaderboard) {
        tracksGroup.destroyChildren();
        playerLaneMap.clear();
        const laneHeightDynamic = trackHeight / laneCount;
        const sorted = [...leaderboard].sort((a, b) => {
            if (a.username === localUsername()) return -1;
            if (b.username === localUsername()) return 1;
            return a.username.localeCompare(b.username);
        });
        sorted.forEach((player, idx) => {
            const laneCenterY = trackTop + laneHeightDynamic / 2 + idx * laneHeightDynamic;
            const nameLabel = new Konva.Text({
                x: trackLeft + 30,
                y: laneCenterY - 8,
                text: player.username,
                fontSize: 14,
                fontStyle: player.username === localUsername() ? 'bold' : 'normal',
                fill: player.active ? 'black' : 'red'
            });
            const dot = new Konva.Circle({
                x: trackLeft, // start at beginning of track
                y: laneCenterY,
                radius: 10,
                fill: player.username === localUsername() ? 'blue' : 'green',
                stroke: 'black',
                strokeWidth: 1
            });

            const entry = {
                dot,
                playerIcon: undefined as Konva.Image | undefined,
                laneIndex: idx,
                label: nameLabel,
            };

            tracksGroup.add(nameLabel);
            tracksGroup.add(dot);
            playerLaneMap.set(player.username, entry);

            Konva.Image.fromURL(playerIcon, (image) => {
                let radius = dot.radius();

                image.width(radius * 6);
                image.height(radius * 6);

                // Center the image over its (x, y)
                image.offsetX(image.width() / 2);
                image.offsetY(image.height() / 2);

                // Position exactly where the dot is
                image.position({
                    x: dot.x(),
                    y: dot.y(),
                });
                entry.dot.hide();
                entry.playerIcon = image;
                image.listening(false);
                tracksGroup.add(image);
                layer.batchDraw(); // redraw when image finishes loading
            });
        });
    }

    function updateDots(leaderboard: Leaderboard) {
        leaderboard.forEach(player => {
            const entry = playerLaneMap.get(player.username);
            if (!entry) return;
            const ratio = Math.min(1, Math.max(0, player['100m_score'] / 100));
            entry.dot.x(trackLeft + ratio * (trackWidthVisual - 14)); // leave a little buffer before finish line
            if(entry.playerIcon){
                entry.playerIcon.x(trackLeft + ratio * (trackWidthVisual - 14));
                if(ratio == 1){
                    entry.label.x(trackLeft + ratio * (trackWidthVisual - 14) - 60);
                }
                else{
                    entry.label.x(trackLeft + ratio * (trackWidthVisual - 14) + 30);
                }
            }
        });
        layer.batchDraw();
    }

    let previousPlayersKey = '';

    (layer as any).updateProgress = (leaderboard: Leaderboard) => {
        const sortedUsernames = [...leaderboard]
            .sort((a, b) => {
                if (a.username === localUsername()) return -1;
                if (b.username === localUsername()) return 1;
                return a.username.localeCompare(b.username);
            })
            .map(p => `${p.username}:${p.active ? '1' : '0'}`); // include active flag for lane coloring
        const key = sortedUsernames.join('|');
        if (key !== previousPlayersKey) {
            previousPlayersKey = key;
            renderTracks(leaderboard); // rebuild only if composition or active state changed
        }
        updateDots(leaderboard);
    };

    let finished = false;
    let currentProblem: Problem | null = null;
    function resetDash() {
        finished = false;
        currentProblem = null;
        problemText.text('Waiting for first problem...');
        feedbackText.text('');
        answerInput.value = '';
        answerInput.style.display = 'none';
        submitBtn.style.display = 'none';
        layer.draw();
    }
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
            feedbackText.text('Incorrect, try again (+5 seconds)');
        }
        layer.draw();
    }

    //  centralize submit logic so both the button
    // and the Enter key path call exactly the same handler and send the same payload.
    function attemptSubmit() {
        if (finished) return;

        const value = answerInput.value.trim();
        const val = Number(value);

        if (!Number.isFinite(val)) {
            alert('Enter a valid number');
            return;
        }

        socketService.submitAnswer(val);
    }
     //  clicking the HTML "Submit" button uses the shared submit handler.
    submitBtn.addEventListener('click', () => {
        attemptSubmit();
    });

     //  pressing Enter while the answer input is focused also submits
    // the answer via the same handler as clicking the button.
    answerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            attemptSubmit();
        }
    });

    socketService.setProblemHandlers(handleNewProblem, handleSubmitResult);

    // Expose reset for rejoining new games
    (layer as any).resetDash = resetDash;

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