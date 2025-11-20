// client/src/utils/gameResults.ts
// Helper functions for final game state and leaderboard winner logic.
// These are pure functions (no Konva, no DOM) so they are easy to unit test.

import { Leaderboard, GameState } from '../../../shared/types/index.js';

/**
 * Build the timer message text shown in the UI, based on the current game state.
 *
 * Matches the logic used in GameRoom.ts for the countdown text.
 */
export function makeTimerMessage(gameState: GameState, time: number): string {
    if (gameState === 'PREGAME') {
        return `Game starts in: ${time}s`;
    } else if (gameState === 'BEFORE_MINIGAME') {
        return `Next minigame in: ${time}s`;
    } else if (gameState === 'POSTGAME') {
        return 'Game Over!';
    } else {
        // Covers 100M_DASH, MINIGAME, JAVELIN_ANIMATION or any other running state
        return `Time: ${time}s`;
    }
}

/**
 * Returns true if the given game state represents the final game screen.
 *
 * Currently only POSTGAME is considered the final state.
 */
export function isFinalGameState(gameState: GameState): boolean {
    return gameState === 'POSTGAME';
}

/**
 * Compute the winner usernames from the leaderboard.
 *
 * - Returns an array of usernames with the maximum total_score.
 * - Supports ties: if multiple players share the highest total_score,
 *   all of them are included in the result.
 * - Returns an empty array when the leaderboard is empty.
 */
export function getWinnerUsernames(leaderboard: Leaderboard): string[] {
    if (!leaderboard || leaderboard.length === 0) {
        return [];
    }

    const maxTotal = Math.max(...leaderboard.map((p) => p.total_score));

    return leaderboard
        .filter((p) => p.total_score === maxTotal)
        .map((p) => p.username);
}
