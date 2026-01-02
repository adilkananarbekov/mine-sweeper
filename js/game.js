export const STATE = {
    HIDDEN: 'hidden',
    REVEALED: 'revealed',
    FLAGGED: 'flagged',
    EXPLODED: 'exploded', // Mine that was clicked
    INCORRECT: 'incorrect' // Flagged but not a mine (shown at end)
};

export const GAME_STATUS = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

export class Minesweeper {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.totalMines = mines;
        this.remainingMines = mines; // For display
        this.status = GAME_STATUS.IDLE;
        this.board = [];
        this.startTime = null;
        this.endTime = null;
        this.safeTilesRevealed = 0;
        this.totalSafeTiles = (rows * cols) - mines;
        this.onGameStateChange = null; // Callback for renderer

        this._initBoard();
    }

    _initBoard() {
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    row: r,
                    col: c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborCount: 0
                });
            }
            this.board.push(row);
        }
    }

    // Public API: Action
    handleInteraction(row, col, action) {
        if (this.status === GAME_STATUS.WON || this.status === GAME_STATUS.LOST) return;

        if (action === 'reveal') {
            this._reveal(row, col);
        } else if (action === 'flag') {
            this._toggleFlag(row, col);
        }

        this._emitChange();
    }

    _reveal(row, col) {
        const tile = this.board[row][col];

        if (tile.isFlagged || tile.isRevealed) return;

        // First click logic
        if (this.status === GAME_STATUS.IDLE) {
            this.status = GAME_STATUS.PLAYING;
            this.startTime = Date.now();
            this._placeMines(row, col);
        }

        if (tile.isMine) {
            this._gameOver(false, tile);
            return;
        }

        tile.isRevealed = true;
        this.safeTilesRevealed++;

        if (tile.neighborCount === 0) {
            this._floodFill(row, col);
        }

        if (this.safeTilesRevealed === this.totalSafeTiles) {
            this._gameOver(true);
        }
    }

    _floodFill(row, col) {
        const neighbors = this._getNeighbors(row, col);
        for (const n of neighbors) {
            if (!n.isRevealed && !n.isFlagged) {
                n.isRevealed = true;
                this.safeTilesRevealed++;
                // If this neighbor is also a 0, recurse
                if (n.neighborCount === 0) {
                    this._floodFill(n.row, n.col);
                }
            }
        }
    }

    _toggleFlag(row, col) {
        if (this.status === GAME_STATUS.IDLE) return; // Optional: prevent flagging before start? Actually standard allows it.
        // Let's allow flagging before start, but maybe start timer? Usually timer starts on reveal.

        const tile = this.board[row][col];
        if (tile.isRevealed) return;

        if (tile.isFlagged) {
            tile.isFlagged = false;
            this.remainingMines++;
        } else {
            tile.isFlagged = true;
            this.remainingMines--;
        }
    }

    _placeMines(safeRow, safeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // Don't place mine on the first clicked tile or its neighbors (to ensure opening)
            // Or just the tile itself? "First click is always safe (no mine, preferably opens space)"
            // To "preferably open space", we should ensure the first click is a 0.
            // So we shouldn't place mines in the 3x3 area around the click.

            if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;

            if (!this.board[r][c].isMine) {
                this.board[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    this.board[r][c].neighborCount = this._countMineNeighbors(r, c);
                }
            }
        }
    }

    _countMineNeighbors(row, col) {
        const neighbors = this._getNeighbors(row, col);
        return neighbors.filter(n => n.isMine).length;
    }

    _getNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    neighbors.push(this.board[r][c]);
                }
            }
        }
        return neighbors;
    }

    _gameOver(isWin, clickedMineTile = null) {
        this.status = isWin ? GAME_STATUS.WON : GAME_STATUS.LOST;
        this.endTime = Date.now();

        if (isWin) {
            // Flag all remaining mines
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c].isMine) {
                        this.board[r][c].isFlagged = true;
                    }
                }
            }
            this.remainingMines = 0;
        } else {
            // Reveal all mines
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const tile = this.board[r][c];
                    if (tile.isMine) {
                        tile.isRevealed = true;
                        if (tile === clickedMineTile) {
                            tile.exploded = true;
                        }
                    } else if (tile.isFlagged) {
                        // Incorrect flag
                        tile.isIncorrect = true;
                        tile.isFlagged = false; // To show it was wrong, or keep flag visual but mark incorrect
                    }
                }
            }
        }
    }

    _emitChange() {
        if (this.onGameStateChange) {
            this.onGameStateChange(this);
        }
    }

    getScore() {
        // Only valid if WON (or partial score if lost? Requirement says "End-game breakdown")
        // But usually Score is for winning. Let's calculate for both but mark valid.

        const timeTaken = this.startTime ? (this.endTime || Date.now()) - this.startTime : 0;
        const timeSeconds = Math.max(1, Math.floor(timeTaken / 1000));

        const difficultyMult = this._getDifficultyMultiplier();

        // Scoring Rules:
        // Base: 10 points per safe tile revealed
        // Mine Bonus: 100 points per mine (only if won)
        // Time Bonus: Max(0, 999 - time) * difficultyMult (only if won)

        const baseScore = this.safeTilesRevealed * 10 * difficultyMult;
        let mineBonus = 0;
        let timeBonus = 0;

        if (this.status === GAME_STATUS.WON) {
            mineBonus = this.totalMines * 50 * difficultyMult;
            // 300 seconds (5 mins) is "standard" par time?
            // Let's say simpler: 1000 points - timeSeconds (min 0) * 10
            timeBonus = Math.max(0, (1000 - timeSeconds) * 2 * difficultyMult);
        }

        return {
            base: baseScore,
            mineBonus: mineBonus,
            timeBonus: timeBonus,
            total: baseScore + mineBonus + timeBonus,
            timeSeconds: timeSeconds,
            isWin: this.status === GAME_STATUS.WON
        };
    }

    _getDifficultyMultiplier() {
        // Density based
        const density = this.totalMines / (this.rows * this.cols);
        if (density < 0.12) return 1; // Easy ~12%
        if (density < 0.16) return 2; // Medium ~15.6%
        return 3; // Hard ~20%
    }
}
