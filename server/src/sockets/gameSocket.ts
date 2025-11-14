import { Server, Socket } from 'socket.io';
import { GameManager } from '../services/GameManager.js';
import { UpdateLeaderboardPayload, TransitionGamePayload, CountdownTickPayload, SubmitProblemRequest, SubmitProblemResponse, NewProblemPayload } from '../../../shared/types/index.js';

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;
export function setupGameSocket(io: Server): void {
    // Initialize GameManager with io instance
    const gameManager = GameManager.getInstance(io);
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Get username from connection handshake
        const username = socket.handshake.auth.username;
           const trimmed = String(username ?? '').trim();

        if (!trimmed) {
            console.error('No username provided in connection');
            socket.emit('error', 'Username is required'); // 与原行为一致
            socket.disconnect();
            return;
        }

        if (!USERNAME_REGEX.test(trimmed)) {
            console.error('Invalid username format:', trimmed);
            socket.emit('error', 'Username must be 3–16 chars: letters, numbers, underscore only');
            socket.disconnect();
            return;
        }


        try {
            // Check if username is already active
            if (gameManager.isUsernameActive(username)) {
                socket.emit('error', 'Username is already active');
                socket.disconnect();
                return;
            }

            // Add player to a game
            const { game, gameId, isNewGame } = gameManager.addPlayerToGame(socket.id, username);

            // Join the Socket.IO room for this game
            const roomName = `game-${gameId}`;
            socket.join(roomName);

            console.log(`Player ${username} joined game ${gameId}${isNewGame ? ' (new game created)' : ''}`);

            // If this is a new game, start the timer
            if (isNewGame) {
                game.startTimer();
            }

            // Emit transitionGame event to THIS player only (trigger page transition)
            const transitionPayload: TransitionGamePayload = { game_state: 'PREGAME' };
            socket.emit('transitionGame', transitionPayload);

            // If joining an existing game, send current countdown state to this player
            if (!isNewGame && game.getGameState() === 'PREGAME') {
                const countdownPayload: CountdownTickPayload = {
                    game_state: game.getGameState(),
                    time: game.getTimeRemaining()
                };
                socket.emit('countDownTick', countdownPayload);
            }

            // Emit updated leaderboard to all players in this game
            const leaderboard = game.getLeaderboard();
            const leaderboardPayload: UpdateLeaderboardPayload = { leaderboard };
            io.to(roomName).emit('updateLeaderboard', leaderboardPayload);

        } catch (error) {
            console.error('Error joining game:', error);
            socket.emit('error', 'Failed to join game');
            socket.disconnect();
        }

        // Handle player disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            const result = gameManager.removePlayer(socket.id);
            if (result) {
                const { game, username } = result;
                console.log(`Player ${username} disconnected`);

                if (game) {
                    const gameId = game.getGameId();
                    const roomName = `game-${gameId}`;

                    // Emit updated leaderboard to remaining players
                    const leaderboard = game.getLeaderboard();
                    const payload: UpdateLeaderboardPayload = { leaderboard };
                    io.to(roomName).emit('updateLeaderboard', payload);
                }
            }
        });
    });

    // Problem flow events
    io.on('connection', (socket: Socket) => {
        // Client requests to submit an answer for current problem
        socket.on('submitProblem', (req: SubmitProblemRequest) => {
            try {
                const active = gameManager.getActiveUser(socket.id);
                if (!active) return;
                const game = gameManager.getGame(active.gameId);
                if (!game) return;

                const username = active.username;
                const problem = game.getCurrentProblem(username);
                if (!problem) {
                    const doneResp: SubmitProblemResponse = { correct: false, finished: true };
                    socket.emit('submitProblemResult', doneResp);
                    return;
                }

                const correct = Number(req?.answer) === game.getCorrectAnswer(problem);

                // Always send back the evaluation result
                const result: SubmitProblemResponse = { correct, finished: false };
                if (!correct) {
                    // Incorrect: subtract 2 meters
                    game.addDashMeters(username, -2);
                    // Broadcast updated leaderboard after penalty
                    const leaderboardPenalty = game.getLeaderboard();
                    io.to(`game-${game.getGameId()}`).emit('updateLeaderboard', { leaderboard: leaderboardPenalty });
                    socket.emit('submitProblemResult', result);
                    return;
                }

                // Correct answer: advance progress, add 10 meters
                const finished = game.advanceProblem(username);
                game.addDashMeters(username, 10);

                // Broadcast updated leaderboard to room
                const leaderboard = game.getLeaderboard();
                io.to(`game-${game.getGameId()}`).emit('updateLeaderboard', { leaderboard });

                // Respond to submitter
                result.finished = finished;
                socket.emit('submitProblemResult', result);

                // If finished, just wait for global timer; else send next problem to this client only
                if (!finished) {
                    const nextProblem = game.getCurrentProblem(username);
                    if (nextProblem) {
                        const payload: NewProblemPayload = { problem: nextProblem };
                        socket.emit('newProblem', payload);
                    }
                }
            } catch (err) {
                console.error('Error in submitProblem:', err);
            }
        });

        // Javelin multiple-choice submission (per-player)
        socket.on('submitMultipleChoice', (req: any) => {
            try {
                const active = gameManager.getActiveUser(socket.id);
                if (!active) return;
                const game = gameManager.getGame(active.gameId);
                if (!game) return;

                const username = active.username;
                const choice = req?.choice as 'A' | 'B' | 'C' | 'D';
                const result = game.handleJavelinSubmit(username, choice);

                // Send private response to player
                socket.emit('submitMultipleChoiceResult', { correct: result.correct, finished: result.finished });
            } catch (err) {
                console.error('Error in submitMultipleChoice:', err);
            }
        });
    });
}