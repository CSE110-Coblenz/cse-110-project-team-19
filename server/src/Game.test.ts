import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { Game } from './services/Game.js';
import { GameManager } from './services/GameManager.js';
import { Server } from 'socket.io';

describe('Game / GameManager', () => {
	let mockEmit: ReturnType<typeof vi.fn>;
	let io: Server;

	beforeEach(() => {
		// reset singleton instance between tests
		(GameManager as unknown as any).instance = undefined;

		mockEmit = vi.fn();
		io = {
			to: vi.fn().mockReturnValue({ emit: mockEmit })
		} as unknown as Server;
	});

	afterEach(() => {
		// CRITICAL: Stop all game timers before cleaning up
		const gm = (GameManager as unknown as any).instance;
		if (gm) {
			const games = (gm as any).games;
			if (games) {
				games.forEach((game: Game) => {
					game.stopTimer(); // Stop the timer to prevent hanging
				});
			}
		}

		vi.restoreAllMocks();
		// ensure singleton removed after test
		(GameManager as unknown as any).instance = undefined;
	});

	afterAll(() => {
		// Final cleanup: ensure all timers are stopped
		const gm = (GameManager as unknown as any).instance;
		if (gm) {
			const games = (gm as any).games;
			if (games) {
				games.forEach((game: Game) => {
					game.stopTimer();
				});
				games.clear();
			}
		}
		
		(GameManager as unknown as any).instance = undefined;
		vi.clearAllTimers(); // Clear any remaining timers
	});

	it('calls addPlayer on the game and increments player count when a player connects', () => {
		const addPlayerSpy = vi.spyOn(Game.prototype, 'addPlayer');

		const gm = GameManager.getInstance(io);

		const socketId = 'socket-1';
		const username = 'alice';

		// No game exists yet; addPlayerToGame should create one and add the player
		const result = gm.addPlayerToGame(socketId, username);

		// ensure addPlayer was called with the username
		expect(addPlayerSpy).toHaveBeenCalled();
		expect(addPlayerSpy).toHaveBeenCalledWith(username);

		// the returned game should reflect one player added
		const game = result.game;
		expect(game.getPlayerCount()).toBe(1);
		expect(game.hasPlayer(username)).toBe(true);
	});

	it('creates a new game when no available game exists', () => {
		const gm = GameManager.getInstance(io);

		const socketId = 'socket-1';
		const username = 'alice';

		const result = gm.addPlayerToGame(socketId, username);

		// ensure a new game was created
		expect(result.game).toBeDefined();
		expect(result.game.getPlayerCount()).toBe(1);
		expect(result.game.hasPlayer(username)).toBe(true);
	});

	it('adds a player to an existing game with available slots', () => {
		const gm = GameManager.getInstance(io);
		const socketId1 = 'socket-1';
		const username1 = 'alice';
		const socketId2 = 'socket-2';
		const username2 = 'bob';

		// Add first player, creating a new game
		const result1 = gm.addPlayerToGame(socketId1, username1);
		const game1 = result1.game;
		game1.startTimer();

		// Add second player, should join the existing game
		const result2 = gm.addPlayerToGame(socketId2, username2);
		const game2 = result2.game;
		expect(game2).toBe(game1); // should be the same game instance
		expect(game2.getPlayerCount()).toBe(2);
		expect(game2.hasPlayer(username2)).toBe(true);
		
		// Clean up the timer immediately after this test
		game1.stopTimer();
	});

	it('cleans up empty games when players disconnect', () => {
		const gm = GameManager.getInstance(io);
		const socketId1 = 'socket-1';
		const username1 = 'alice';
		const socketId2 = 'socket-2';
		const username2 = 'bob';
		// Add two players, creating a new game
		const result1 = gm.addPlayerToGame(socketId1, username1);
		const game1 = result1.game;
		game1.startTimer();
		const result2 = gm.addPlayerToGame(socketId2, username2);
		const game2 = result2.game;
		expect(game2).toBe(game1); // should be the same game instance
		expect(game1.getPlayerCount()).toBe(2);

		// Disconnect first player (this only marks the player inactive)
		gm.removePlayer(socketId1);

		// Now spy on cleanup. In the real server the socket disconnect handler
		// calls `cleanupEmptyGames()` after the last player leaves; the unit
		// test must simulate that by calling cleanup explicitly.
		const gameCleanupSpy = vi.spyOn(gm, 'cleanupEmptyGames');

		// Disconnect the second player (this only marks the player inactive)
		gm.removePlayer(socketId2);

		// Stop the timer before cleanup
		game1.stopTimer();

		// Simulate the socket handler invoking the cleanup step that would run
		// in production when the last player disconnects.
		gm.cleanupEmptyGames();
		expect(gameCleanupSpy).toHaveBeenCalled();

		// The game should be removed from GameManager's tracking
		const foundGame = (gm as any).games.get(game1.getGameId());
		expect(foundGame).toBeUndefined();
	});
});