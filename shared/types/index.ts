// Game state type
export type GameState = "PREGAME" | "100M_DASH" | "BEFORE_MINIGAME" | "MINIGAME" | "POSTGAME";

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

// Problem types for minigames
export type ProblemType = 'MULTIPLICATION' | 'DIVISION';

export interface Problem {
    type: ProblemType;
    operand1: number;
    operand2: number;
}

// Multiple-choice problem for javelin (server will NOT include the correct label when sending to clients)
export interface MultipleChoiceProblem {
    type: 'DIVISION';
    operand1: number;
    operand2: number;
    A: string;
    B: string;
    C: string;
    D: string;
}

// Socket payloads for problem flow
export interface NewProblemPayload {
    problem: Problem;
}

export interface SendMultipleChoicePayload {
    problem: MultipleChoiceProblem;
}

export interface SubmitProblemRequest {
    answer: number;
}

export interface SubmitMultipleChoiceRequest {
    choice: 'A' | 'B' | 'C' | 'D';
}

export interface SubmitMultipleChoiceResponse {
    correct: boolean;
    finished: boolean;
}

export interface SubmitProblemResponse {
    correct: boolean;
    finished: boolean;
}