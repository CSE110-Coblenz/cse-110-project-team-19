// Game state type
export type GameState = "PREGAME" | "100M_DASH" | "BEFORE_MINIGAME" | "MINIGAME" | "POSTGAME";

export type ScoreType = '100m_score' | 'minigame1_score'

// Player interface
export interface Player {
    username: string;
    "100m_score": number;
    minigame1_score: number;
    total_score: number;
    active: boolean;
}

// Leaderboard type
export type Leaderboard = Player[];

// API request/response types
export interface JoinGameRequest {
    username: string;
}

export interface JoinGameResponse {
    status: "success" | "failure";
    message: string;
}

// Socket event payload types
export interface CountdownTickPayload {
    game_state: GameState;
    time: number;
}

export interface TransitionGamePayload {
    game_state: GameState;
}

export interface UpdateLeaderboardPayload {
    leaderboard: Leaderboard;
}