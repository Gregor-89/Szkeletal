// ==============
// EVENTMANAGER.JS (v0.70 - FINAL FIX: Naprawa błędu 'weapons is null' w wrappedPauseGame)
// Lokalizacja: /js/core/eventManager.js
// ==============

// Importy Menedżerów
import { showMenu, resetAll, pauseGame, resumeGame, gameOver, startRun } from '../ui/ui.js';
import { levelUp, pickPerk, openChest } from '../managers/levelManager.js';
import { saveGame, loadGame } from '../services/saveManager.js';
import { playSound } from '../services/audio.js';
import { setJoystickSide } from '../ui/input.js';

// Import referencji DOM (potrzebne do eventów)
import {
    gameOverOverlay, pauseOverlay, levelUpOverlay, chestOverlay,
    btnContinueMaxLevel, chestButton
} from '../ui/domElements.js';


// Przechowuje referencje ustawione podczas inicjalizacji
let gameStateRef = null;
let uiDataRef = null;

// --- Funkcje Wrapper (przeniesione z main.js) ---

function wrappedShowMenu(allowContinue = false) {
    uiDataRef.animationFrameId = uiDataRef.animationFrameId; // Użyj referencji
    uiDataRef.savedGameState = uiDataRef.savedGameState;
    showMenu(uiDataRef.game, wrappedResetAll, uiDataRef, allowContinue);
    // (animationFrameId jest zarządzany przez uiData teraz)
}

function wrappedResetAll() {
    // Przekazanie wszystkich referencji stanu do resetAll
    // (uiData już je ma, ale gameStateRef musi być przekazany do uiData)
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
    uiDataRef.trails = gameStateRef.trails;
    uiDataRef.confettis = gameStateRef.confettis;
    
    resetAll(uiDataRef.canvas, uiDataRef.settings, uiDataRef.perkLevels, uiDataRef, uiDataRef.camera);
    
    gameStateRef.enemyIdCounter = 0;
    
    // Zaktualizuj referencje w uiData po resecie
    uiDataRef.animationFrameId = null;
    uiDataRef.lastTime = 0;
    uiDataRef.startTime = 0;
}

function wrappedPauseGame() {
    // FINAL FIX (v0.70): Przekazano 'player.weapons' jako argument 'weapons'
    pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
}

function wrappedResumeGame() {
    // POPRAWKA v0.70: Dostęp do gameData przez uiDataRef
    const resumeTime = uiDataRef.gameData?.UI_CONFIG?.RESUME_TIMER || 0.75;
    resumeGame(gameStateRef.game, resumeTime);
}

function wrappedLevelUp() {
    levelUp(gameStateRef.game, gameStateRef.player, gameStateRef.hitTextPool, gameStateRef.particlePool, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.perkLevels);
}

function wrappedOpenChest() {
    openChest(gameStateRef.game, gameStateRef.perkLevels, uiDataRef); // uiData jest potrzebne do currentChestReward
}

function wrappedGameOver() {
    uiDataRef.savedGameState = uiDataRef.savedGameState;
    gameOver(gameStateRef.game, uiDataRef);
    uiDataRef.savedGameState = null; // Zaktualizuj zapisany stan (na null)
}

function wrappedStartRun() {
    uiDataRef.animationFrameId = null;
    uiDataRef.startTime = 0;
    uiDataRef.lastTime = 0;
    startRun(gameStateRef.game, wrappedResetAll, uiDataRef); // 'startRun' jest teraz zaimportowane
    // Aktualizuj globalne referencje czasu w uiData
    uiDataRef.animationFrameId = 1; // Placeholder, pętla gry to ustawi
    uiDataRef.startTime = performance.now();
    uiDataRef.lastTime = uiDataRef.startTime;
    uiDataRef.lastFrameTime = uiDataRef.lastTime;
    uiDataRef.frameCount = 0;
    uiDataRef.fps = 0;
}

function wrappedLoadConfigAndStart() {
    const joyPosEl = document.querySelector('input[name="joypos"]:checked');
    const hyperEl = document.getElementById('chkHyper');
    const shakeEl = document.getElementById('chkShake');
    const fpsEl = document.getElementById('chkFPS');
    const fpsPosEl = document.querySelector('input[name="fpspos"]:checked');
    const labelsEl = document.getElementById('chkPickupLabels');
    const styleEl = document.querySelector('input[name="pickupstyle"]:checked');

    const pos = (joyPosEl || {value:'right'}).value;
    setJoystickSide(pos);
    gameStateRef.game.hyper = !!(hyperEl && hyperEl.checked);
    gameStateRef.game.screenShakeDisabled = !!(shakeEl && !shakeEl.checked);
    
    uiDataRef.showFPS = !!(fpsEl && fpsEl.checked);
    uiDataRef.fpsPosition = (fpsPosEl || {value:'right'}).value;
    
    uiDataRef.pickupShowLabels = !!(labelsEl && labelsEl.checked);
    uiDataRef.pickupStyleEmoji = (styleEl || {value:'emoji'}).value === 'emoji';

    wrappedStartRun();
}

/**
 * Inicjalizuje wszystkie eventy (przeniesione z main.js)
 */
function initEvents() {
    // === Przycisk Start/Continue ===
    document.getElementById('btnStart').addEventListener('click', () => {
        wrappedLoadConfigAndStart();
    });

    // Listenery dla dynamicznie ładowanych elementów (Konfiguracja)
    const chkShake = document.getElementById('chkShake');
    if (chkShake) {
        chkShake.addEventListener('change', () => {
            gameStateRef.game.screenShakeDisabled = !chkShake.checked;
        });
    }

    const chkFPS = document.getElementById('chkFPS');
    if (chkFPS) {
        chkFPS.addEventListener('change', () => {
            uiDataRef.showFPS = !!chkFPS.checked;
        });
    }

    // Logika Menedżera Zapisu
    document.getElementById('btnContinue').addEventListener('click', () => {
        loadGame(uiDataRef.savedGameState, gameStateRef, uiDataRef);
    });

    document.getElementById('btnRetry').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        wrappedLoadConfigAndStart(); 
    });

    document.getElementById('btnMenu').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        wrappedShowMenu(false);
    });

    document.getElementById('btnResume').addEventListener('click', () => {
        wrappedResumeGame();
    });

    document.getElementById('btnPauseMenu').addEventListener('click', () => {
        pauseOverlay.style.display='none';
        gameStateRef.game.manualPause = false;
        if (gameStateRef.game.running && !gameStateRef.game.inMenu) {
            uiDataRef.savedGameState = saveGame(gameStateRef);
            wrappedShowMenu(true);
        } else {
            wrappedShowMenu(false);
        }
    });

    // Eventy Menedżera Poziomów
    window.wrappedPickPerk = (perk) => {
        pickPerk(perk, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    };

    btnContinueMaxLevel.addEventListener('click', () => {
        levelUpOverlay.style.display='none';
        pickPerk(null, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    });

    chestButton.addEventListener('click',() => {
        chestOverlay.style.display='none';
        if(uiDataRef.currentChestReward){
            const state = { game: gameStateRef.game, settings: gameStateRef.settings, weapons: gameStateRef.player.weapons, player: gameStateRef.player };
            uiDataRef.currentChestReward.apply(state, uiDataRef.currentChestReward);
            
            gameStateRef.perkLevels[uiDataRef.currentChestReward.id]=(gameStateRef.perkLevels[uiDataRef.currentChestReward.id]||0)+1;
            playSound('ChestReward');
        }
        uiDataRef.currentChestReward=null;
        resumeGame(gameStateRef.game, 0.75);
    });
}

/**
 * Główny punkt wejścia dla Menedżera Eventów.
 * @param {object} stateRef - Główny obiekt gameStateRef.
 * @param {object} uiRef - Główny obiekt uiData.
 */
export function initializeMainEvents(stateRef, uiRef) {
    gameStateRef = stateRef;
    uiDataRef = uiRef;
    
    // Zapewnij dostęp globalny do wrapperów, aby main.js (loop) i input.js (handleEscape) mogły ich używać
    window.wrappedShowMenu = wrappedShowMenu;
    window.wrappedPauseGame = wrappedPauseGame;
    window.wrappedResumeGame = wrappedResumeGame;
    window.wrappedGameOver = wrappedGameOver;
    window.wrappedLevelUp = wrappedLevelUp;
    window.wrappedOpenChest = wrappedOpenChest;
    window.wrappedLoadConfigAndStart = wrappedLoadConfigAndStart; // Dla DevTools
    
    // Zwróć initEvents, aby main.js mógł go wywołać PO załadowaniu HTML
    return {
        initEvents
    };
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.70] js/core/eventManager.js: Załadowano moduł Menedżera Eventów.');