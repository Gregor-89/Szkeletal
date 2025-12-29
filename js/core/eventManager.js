// ==============
// EVENTMANAGER.JS (v1.02 - Sync Zoom Config)
// Lokalizacja: /js/core/eventManager.js
// ==============

import { switchView, updateStaticTranslations } from '../ui/menus.js';
import { showMenu, resetAll, pauseGame, resumeGame, gameOver, startRun } from '../ui/ui.js';

import { levelUp, pickPerk, openChest } from '../managers/levelManager.js';
import { saveGame, loadGame } from '../services/saveManager.js';
import { playSound } from '../services/audio.js';
import { resetDevTime, devSettings } from '../services/dev.js';
import { chestOverlay, gameOverOverlay, pauseOverlay, levelUpOverlay, btnContinueMaxLevel, chestButton } from '../ui/domElements.js';

let gameStateRef = null;
let uiDataRef = null;

function wrappedShowMenu(allowContinue = false) {
    uiDataRef.animationFrameId = uiDataRef.animationFrameId;
    showMenu(uiDataRef.game, wrappedResetAll, uiDataRef, allowContinue);
    updateAllStaticText();
}

function wrappedResetAll() {
    uiDataRef.game = gameStateRef.game;
    uiDataRef.settings = gameStateRef.settings;
    uiDataRef.perkLevels = gameStateRef.perkLevels;
    uiDataRef.enemies = gameStateRef.enemies;
    uiDataRef.chests = gameStateRef.chests;
    uiDataRef.pickups = gameStateRef.pickups;
    uiDataRef.bombIndicators = gameStateRef.bombIndicators;
    uiDataRef.stars = gameStateRef.stars;
    uiDataRef.hazards = gameStateRef.hazards;
    uiDataRef.bulletsPool = gameStateRef.bulletsPool;
    uiDataRef.eBulletsPool = gameStateRef.eBulletsPool;
    uiDataRef.gemsPool = gameStateRef.gemsPool;
    uiDataRef.particlePool = gameStateRef.particlePool;
    uiDataRef.hitTextPool = gameStateRef.hitTextPool;
    uiDataRef.camera = gameStateRef.camera;
    if (window.SIEGE_EVENT_CONFIG) uiDataRef.settings.currentSiegeInterval = window.SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
    
    // Używamy exportu z ui.js
    resetAll(uiDataRef.canvas, uiDataRef.settings, uiDataRef.perkLevels, uiDataRef, uiDataRef.camera);
    
    gameStateRef.enemyIdCounter = 0;
    uiDataRef.animationFrameId = null;
    uiDataRef.lastTime = 0;
    uiDataRef.startTime = 0;
}

function wrappedPauseGame() {
    pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
    updateAllStaticText();
}

function wrappedResumeGame() {
    const resumeTime = uiDataRef.gameData?.UI_CONFIG?.RESUME_TIMER || 0.75;
    resumeGame(gameStateRef.game, resumeTime);
}

function wrappedLevelUp() {
    levelUp(gameStateRef.game, gameStateRef.player, gameStateRef.hitTextPool, gameStateRef.particlePool, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.perkLevels);
    updateAllStaticText();
}

function wrappedOpenChest() {
    openChest(gameStateRef.game, gameStateRef.perkLevels, uiDataRef, gameStateRef.player);
    updateAllStaticText();
}

function wrappedGameOver() {
    gameOver(gameStateRef.game, uiDataRef);
    uiDataRef.savedGameState = null;
    updateAllStaticText();
}

// FIX: Wywołanie startRun z poprawną liczbą argumentów (3)
function wrappedStartRun() {
    startRun(gameStateRef.game, wrappedResetAll, uiDataRef);
}

function wrappedLoadConfig() {
    const hyperEl = document.getElementById('chkHyper');
    const shakeEl = document.getElementById('chkShake');
    const fpsEl = document.getElementById('chkFPS');
    const labelsEl = document.getElementById('chkPickupLabels');
    
    // POPRAWKA v1.02: Pobieranie wartości Zooma przy ładowaniu konfiguracji (np. przed Startem)
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) {
        const val = parseInt(zoomSlider.value);
        gameStateRef.game.zoomLevel = val / 100;
        localStorage.setItem('szkeletal_zoom', val);
    }
    
    gameStateRef.game.hyper = !!(hyperEl && hyperEl.checked);
    gameStateRef.game.screenShakeDisabled = !!(shakeEl && !shakeEl.checked);
    uiDataRef.showFPS = !!(fpsEl && fpsEl.checked);
    uiDataRef.pickupShowLabels = !!(labelsEl && labelsEl.checked);
}

function updateAllStaticText() {
    if (updateStaticTranslations) updateStaticTranslations();
}

export function initializeMainEvents(stateRef, uiRef) {
    gameStateRef = stateRef;
    uiDataRef = uiRef;
    
    window.wrappedShowMenu = wrappedShowMenu;
    window.wrappedPauseGame = wrappedPauseGame;
    window.wrappedResumeGame = wrappedResumeGame;
    window.wrappedGameOver = wrappedGameOver;
    window.wrappedLevelUp = wrappedLevelUp;
    window.wrappedOpenChest = wrappedOpenChest;
    window.wrappedLoadConfig = wrappedLoadConfig;
    window.wrappedStartRun = wrappedStartRun;
    
    if (uiRef.gameData && uiDataRef.gameData.SIEGE_EVENT_CONFIG) {
        window.SIEGE_EVENT_CONFIG = uiRef.gameData.SIEGE_EVENT_CONFIG;
    }
    
    return {
        initEvents,
        wrappedLoadConfig,
        wrappedStartRun
    };
}

function initEvents() {
    updateStaticTranslations();
    
    document.getElementById('btnStart').addEventListener('click', () => {
        devSettings.presetLoaded = false;
        resetDevTime();
        wrappedLoadConfig(); // <-- Tutaj teraz syncuje Zooma
        wrappedStartRun();
    });
    document.getElementById('btnContinue').addEventListener('click', () => {
        wrappedLoadConfig();
        loadGame(uiDataRef.savedGameState, gameStateRef, uiDataRef);
    });
    
    const bindNav = (btnId, viewId) => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => switchView(viewId));
    };
    bindNav('navScores', 'view-scores');
    bindNav('navConfig', 'view-config');
    bindNav('navGuide', 'view-guide');
    bindNav('navCoffee', 'view-coffee');
    bindNav('navDev', 'view-dev');
    
    document.querySelectorAll('.nav-back').forEach(btn => {
        btn.addEventListener('click', () => switchView('view-main'));
    });
    
    document.getElementById('btnRetry').addEventListener('click', () => {
        gameOverOverlay.style.display = 'none';
        devSettings.presetLoaded = false;
        resetDevTime();
        wrappedLoadConfig(); // <-- Tutaj też syncuje Zooma
        wrappedStartRun();
    });
    document.getElementById('btnMenu').addEventListener('click', () => {
        gameOverOverlay.style.display = 'none';
        wrappedShowMenu(false);
    });
    document.getElementById('btnResume').addEventListener('click', () => {
        wrappedResumeGame();
    });
    document.getElementById('btnPauseMenu').addEventListener('click', () => {
        pauseOverlay.style.display = 'none';
        gameStateRef.game.manualPause = false;
        if (gameStateRef.game.running && !gameStateRef.game.inMenu) {
            uiDataRef.savedGameState = saveGame(gameStateRef);
            wrappedShowMenu(true);
        } else {
            wrappedShowMenu(false);
        }
    });
    
    window.wrappedPickPerk = (perk) => {
        pickPerk(perk, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame);
    };
    btnContinueMaxLevel.addEventListener('click', () => {
        levelUpOverlay.style.display = 'none';
        pickPerk(null, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame);
    });
    chestButton.addEventListener('click', () => {
        chestOverlay.style.display = 'none';
        if (uiDataRef.currentChestReward) {
            const state = { game: gameStateRef.game, settings: gameStateRef.settings, weapons: gameStateRef.player.weapons, player: gameStateRef.player };
            uiDataRef.currentChestReward.apply(state, uiDataRef.currentChestReward);
            gameStateRef.perkLevels[uiDataRef.currentChestReward.id] = (gameStateRef.perkLevels[uiDataRef.currentChestReward.id] || 0) + 1;
            playSound('ChestReward');
        }
        uiDataRef.currentChestReward = null;
        resumeGame(gameStateRef.game, 0.75);
    });
    
    window.addEventListener('blur', () => {
        if (gameStateRef.game.running && !gameStateRef.game.paused && !gameStateRef.game.inMenu) {
            wrappedPauseGame();
        }
    });
}