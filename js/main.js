import { Board } from './board.js';
import { CONSTANTS } from './constants.js';
import { Puck } from './puck.js';
import { Physics } from './physics.js';
import { InputHandler } from './input.js';
import { GameManager } from './rules.js';
import { AI } from './ai.js';
import { AudioHandler } from './assets.js';
import { Vector } from './vector.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = CONSTANTS.CANVAS_WIDTH;
canvas.height = CONSTANTS.CANVAS_HEIGHT;

const board = new Board(ctx);
const audio = new AudioHandler();
const physics = new Physics(board.offset, board.boardSize, audio);
const entities = [];

// Striker
const striker = new Puck(
    CONSTANTS.CANVAS_WIDTH / 2,
    CONSTANTS.CANVAS_HEIGHT - (CONSTANTS.BASELINE_OFFSET + board.offset),
    true,
    CONSTANTS.COLOR_STRIKER
);
entities.push(striker);

// Setup Coins
function setupCoins() {
    const cx = CONSTANTS.CANVAS_WIDTH / 2;
    const cy = CONSTANTS.CANVAS_HEIGHT / 2;
    const r = CONSTANTS.COIN_RADIUS;

    entities.push(new Puck(cx, cy, false, CONSTANTS.COLOR_RED)); // Queen

    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = cx + Math.cos(angle) * (r * 2.1);
        const y = cy + Math.sin(angle) * (r * 2.1);
        const color = (i % 2 === 0) ? CONSTANTS.COLOR_WHITE : CONSTANTS.COLOR_BLACK;
        entities.push(new Puck(x, y, false, color));
    }

    for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        const dist = r * 4.1;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const color = (i % 2 === 0) ? CONSTANTS.COLOR_WHITE : CONSTANTS.COLOR_BLACK;
        entities.push(new Puck(x, y, false, color));
    }
}

setupCoins();

// Game Manager
const game = new GameManager(entities, striker, board, audio);
const ai = new AI(game);

// Input
const input = new InputHandler(canvas, striker, board);
input.onShoot = (velocity) => {
    game.handleShot(velocity);
};

// UI Elements
const turnDisplay = document.getElementById('current-turn');
const messageDisplay = document.getElementById('controls-hint');
const playerScoreDisplay = document.getElementById('player-score');
const aiScoreDisplay = document.getElementById('ai-score');
const difficultySelect = document.getElementById('difficulty');

difficultySelect.addEventListener('change', (e) => {
    game.setDifficulty(e.target.value);
    // Remove focus so spacebar/other keys don't toggle it
    e.target.blur();
});

function updateScore() {
    // Score: Number of coins pocketed? Or coins remaining?
    // Let's show remaining coins.
    const playerCoins = entities.filter(e => e.color === CONSTANTS.COLOR_WHITE && !e.pocketed).length;
    const aiCoins = entities.filter(e => e.color === CONSTANTS.COLOR_BLACK && !e.pocketed).length;
    playerScoreDisplay.innerText = `Player (White): ${playerCoins} left`;
    aiScoreDisplay.innerText = `AI (Black): ${aiCoins} left`;
}

game.onTurnChange = (turn) => {
    turnDisplay.innerText = turn === 'player' ? "Player" : "AI";
    updateScore();

    // Enable/Disable Input
    if (turn === 'player') {
         messageDisplay.innerText = "Your Turn. Drag to aim/shoot.";
    } else {
         messageDisplay.innerText = "AI is thinking...";
         ai.takeTurn();
    }
};

game.onMessage = (msg) => {
    messageDisplay.innerText = msg;
    setTimeout(() => {
        if (game.turn === 'player') messageDisplay.innerText = "Your Turn. Drag to aim/shoot.";
        else messageDisplay.innerText = "AI is thinking...";
    }, 2000);
};

// Handle initial user interaction for Audio Context
document.addEventListener('click', () => {
    if (audio.ctx.state === 'suspended') {
        audio.ctx.resume();
    }
}, { once: true });

// Start Game
game.startTurn();

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Game State
    game.update();

    // Physics
    physics.update(entities);

    board.draw();

    // Only draw aim line if aiming and player turn
    if (game.state === CONSTANTS.STATE_AIMING && game.turn === 'player') {
        input.draw(ctx);
    }

    entities.forEach(e => e.draw(ctx));

    requestAnimationFrame(gameLoop);
}

gameLoop();
