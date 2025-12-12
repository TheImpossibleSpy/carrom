import { CONSTANTS } from './constants.js';
import { Vector } from './vector.js';

export class GameManager {
    constructor(entities, striker, board, audioHandler) {
        this.entities = entities;
        this.striker = striker;
        this.board = board;
        this.audio = audioHandler;

        // Game State
        this.turn = 'player'; // 'player' or 'ai'
        this.state = CONSTANTS.STATE_AIMING; // aiming, shooting, waiting
        this.playerColor = CONSTANTS.COLOR_WHITE;
        this.aiColor = CONSTANTS.COLOR_BLACK;

        this.score = {
            player: 0,
            ai: 0
        };

        this.pocketedThisTurn = [];
        this.queenPocketed = false; // Is queen off board?
        this.queenCoverPending = false; // Player who pocketed queen needs to cover it
        this.queenPocketedBy = null; // 'player' or 'ai'

        // UI Callbacks
        this.onTurnChange = null;
        this.onScoreUpdate = null;
        this.onMessage = null; // For displaying fouls, etc.

        this.difficulty = 'medium';
    }

    setDifficulty(level) {
        this.difficulty = level;
    }

    startTurn() {
        this.state = CONSTANTS.STATE_AIMING;
        this.pocketedThisTurn = [];

        // Reset Striker Position based on turn
        if (this.turn === 'player') {
            this.striker.position = new Vector(
                CONSTANTS.CANVAS_WIDTH / 2,
                CONSTANTS.CANVAS_HEIGHT - (CONSTANTS.BASELINE_OFFSET + this.board.offset)
            );
        } else {
             this.striker.position = new Vector(
                CONSTANTS.CANVAS_WIDTH / 2,
                CONSTANTS.BASELINE_OFFSET + this.board.offset
            );
        }

        this.striker.velocity = new Vector(0, 0);
        this.striker.active = true;
        this.striker.pocketed = false;

        if (this.onTurnChange) this.onTurnChange(this.turn);
    }

    handleShot(velocity) {
        if (this.state !== CONSTANTS.STATE_AIMING) return;

        this.striker.velocity = velocity;
        this.state = CONSTANTS.STATE_SHOOTING;
    }

    checkPockets() {
        // Simple distance check to pockets
        const pockets = [
            new Vector(this.board.offset, this.board.offset),
            new Vector(this.board.width - this.board.offset, this.board.offset),
            new Vector(this.board.width - this.board.offset, this.board.height - this.board.offset),
            new Vector(this.board.offset, this.board.height - this.board.offset)
        ];

        const pocketRadius = CONSTANTS.POCKET_RADIUS;

        this.entities.forEach(e => {
            if (e.pocketed) return;

            for (let p of pockets) {
                if (e.position.dist(p) < pocketRadius) {
                    e.pocketed = true;
                    e.velocity = new Vector(0,0);
                    e.position = new Vector(-100, -100); // Move off screen
                    this.pocketedThisTurn.push(e);
                    if (this.audio) this.audio.playPocket();
                }
            }
        });
    }

    update() {
        if (this.state === CONSTANTS.STATE_SHOOTING || this.state === CONSTANTS.STATE_WAITING) {
            this.checkPockets();

            // Check if all stopped
            const allStopped = this.entities.every(e => e.pocketed || e.velocity.mag() === 0);

            if (allStopped) {
                if (this.state === CONSTANTS.STATE_SHOOTING) {
                    // Give a small buffer or ensure everything is settled
                    this.state = CONSTANTS.STATE_WAITING;
                } else {
                    this.resolveTurn();
                }
            } else {
                this.state = CONSTANTS.STATE_SHOOTING;
            }
        }
    }

    resolveTurn() {
        const currentSideColor = (this.turn === 'player') ? this.playerColor : this.aiColor;
        const opponentSideColor = (this.turn === 'player') ? this.aiColor : this.playerColor;

        let continueTurn = false;
        let foul = false;
        let queenPocketedNow = false;
        let myCoinPocketed = false;

        // Analyze pocketed items
        for (let p of this.pocketedThisTurn) {
            if (p.isStriker) {
                foul = true;
            } else if (p.isQueen) {
                queenPocketedNow = true;
            } else if (p.color === currentSideColor) {
                myCoinPocketed = true;
            } else if (p.color === opponentSideColor) {
                // Pocketed opponent's coin - usually no penalty, but turn ends unless own coin also pocketed
            }
        }

        // --- Logic Processing ---

        if (foul) {
            // Striker pocketed
            // Penalty: Return one of own coins if available, turn ends
            // Reset Striker happens in startTurn
            this.returnCoin(currentSideColor);

            // If queen was pocketed in foul, return it too
            if (queenPocketedNow) {
                this.returnQueen();
            } else if (this.queenCoverPending && this.queenPocketedBy === this.turn) {
                // Failed to cover
                this.returnQueen();
                this.queenCoverPending = false;
                this.queenPocketedBy = null;
            }

            continueTurn = false;
            if (this.onMessage) this.onMessage("FOUL! Striker pocketed.");
        }
        else {
            // No Foul

            // Queen Logic
            if (queenPocketedNow) {
                if (this.queenCoverPending) {
                    // Already pending? Can't happen if queen was on board.
                    // Unless we are returning it.
                } else {
                    // Must cover it
                     if (myCoinPocketed) {
                         // Covered immediately in same shot?
                         this.queenCoverPending = false;
                         this.queenPocketed = true;
                         this.queenPocketedBy = this.turn; // Permanently claimed (until game over calc)
                         if (this.onMessage) this.onMessage("Queen Covered!");
                         continueTurn = true;
                     } else {
                         this.queenCoverPending = true;
                         this.queenPocketedBy = this.turn;
                         this.queenPocketed = true; // Temporarily
                         continueTurn = true; // Gets another shot to cover
                         if (this.onMessage) this.onMessage("Cover the Queen!");
                     }
                }
            }
            else if (this.queenCoverPending && this.queenPocketedBy === this.turn) {
                if (myCoinPocketed) {
                    // Covered successfully
                    this.queenCoverPending = false;
                    if (this.onMessage) this.onMessage("Queen Covered!");
                    continueTurn = true;
                } else {
                    // Failed to cover
                    this.returnQueen();
                    this.queenCoverPending = false;
                    this.queenPocketedBy = null;
                    continueTurn = false;
                    if (this.onMessage) this.onMessage("Failed to cover Queen.");
                }
            }
            else {
                 // Normal shot
                 if (myCoinPocketed) {
                     continueTurn = true;
                 } else {
                     continueTurn = false;
                 }
            }
        }

        // Check Win Condition
        if (this.checkWin()) {
            this.state = CONSTANTS.STATE_GAMEOVER;
            return;
        }

        if (continueTurn) {
            this.startTurn();
        } else {
            this.switchTurn();
        }
    }

    switchTurn() {
        this.turn = (this.turn === 'player') ? 'ai' : 'player';
        this.startTurn();
    }

    returnCoin(color) {
        // Find a pocketed coin of color and put it back in center (or as close as possible)
        const coin = this.entities.find(e => e.pocketed && e.color === color && !e.isStriker && !e.isQueen);
        if (coin) {
            coin.pocketed = false;
            coin.velocity = new Vector(0,0);
            coin.position = new Vector(CONSTANTS.CANVAS_WIDTH/2, CONSTANTS.CANVAS_HEIGHT/2);
            // Ideally check overlap
        }
    }

    returnQueen() {
        const queen = this.entities.find(e => e.isQueen);
        if (queen) {
            queen.pocketed = false;
            queen.velocity = new Vector(0,0);
            queen.position = new Vector(CONSTANTS.CANVAS_WIDTH/2, CONSTANTS.CANVAS_HEIGHT/2);
             // Ideally check overlap
        }
    }

    checkWin() {
        const whites = this.entities.filter(e => e.color === CONSTANTS.COLOR_WHITE && !e.pocketed).length;
        const blacks = this.entities.filter(e => e.color === CONSTANTS.COLOR_BLACK && !e.pocketed).length;
        const queenOnBoard = !this.entities.find(e => e.isQueen).pocketed;

        // If one color is gone
        if (whites === 0) {
             if (!queenOnBoard || this.queenPocketedBy === 'player') { // White is player
                 this.finishGame('Player');
                 return true;
             }
        }

        if (blacks === 0) {
            if (!queenOnBoard || this.queenPocketedBy === 'ai') { // Black is AI
                 this.finishGame('AI');
                 return true;
             }
        }

        return false;
    }

    finishGame(winner) {
        if (this.onMessage) this.onMessage(`GAME OVER! ${winner} Wins!`);
    }
}
