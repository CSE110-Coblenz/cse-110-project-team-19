// Game Settings
// Duration of the pregame countdown timer in seconds
export const PREGAME_DURATION = 15;

// Duration of the pre-minigame countdown timer in seconds (for minigame pages)
export const PRE_MINIGAME_DURATION = 15;

// Duration of the 100m dash minigame in seconds
export const HUNDRED_METER_DASH_DURATION = 60;

// Duration of the javelin minigame in seconds
export const JAVELIN_MINIGAME_DURATION = 15;

// Javelin minigame settings (per-player rounds)
// Base time (seconds) allowed for the first round
export const JAVELIN_BASE_ROUND_DURATION = 5;
// How much the allowed time decreases per successful round (seconds)
export const JAVELIN_ROUND_DECREASE_PER_ROUND = 0.5;
// Minimum allowed time per round
export const JAVELIN_MIN_ROUND_DURATION = 1.5;
// Number of pre-generated problems per player
export const JAVELIN_PROBLEM_COUNT = 20;
// Points awarded (meters) per successful round
export const JAVELIN_POINTS_PER_ROUND = 10;

// Maximum number of active players allowed per game room
export const MAX_PLAYERS_PER_ROOM = 5;

// Minimum seconds remaining on timer to allow new players to join
export const JOINABLE_TIME_THRESHOLD = 5;

// Problem generation settings for 100m Dash
export const HUNDRED_METER_DASH_PROBLEM_COUNT = 10;
export const PROBLEM_OPERAND_MIN = 2;
export const PROBLEM_OPERAND_MAX = 12;

// Wait time after finishing last problem before transitioning (seconds)
export const END_OF_GAME_WAIT_SECONDS = 5;