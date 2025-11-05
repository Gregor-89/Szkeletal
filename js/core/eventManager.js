// ==============
// EVENTMANAGER.JS (v0.71 - FIX: Usunięcie konfliktu pętli 'animationFrameId')
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
    uiDataRef.camera = gameStateRef.camera; 
    
    resetAll(uiDataRef.canvas, uiDataRef.settings, uiDataRef.perkLevels, uiDataRef, uiDataRef.camera);
    
    gameStateRef.enemyIdCounter = 0;
    
    // Zaktualizuj referencje w uiData po resecie
    uiDataRef.animationFrameId = null;
    uiDataRef.lastTime = 0;
    uiDataRef.startTime = 0;
}

function wrappedPauseGame() {
    pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
}

function wrappedResumeGame() {
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

// POPRAWKA v0.71 (FPS FIX): Usunięto linie modyfikujące 'animationFrameId' i 'timers'.
// Zarządza nimi teraz wyłącznie 'startRun' i 'resetAll' w 'ui.js'.
function wrappedStartRun() {
    // uiDataRef.animationFrameId = null; // USUNIĘTE - robi to resetAll
    // uiDataRef.startTime = 0; // USUNIĘTE - robi to startRun
    // uiDataRef.lastTime = 0; // USUNIĘTE - robi to startRun
    
    startRun(gameStateRef.game, wrappedResetAll, uiDataRef); 
    
    // uiDataRef.animationFrameId = 1; // USUNIĘTE - KRYTYCZNY BŁĄD
    // uiDataRef.startTime = performance.now(); // USUNIĘTE
    // uiDataRef.lastTime = uiDataRef.startTime; // USUNIĘTE
    // uiDataRef.lastFrameTime = uiDataRef.lastTime; // USUNIĘTE
    // uiDataRef.frameCount = 0; // USUNIĘTE
    // uiDataRef.fps = 0; // USUNIĘTE
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

    // === Listenery dla dynamicznie ładowanych elementów (Konfiguracja) ===
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
    
    document.querySelectorAll('input[name="fpspos"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                uiDataRef.fpsPosition = e.target.value;
            }
        });
    });

    const chkLabels = document.getElementById('chkPickupLabels');
    if (chkLabels) {
        chkLabels.addEventListener('change', () => {
            uiDataRef.pickupShowLabels = !!chkLabels.checked;
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
 */
export function initializeMainEvents(stateRef, uiRef) {
    gameStateRef = stateRef;
    uiDataRef = uiRef;
    
    // Zapewnij dostęp globalny do wrapperów
    window.wrappedShowMenu = wrappedShowMenu;
    window.wrappedPauseGame = wrappedPauseGame;
    window.wrappedResumeGame = wrappedResumeGame;
    window.wrappedGameOver = wrappedGameOver;
    window.wrappedLevelUp = wrappedLevelUp;
    window.wrappedOpenChest = wrappedOpenChest;
    window.wrappedLoadConfigAndStart = wrappedLoadConfigAndStart; 
    
    return {
        initEvents,
        wrappedLoadConfigAndStart 
    };
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.71-FIX] js/core/eventManager.js: Usunięto nadpisywanie animationFrameId i timerów z wrappedStartRun.');