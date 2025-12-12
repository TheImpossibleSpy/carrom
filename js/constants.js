// Game Configuration
export const CONSTANTS = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 800,
    BOARD_SIZE: 720, // The actual playing area size
    BOARD_COLOR: '#F5DEB3', // Wheat color for wood
    BORDER_COLOR: '#5C4033', // Dark wood for border
    POCKET_RADIUS: 35,
    POCKET_COLOR: '#1a1a1a',

    // Physics
    FRICTION: 0.985, // Velocity multiplier per frame
    WALL_BOUNCE: 0.7, // Energy kept after wall bounce
    PUCK_BOUNCE: 0.8, // Energy kept after puck collision
    STOP_THRESHOLD: 0.1, // Velocity below which a puck stops

    // Dimensions (scaled)
    COIN_RADIUS: 14,
    STRIKER_RADIUS: 20,

    // Colors
    COLOR_WHITE: '#f0f0f0',
    COLOR_BLACK: '#222222',
    COLOR_RED: '#d32f2f', // Queen
    COLOR_STRIKER: '#ffeb3b', // Yellowish striker

    // Rules
    BASELINE_OFFSET: 110, // Distance from frame to baseline
    BASELINE_LENGTH: 480, // Approximate length of baseline

    // Game States
    STATE_AIMING: 'aiming',
    STATE_SHOOTING: 'shooting',
    STATE_WAITING: 'waiting', // Waiting for pieces to stop
    STATE_GAMEOVER: 'gameover'
};
