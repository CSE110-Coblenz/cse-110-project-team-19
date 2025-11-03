import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
		vi.restoreAllMocks();
		// ensure singleton removed after test
		(GameManager as unknown as any).instance = undefined;
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
        expect(game1.getPlayerCount()).toBe(1);

        // Add second player, should join the existing game
        const result2 = gm.addPlayerToGame(socketId2, username2);
        const game2 = result2.game;
        expect(game2).toBe(game1); // should be the same game instance
        expect(game2.getPlayerCount()).toBe(2);
        expect(game2.hasPlayer(username2)).toBe(true);
    });

    it ('cleans up empty games when players disconnect', () => {
        const gm = GameManager.getInstance(io);
        const socketId1 = 'socket-1';
        const username1 = 'alice';
        const socketId2 = 'socket-2';
        const username2 = 'bob';
        // Add two players, creating a new game
        const result1 = gm.addPlayerToGame(socketId1, username1);
        const game1 = result1.game;
        const result2 = gm.addPlayerToGame(socketId2, username2);
        const game2 = result2.game;
        expect(game2).toBe(game1); // should be the same game instance
        expect(game1.getPlayerCount()).toBe(2);

        // Disconnect first player
        gm.removePlayer(socketId1);
        expect(game1.hasPlayer(username1)).toBe(false);
        // Disconnect second player
        gm.removePlayer(socketId2);
        expect(game1.hasPlayer(username2)).toBe(false);

        // Now the game should be empty and cleaned up, make sure gameCleanup was called
        const gameCleanupSpy = vi.spyOn(gm, 'cleanupEmptyGames');
        gm.removePlayer(socketId2);
        expect(gameCleanupSpy).toHaveBeenCalled();

        // The game should be removed from GameManager's tracking
        const foundGame = (gm as any).games.get(game1.getGameId());
        expect(foundGame).toBeUndefined();

    });

});
        