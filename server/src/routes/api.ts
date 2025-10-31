import express, { Request, Response } from 'express';
import { JoinGameRequest, JoinGameResponse } from '../../../shared/types/index.js';
import { GameManager } from '../services/GameManager.js';

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

    // Check if username is already active across all games
    // GameManager should already be initialized by the time routes are called
    const gameManager = GameManager.getInstance();
    if (gameManager.isUsernameActive(username)) {
        return res.json({
            status: 'failure',
            message: 'Username already exists'
        });
    }

    // Success - player will be added to game when socket connects
    return res.json({
        status: 'success',
        message: ''
    });
});

export default router;