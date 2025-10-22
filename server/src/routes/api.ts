import express, { Request, Response } from 'express';
import { JoinGameRequest, JoinGameResponse } from '../../../shared/types/index.js';
import { gameState } from '../services/gameState.js';

const router = express.Router();

// POST /api/join-game
router.post('/join-game', (req: Request<{}, {}, JoinGameRequest>, res: Response<JoinGameResponse>) => {
    const { username } = req.body;

    // Validate username
    if (!username || username.trim() === '') {
        return res.json({
            status: 'failure',
            message: 'Username cannot be empty'
        });
    }

    // Check if username already exists
    if (gameState.usernameExists(username)) {
        return res.json({
            status: 'failure',
            message: 'Username already exists'
        });
    }

    // Add player to game state
    gameState.addPlayer(username);

    return res.json({
        status: 'success',
        message: ''
    });
});

export default router;