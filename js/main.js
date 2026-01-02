import { Minesweeper, GAME_STATUS } from './game.js';
import { Renderer } from './renderer.js';
import { SoundManager } from './audio.js';
import { ParticleSystem } from './particles.js';

// Configuration
const DIFFICULTY = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

let currentGame = null;
let renderer = null;
let audio = new SoundManager();
let particles = new ParticleSystem();
let timerInterval = null;
let currentDifficulty = 'medium';

// Elements
const boardEl = document.getElementById('game-board');
const mineCountEl = document.getElementById('mine-count');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('btn-restart');
const difficultyBtn = document.getElementById('btn-difficulty');
const difficultyLabel = document.getElementById('current-difficulty');
const difficultyMenu = document.getElementById('difficulty-menu');
const scoreEl = document.getElementById('score');

const modalOverlay = document.getElementById('modal-overlay');
const endGameModal = document.getElementById('end-game-modal');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnMenu = document.getElementById('btn-menu');

const customModal = document.getElementById('custom-game-modal');
const btnStartCustom = document.getElementById('btn-start-custom');
const btnCancelCustom = document.getElementById('btn-cancel-custom');
const themeBtn = document.getElementById('btn-theme');

const mainMenuOverlay = document.getElementById('main-menu-overlay');
const btnPlayMenu = document.getElementById('btn-play-menu');
const btnThemeMenu = document.getElementById('btn-theme-menu');
const hudMenuBtn = document.getElementById('btn-hud-menu');
const customPreview = document.getElementById('custom-params-preview');
const btnEditCustom = document.getElementById('btn-edit-custom');

function init() {
    renderer = new Renderer(boardEl, {
        mineCount: mineCountEl,
        restartBtn: restartBtn
    });

    // Init theme
    if (localStorage.getItem('minesweeper_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    setupEventListeners();
    showMainMenu();
}

function showMainMenu() {
    stopTimer();
    mainMenuOverlay.classList.remove('hidden');
    // Don't hide board, but maybe blur it? Or just overlay is enough.
    // Reset UI state if coming from game?
    modalOverlay.classList.add('hidden'); // Hide end game modal if open
}

function startGame() {
    mainMenuOverlay.classList.add('hidden');
    startNewGame(currentDifficulty);
}

function startNewGame(difficultyKey) {
    stopTimer();
    resetUI();

    let config = DIFFICULTY[difficultyKey];

    if (difficultyKey === 'custom') {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const mines = parseInt(document.getElementById('custom-mines').value);
        config = { rows, cols, mines };
    }

    currentGame = new Minesweeper(config.rows, config.cols, config.mines);

    renderer.initBoard(config.rows, config.cols);
    renderer.render(currentGame);
}

function resetUI() {
    timerEl.textContent = '000';
    scoreEl.textContent = '0';
    modalOverlay.classList.add('hidden');
    endGameModal.classList.add('hidden');
    customModal.classList.add('hidden');
    difficultyMenu.classList.add('hidden');
    particles.stop();
}

function updateDifficultySelection(diff) {
    currentDifficulty = diff;
    difficultyLabel.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);

    // Update Menu Buttons State
    document.querySelectorAll('.diff-btn').forEach(btn => {
        if (btn.dataset.diff === diff) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // Handle Custom Preview
    if (diff === 'custom') {
        customPreview.classList.remove('hidden');
    } else {
        customPreview.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Board Interactions
    boardEl.addEventListener('mousedown', handleTileInput);
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch support
    let touchTimer = null;
    let isLongPress = false;
    boardEl.addEventListener('touchstart', (e) => {
        if (!e.target.classList.contains('tile')) return;
        isLongPress = false;
        touchTimer = setTimeout(() => {
            isLongPress = true;
            handleTileAction(e.target, 'flag');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    }, { passive: true });
    boardEl.addEventListener('touchend', (e) => {
        clearTimeout(touchTimer);
        if (isLongPress) e.preventDefault();
    });

    // HUD Buttons
    restartBtn.addEventListener('click', () => startNewGame(currentDifficulty));
    hudMenuBtn.addEventListener('click', showMainMenu);

    difficultyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        difficultyMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!difficultyBtn.contains(e.target)) difficultyMenu.classList.add('hidden');
    });

    // Difficulty Menu (HUD Dropdown)
    difficultyMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.dataset.diff;
            if (diff === 'custom') {
                modalOverlay.classList.remove('hidden');
                customModal.classList.remove('hidden');
                difficultyMenu.classList.add('hidden');
                return;
            }
            updateDifficultySelection(diff);
            startNewGame(diff);
            difficultyMenu.classList.add('hidden');
        });
    });

    // Main Menu Buttons
    btnPlayMenu.addEventListener('click', startGame);

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.dataset.diff;
            if (diff === 'custom') {
                 // If clicking custom in main menu, maybe verify values?
                 // Just open modal to edit if needed, or select it.
                 // Let's just select it. Edit button is separate.
                 updateDifficultySelection('custom');
                 return;
            }
            updateDifficultySelection(diff);
        });
    });

    btnEditCustom.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden');
        customModal.classList.remove('hidden');
    });

    btnThemeMenu.addEventListener('click', toggleTheme);
    themeBtn.addEventListener('click', toggleTheme);

    // Custom Game Modal
    btnStartCustom.addEventListener('click', () => {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const mines = parseInt(document.getElementById('custom-mines').value);

        if (mines >= rows * cols) {
            alert("Too many mines!");
            return;
        }

        document.getElementById('preview-text').textContent = `${rows}x${cols} • ${mines} Mines`;
        updateDifficultySelection('custom');

        // If coming from Main Menu, just close modal. If from HUD, start game.
        // We can check visibility of main menu.
        modalOverlay.classList.add('hidden');
        customModal.classList.add('hidden');

        if (mainMenuOverlay.classList.contains('hidden')) {
            startNewGame('custom');
        }
    });

    btnCancelCustom.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        customModal.classList.add('hidden');
    });

    // End Game Modal
    btnPlayAgain.addEventListener('click', () => startNewGame(currentDifficulty));
    btnMenu.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        showMainMenu();
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('minesweeper_theme', isDark ? 'dark' : 'light');
}

function handleTileInput(e) {
    if (!audio.ctx) audio.init();
    const tile = e.target.closest('.tile');
    if (!tile) return;

    if (e.button === 2) {
        e.preventDefault();
        handleTileAction(tile, 'flag');
    } else if (e.button === 0) {
        handleTileAction(tile, 'reveal');
    }
}

function handleTileAction(tileElement, action) {
    if (!currentGame || currentGame.status === GAME_STATUS.WON || currentGame.status === GAME_STATUS.LOST) return;

    const row = parseInt(tileElement.dataset.row);
    const col = parseInt(tileElement.dataset.col);

    currentGame.handleInteraction(row, col, action);

    // Sound Logic
    if (action === 'flag') {
        audio.play('flag');
    } else if (action === 'reveal') {
        if (currentGame.status === GAME_STATUS.LOST) {
            audio.play('lose');
        } else if (currentGame.status === GAME_STATUS.WON) {
            audio.play('win');
        } else {
             audio.play('reveal');
        }
    }

    // Timer Logic
    if (currentGame.status === GAME_STATUS.PLAYING && !timerInterval) {
        startTimer();
    } else if (currentGame.status !== GAME_STATUS.PLAYING && currentGame.status !== GAME_STATUS.IDLE) {
        stopTimer();
        if (currentGame.status === GAME_STATUS.WON || currentGame.status === GAME_STATUS.LOST) {
            showEndGameModal();
        }
    }

    renderer.render(currentGame, { row, col });
}

function startTimer() {
    timerInterval = setInterval(() => {
        const delta = Math.floor((Date.now() - currentGame.startTime) / 1000);
        const display = Math.min(delta, 999);
        timerEl.textContent = String(display).padStart(3, '0');
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function showEndGameModal() {
    const isWin = currentGame.status === GAME_STATUS.WON;
    document.getElementById('end-game-title').textContent = isWin ? 'Victory!' : 'Game Over';
    const breakdown = document.querySelector('.score-breakdown');
    const stats = currentGame.getScore();

    document.getElementById('score-base').textContent = stats.base;
    document.getElementById('score-time').textContent = stats.timeBonus;
    document.getElementById('score-difficulty').textContent = stats.mineBonus;
    document.getElementById('score-penalty').textContent = '0';
    document.getElementById('score-total').textContent = stats.total;

    breakdown.style.display = 'block';
    const highScoreEl = document.getElementById('new-best');
    highScoreEl.classList.add('hidden');

    if (isWin) {
        particles.startConfetti();
        const savedScore = localStorage.getItem(`minesweeper_hs_${currentDifficulty}`);
        if (!savedScore || stats.total > parseInt(savedScore)) {
            localStorage.setItem(`minesweeper_hs_${currentDifficulty}`, stats.total);
            highScoreEl.classList.remove('hidden');
        }
    }

    setTimeout(() => {
        modalOverlay.classList.remove('hidden');
        endGameModal.classList.remove('hidden');
    }, 1000);
}

// Start
init();
