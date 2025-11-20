// HundredMeterDash.ts - Creates the hundred meter dash game layer
// NOTE: this will soon be split into MVC structure 
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
    submitBtn.style.transform = 'translateX(-50%)';
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

    socketService.setProblemHandlers(handleNewProblem, handleSubmitResult);

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