import { io, Socket } from 'socket.io-client';
import { UpdateLeaderboardPayload, CountdownTickPayload, TransitionGamePayload, GameState } from '../../../shared/types/index.js';
import { ScoreType } from '../../../shared/types/index.js';

class SocketService {
    private socket: Socket | null = null;
    private username: string = '';
    private transitionHandler: ((gameState: GameState) => void) | null = null;
    private leaderboardHandler: ((payload: UpdateLeaderboardPayload) => void) | null = null;
    private countdownHandler: ((payload: CountdownTickPayload) => void) | null = null;

    // Initialize and connect to the server
    connect(username: string): void {
        this.username = username;

        // Connect to server with username in handshake
        this.socket = io('http://localhost:3000', {
            transports: ['websocket'],
            auth: {
                username: username
            }
        });

        // Setup event listeners
        this.setupListeners();
    }

    // Setup socket event listeners
    private setupListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (message: string) => {
            console.error('Socket error:', message);
            alert(`Error: ${message}`);
        });

        this.socket.on('updateLeaderboard', (payload: UpdateLeaderboardPayload) => {
            console.log('Leaderboard updated:', payload.leaderboard);
            if (this.leaderboardHandler) {
                this.leaderboardHandler(payload);
            }
        });

        this.socket.on('countDownTick', (payload: CountdownTickPayload) => {
            console.log('Countdown tick:', payload);
            if (this.countdownHandler) {
                this.countdownHandler(payload);
            }
        });

        this.socket.on('transitionGame', (payload: TransitionGamePayload) => {
            console.log('Game transition:', payload.game_state);
            if (this.transitionHandler) {
                this.transitionHandler(payload.game_state);
            }
        });
    }

    // Set the universal leaderboard update handler
    setLeaderboardHandler(handler: (payload: UpdateLeaderboardPayload) => void): void {
        this.leaderboardHandler = handler;
    }

    // Set the universal countdown tick handler
    setCountdownHandler(handler: (payload: CountdownTickPayload) => void): void {
        this.countdownHandler = handler;
    }

    // Register a callback for countdown ticks
    onCountdownTick(callback: (payload: CountdownTickPayload) => void): void {
        if (!this.socket) return;
        this.socket.on('countDownTick', callback);
    }

    // Set the universal transition handler
    setTransitionHandler(handler: (gameState: GameState) => void): void {
        this.transitionHandler = handler;
    }

    // Add points for the current player
    addPoints(username: string, scoreType: ScoreType, score: number): void {
        if (!this.socket) return;
        this.socket.emit('addPoints', username, scoreType, score);
    }

    // Disconnect from server
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Get current username
    getUsername(): string {
        return this.username;
    }

    // Check if socket is connected
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

// Export singleton instance
export const socketService = new SocketService();