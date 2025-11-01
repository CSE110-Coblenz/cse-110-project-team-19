import express, { Request, Response } from 'express';
import { JoinGameRequest, JoinGameResponse } from '../../../shared/types/index.js';
import { GameManager } from '../services/GameManager.js';

const router = express.Router();
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,16}$/;


// POST /api/join-game
router.post('/join-game', (req: Request<{}, {}, JoinGameRequest>, res: Response<JoinGameResponse>) => {
    const { username } = req.body;

    // Validate username
     const trimmed = (username ?? '').trim(); 
    if (!trimmed) {
        return res.status(400).json({                   
            status: 'failure',
            message: 'Username cannot be empty'
        });
    }

    if (!USERNAME_REGEX.test(trimmed)) {
        return res.status(400).json({
            status: 'failure',
            message: 'Username must be 3–16 chars: letters, numbers, underscore only'
        });
    }
    // Check if username is already active across all games
    // GameManager should already be initialized by the time routes are called
    const gameManager = GameManager.getInstance();
    if (gameManager.isUsernameActive(trimmed)) {        
        return res.status(409).json({                   
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