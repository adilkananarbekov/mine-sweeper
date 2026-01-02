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

// Audio Context (Lazy init)

function init() {
    renderer = new Renderer(boardEl, {
        mineCount: mineCountEl,
        restartBtn: restartBtn
    });

    // Init theme
    if (localStorage.getItem('minesweeper_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    startNewGame(currentDifficulty);
    setupEventListeners();
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

function setupEventListeners() {
    // Board Interactions
    boardEl.addEventListener('mousedown', handleTileInput);
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable context menu

    // Touch support for mobile (long press to flag)
    let touchTimer = null;
    let isLongPress = false;

    boardEl.addEventListener('touchstart', (e) => {
        if (!e.target.classList.contains('tile')) return;
        isLongPress = false;
        touchTimer = setTimeout(() => {
            isLongPress = true;
            handleTileAction(e.target, 'flag');
            // Provide haptic feedback if possible
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms long press
    }, { passive: true });

    boardEl.addEventListener('touchend', (e) => {
        clearTimeout(touchTimer);
        if (isLongPress) {
            e.preventDefault(); // Prevent click
        }
    });

    // UI Buttons
    restartBtn.addEventListener('click', () => startNewGame(currentDifficulty));

    difficultyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        difficultyMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!difficultyBtn.contains(e.target)) {
            difficultyMenu.classList.add('hidden');
        }
    });

    difficultyMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const diff = btn.dataset.diff;
            if (diff === 'custom') {
                modalOverlay.classList.remove('hidden');
                customModal.classList.remove('hidden');
                difficultyMenu.classList.add('hidden');
                return;
            }
            currentDifficulty = diff;
            difficultyLabel.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
            startNewGame(diff);
            difficultyMenu.classList.add('hidden');
        });
    });

    // Custom Game Handlers
    btnStartCustom.addEventListener('click', () => {
        const rows = parseInt(document.getElementById('custom-rows').value);
        const cols = parseInt(document.getElementById('custom-cols').value);
        const mines = parseInt(document.getElementById('custom-mines').value);

        if (mines >= rows * cols) {
            alert("Too many mines!");
            return;
        }

        currentDifficulty = 'custom';
        difficultyLabel.textContent = 'Custom';
        startNewGame('custom');
    });

    btnCancelCustom.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        customModal.classList.add('hidden');
    });

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('minesweeper_theme', isDark ? 'dark' : 'light');
    });

    btnPlayAgain.addEventListener('click', () => startNewGame(currentDifficulty));
    btnMenu.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });
}

function handleTileInput(e) {
    // Init audio on first interaction
    if (!audio.ctx) audio.init();

    const tile = e.target.closest('.tile');
    if (!tile) return;

    if (e.button === 2) { // Right click
        e.preventDefault();
        handleTileAction(tile, 'flag');
    } else if (e.button === 0) { // Left click
        handleTileAction(tile, 'reveal');
    }
}

function handleTileAction(tileElement, action) {
    if (!currentGame || currentGame.status === GAME_STATUS.WON || currentGame.status === GAME_STATUS.LOST) return;

    const row = parseInt(tileElement.dataset.row);
    const col = parseInt(tileElement.dataset.col);

    // Track previous state to determine sound
    const wasFlagged = currentGame.board[row][col].isFlagged;

    // Game Logic
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

    // Render
    renderer.render(currentGame, { row, col });
}

function startTimer() {
    const startTime = Date.now(); // Or use game.startTime
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

    // Always calculate score
    const stats = currentGame.getScore();

    document.getElementById('score-base').textContent = stats.base;
    document.getElementById('score-time').textContent = stats.timeBonus;
    document.getElementById('score-difficulty').textContent = stats.mineBonus;
    document.getElementById('score-penalty').textContent = '0'; // Implemented simplified scoring for now
    document.getElementById('score-total').textContent = stats.total;

    breakdown.style.display = 'block';

    const highScoreEl = document.getElementById('new-best');
    highScoreEl.classList.add('hidden');

    if (isWin) {
        // Confetti
        particles.startConfetti();

        // Check High Score
        const savedScore = localStorage.getItem(`minesweeper_hs_${currentDifficulty}`);
        if (!savedScore || stats.total > parseInt(savedScore)) {
            localStorage.setItem(`minesweeper_hs_${currentDifficulty}`, stats.total);
            highScoreEl.classList.remove('hidden');
        }
    } else {
        // If lost, maybe dim the score values or show them in red
        // For now just showing them is fine to show progress
    }

    // Delay slightly to let user see board
    setTimeout(() => {
        modalOverlay.classList.remove('hidden');
        endGameModal.classList.remove('hidden');
    }, 1000);
}

// Start
init();
