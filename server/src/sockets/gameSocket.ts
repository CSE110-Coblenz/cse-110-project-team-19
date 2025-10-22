import { Server, Socket } from 'socket.io';
import { gameManager } from '../services/GameManager.js';
import { UpdateLeaderboardPayload, TransitionGamePayload } from '../../../shared/types/index.js';

export function setupGameSocket(io: Server): void {
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Get username from connection handshake
        const username = socket.handshake.auth.username;

        if (!username || typeof username !== 'string') {
            console.error('No username provided in connection');
            socket.emit('error', 'Username is required');
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
            const { game, gameId } = gameManager.addPlayerToGame(socket.id, username);

            // Join the Socket.IO room for this game
            const roomName = `game-${gameId}`;
            socket.join(roomName);

            console.log(`Player ${username} joined game ${gameId}`);

            // Emit transitionGame event to THIS player only (trigger page transition)
            const transitionPayload: TransitionGamePayload = { game_state: 'PREGAME' };
            socket.emit('transitionGame', transitionPayload);

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
}