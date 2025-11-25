// Game Settings
// Duration of the pregame countdown timer in seconds
export const PREGAME_DURATION = 15;

// Duration of the pre-minigame countdown timer in seconds (for minigame pages)
export const PRE_MINIGAME_DURATION = 15;

// Duration of the 100m dash minigame in seconds
export const HUNDRED_METER_DASH_DURATION = 60;

// Base time (seconds) allowed for the first round
// Javelin minigame (addition sprint) constants
export const JAVELIN_DURATION = 20; // total seconds for problem solving phase
export const JAVELIN_PROBLEM_COUNT = 200; // upper bound of shared problems; players likely won't exhaust
export const JAVELIN_ANIMATION_DURATION = 10; // seconds for post-phase animation

// Maximum number of active players allowed per game room
export const MAX_PLAYERS_PER_ROOM = 5;

// Minimum seconds remaining on timer to allow new players to join
export const JOINABLE_TIME_THRESHOLD = 2;

// Problem generation settings for 100m Dash
export const HUNDRED_METER_DASH_PROBLEM_COUNT = 10;
export const PROBLEM_OPERAND_MIN = 2;
export const PROBLEM_OPERAND_MAX = 12;

// Wait time after finishing last problem before transitioning (seconds)
export const END_OF_GAME_WAIT_SECONDS = 5;