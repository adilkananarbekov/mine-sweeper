import { STATE, GAME_STATUS } from './game.js';

export class Renderer {
    constructor(boardElement, hudElements) {
        this.boardElement = boardElement;
        this.hud = hudElements;
        this.tileElements = [];
        this.rows = 0;
        this.cols = 0;
    }

    initBoard(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.boardElement.style.gridTemplateColumns = `repeat(${cols}, var(--tile-size))`;
        this.boardElement.style.gridTemplateRows = `repeat(${rows}, var(--tile-size))`;
        this.boardElement.innerHTML = '';
        this.tileElements = [];

        for (let r = 0; r < rows; r++) {
            const rowElements = [];
            for (let c = 0; c < cols; c++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.dataset.row = r;
                tile.dataset.col = c;

                // Add accessible label
                tile.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}, Hidden`);
                tile.setAttribute('role', 'button');

                this.boardElement.appendChild(tile);
                rowElements.push(tile);
            }
            this.tileElements.push(rowElements);
        }
    }

    render(game, origin = null) {
        // Update HUD
        this.hud.mineCount.textContent = String(game.remainingMines).padStart(3, '0');

        if (game.status === GAME_STATUS.WON) {
            this.hud.restartBtn.textContent = '😎';
        } else if (game.status === GAME_STATUS.LOST) {
            this.hud.restartBtn.textContent = '😵';
        } else {
            this.hud.restartBtn.textContent = '🙂';
        }

        // Update Tiles
        game.board.forEach((row, r) => {
            row.forEach((cell, c) => {
                this._updateTileVisuals(this.tileElements[r][c], cell, game.status, origin);
            });
        });
    }

    _updateTileVisuals(el, cell, gameStatus, origin) {
        const isRevealed = cell.isRevealed;
        const isFlagged = cell.isFlagged;
        const isMine = cell.isMine;

        if (isRevealed) {
            if (!el.classList.contains('revealed')) {
                // First time reveal
                el.classList.add('revealed');

                // Calculate delay for wave effect
                if (origin) {
                    const dist = Math.sqrt(Math.pow(origin.row - cell.row, 2) + Math.pow(origin.col - cell.col, 2));
                    const delay = Math.min(dist * 0.05, 0.5); // Cap delay
                    el.style.transitionDelay = `${delay}s`;

                    // Remove delay after animation to avoid sluggish future interactions
                    setTimeout(() => {
                        el.style.transitionDelay = '0s';
                    }, (delay + 0.3) * 1000);
                }
            }

            if (isMine) {
                el.classList.add('mine');
                el.textContent = '💣';
                if (cell.exploded) {
                    el.classList.add('exploded');
                    el.style.backgroundColor = '#ef4444'; // Red background for exploded
                }
            } else {
                if (cell.neighborCount > 0) {
                    el.textContent = cell.neighborCount;
                    el.dataset.value = cell.neighborCount;
                } else {
                    el.textContent = '';
                    el.removeAttribute('data-value');
                }
            }
            el.setAttribute('aria-label', isMine ? 'Mine' : (cell.neighborCount > 0 ? `${cell.neighborCount} mines nearby` : 'Empty'));
        } else {
            el.classList.remove('revealed');
            el.textContent = '';

            if (isFlagged) {
                el.classList.add('flagged');
                el.setAttribute('aria-label', 'Flagged');
            } else {
                el.classList.remove('flagged');
                el.setAttribute('aria-label', `Row ${cell.row+1}, Column ${cell.col+1}, Hidden`);
            }

            if (cell.isIncorrect && gameStatus === GAME_STATUS.LOST) {
                 el.classList.add('incorrect');
                 el.textContent = '❌'; // Or some indicator
            }
        }
    }

    // Helper for wave animation trigger
    triggerWaveReveal(originRow, originCol, radius) {
        // This is complex to do post-facto in render loop.
        // Instead, we might set CSS variables for delay on the elements.
        // Let's keep it simple first: CSS transitions on 'revealed' class.
    }
}
