import express, { Request, Response } from 'express';
import { JoinGameRequest, JoinGameResponse } from '../../../shared/types/index.js';
import { GameManager } from '../services/GameManager.js';

const router = express.Router();

const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

// POST /api/join-game
router.post('/join-game', (req: Request<{}, {}, JoinGameRequest>, res: Response<JoinGameResponse>) => {
    const username = (req.body?.username ?? '').trim();

    if (!NAME_RE.test(username)) {
        return res.status(400).json({
            status: 'failure',
            message: 'Invalid username: 3–16 chars, letters/numbers/underscore only'
        });
    }

    // Validate username
    if (!username) {
        return res.status(400).json({
            status: 'failure',
            message: 'Username cannot be empty'
        });
    }


    // Check if username is already active across all games
    if (gameManager.isUsernameActive(username)) {
        return res.json({
            status: 'failure',
            message: 'Username already exists'
        });
    }
    // Success - player will be added to game when socket connects
    return res.status(200).json({
        status: 'success',
        message: ''
    });
});

export default router;