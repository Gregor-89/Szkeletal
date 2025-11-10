// ==============
// UI.JS (v0.77k - FIX: Usunięcie błędnego importu 'playerHPBarOuter')
// Lokalizacja: /js/ui/ui.js
// ==============

// Importy systemowe (pozostają)
import { devSettings } from '../services/dev.js';
import { initAudio, playSound } from '../services/audio.js';
// POPRAWKA v0.77: UI_CONFIG jest teraz używane
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG 
} from '../config/gameData.js';

// NOWY IMPORT v0.76: Importujemy zmienną z ustawionym czasem startowym
import { devStartTime } from '../services/dev.js';

// Krok 3: Import referencji DOM
import {
    xpBarFill, playerHPBarInner, playerHPBarTxt, xpBarTxt, bonusPanel,
    statsDisplayPause, menuOverlay, btnContinue,
    levelUpOverlay, pauseOverlay, resumeOverlay, resumeText, 
    chestOverlay, gameOverOverlay, finalScore, finalLevel,
    finalTime, titleDiv, docTitle
    // POPRAWKA v0.77k: Fizycznie usunięto 'playerHPBarOuter' z tej listy
} from './domElements.js';

// Krok 5: Import Menedżera Wyników
import {
    formatTime, saveScore, displayScores, attachClearScoresListeners
} from '../services/scoreManager.js';

// Krok 7: Import Menedżera Poziomów (tylko funkcje potrzebne w tym pliku)
import { updateStatsUI } from '../managers/levelManager.js';


// --- GŁÓWNA FUNKCJA AKTUALIZACJI UI (POZOSTAJE) ---

// POPRAWKA v0.77j: Przechowuje referencję do paska HP (ładowaną leniwie)
let hpBarOuterRef = null;

export function updateUI(game, player, settings, weapons) {
    // Statystyki na górze
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('xp').textContent = game.xp;
    document.getElementById('xpNeeded').textContent = game.xpNeeded;
    document.getElementById('health').textContent = Math.max(0, Math.floor(game.health));
    document.getElementById('time').textContent = formatTime(Math.floor(game.time)); // Używa zaimportowanego formatTime

    // Paski postępu na górze
    const xpPct = Math.max(0, Math.min(1, game.xp / game.xpNeeded));
    xpBarFill.style.width = (xpPct * 100).toFixed(1) + '%';
    document.getElementById('xpProgress').style.width = (xpPct * 100).toFixed(1) + '%';
    document.getElementById('healthProgress').style.width = (Math.max(0, game.health / game.maxHealth) * 100).toFixed(1) + '%';
    document.getElementById('levelProgress').style.width = (Math.min(100, game.level * 5)) + '%';
    document.getElementById('scoreProgress').style.width = (Math.min(100, game.score / 50)) + '%';
    document.getElementById('timeProgress').style.width = (Math.min(100, game.time / 6)) + '%';

    // Główny pasek HP
    const healthPct = Math.max(0, Math.min(1, game.health / game.maxHealth));
    playerHPBarInner.style.width = (healthPct * 100).toFixed(1) + '%';
    playerHPBarTxt.innerHTML = `❤️ ${Math.max(0, Math.floor(game.health))} / ${game.maxHealth}`;

    // POPRAWKA v0.77j: Bezpieczne pobieranie paska HP (lazy loading)
    if (!hpBarOuterRef) {
        hpBarOuterRef = document.getElementById('playerHPBarOuter');
        if (hpBarOuterRef) {
             console.log('[DEBUG-v0.77k] Pomyślnie znaleziono playerHPBarOuter.');
        }
    }

    // NOWA LOGIKA v0.77: Pulsowanie paska HP przy niskim zdrowiu
    if (hpBarOuterRef) { // Sprawdź, czy na pewno znaleziono
        if (healthPct <= UI_CONFIG.LOW_HEALTH_THRESHOLD && game.health > 0) {
            hpBarOuterRef.classList.add('low-health-pulse');
        } else {
            hpBarOuterRef.classList.remove('low-health-pulse');
        }
    }

    if (xpBarTxt) {
        xpBarTxt.innerHTML = `📈 ${game.xp} / ${game.xpNeeded}`;
    }

    // Panel bonusów
    let bonusHTML = '';
    const bonusMap = { magnet: '🧲', shield: '🛡️', speed: '⚡', freeze: '❄️' };
    if (game.magnetT > 0) bonusHTML += `<div><span class="bonus-emoji">${bonusMap.magnet}</span><span class="bonus-txt">${Math.ceil(game.magnetT)}s</span></div>`;
    if (game.shieldT > 0) bonusHTML += `<div><span class="bonus-emoji">${bonusMap.shield}</span><span class="bonus-txt">${Math.ceil(game.shieldT)}s</span></div>`;
    if (game.speedT > 0) bonusHTML += `<div><span class="bonus-emoji">${bonusMap.speed}</span><span class="bonus-txt">${Math.ceil(game.speedT)}s</span></div>`;
    if (game.freezeT > 0) bonusHTML += `<div><span class="bonus-emoji">${bonusMap.freeze}</span><span class="bonus-txt">${Math.ceil(game.freezeT)}s</span></div>`;
    bonusPanel.innerHTML = bonusHTML;
}

// --- ZARZĄDZANIE STANEM GRY (MENU, PAUZA, RESET) (POZOSTAJE) ---

export function showMenu(game, resetAll, uiData, allowContinue = false) {
    if (!allowContinue) {
        resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
        uiData.savedGameState = null;
    }

    if (uiData.savedGameState && allowContinue) {
        btnContinue.style.display = 'block';
    } else {
        btnContinue.style.display = 'none';
    }

    menuOverlay.style.display = 'flex';
    game.inMenu = true;
    game.paused = true;
    game.running = false;

    if (uiData.animationFrameId !== null) {
        cancelAnimationFrame(uiData.animationFrameId);
        uiData.animationFrameId = null;
    }

    if (uiData.animationFrameId === null) {
        uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }

    // Ustawienie wersji w HTML
    docTitle.textContent = `Szkeletal: Estrone Kiszok v${uiData.VERSION}`;
    titleDiv.textContent = `Szkeletal: Estrone Kiszok v${uiData.VERSION}`;

    updateUI(game, uiData.player, uiData.settings, null); 
    uiData.ctx.clearRect(0, 0, uiData.canvas.width, uiData.canvas.height);
    uiData.drawCallback(); 
    
    // POPRAWKA v0.70: Wywołania funkcji z zaimportowanego scoreManager
    displayScores('scoresBodyMenu');
    attachClearScoresListeners();
}

export function startRun(game, resetAll, uiData) {
    // KRYTYCZNE v0.76: Zapisujemy czas startu z dev.js przed resetem
    const startOffset = devStartTime;

    resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
    uiData.savedGameState = null;
    menuOverlay.style.display = 'none';
    game.inMenu = false;
    game.paused = false;
    game.running = true;

    // NOWA LOGIKA v0.76: Ustawienie poprawnego czasu startowego
    const currentTime = performance.now();
    
    // Ustawienie game.time PO resetAll (które ustawia je na 0, jeśli nie załadowano presetu)
    game.time = startOffset; 

    // Obliczenie startTime, aby game.time pokazywało startOffset
    // startTime = currentTime - startOffset * 1000
    uiData.startTime = currentTime - startOffset * 1000;
    uiData.lastTime = currentTime;

    uiData.settings.lastElite = game.time;
    uiData.settings.lastSiegeEvent = game.time; // Użycie nowego game.time jako punktu odniesienia
    
    // POPRAWKA v0.77c: Poprawna obsługa czasu startowego dla Oblężenia
    // 'resetAll()' ustawiło 'currentSiegeInterval' na stałą wartość 150s.
    
    // Upewnij się, że czas startowy (jeśli użyto presetu) nie jest późniejszy niż pierwszy spawn
    if (uiData.settings.currentSiegeInterval < startOffset) {
        // Jeśli startujemy PO 150s, ustaw interwał na (startOffset + 10s), aby dać graczowi czas
        uiData.settings.currentSiegeInterval = startOffset + 10.0; 
    }
    console.log(`[EVENT] Pierwsze oblężenie o ${uiData.settings.currentSiegeInterval.toFixed(1)}s`);


    initAudio();

    if (uiData.animationFrameId === null) {
        uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
}

// POPRAWKA v0.65: Używa stałych z gameData.js
// POPRAWKA v0.68b: Dodano uiData i camera do sygnatury (dla kompatybilności z wywołaniem w main.js)
export function resetAll(canvas, settings, perkLevels, uiData, camera) {
    if (uiData.animationFrameId !== null) {
        cancelAnimationFrame(uiData.animationFrameId);
        uiData.animationFrameId = null;
    }

    uiData.lastTime = 0;
    uiData.startTime = 0;

    const game = uiData.game; 
    
    // POPRAWKA v0.70: Usunięto błędny 'await import'
    // Importy są teraz na górze pliku.
    
    if (devSettings.presetLoaded === false) {
        console.log("ResetAll: Wykonuję pełny reset statystyk.");
        // POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG i GAME_CONFIG
        // KRYTYCZNA UWAGA: game.time jest resetowane do 0.
        game.score = 0; game.level = 1; game.health = PLAYER_CONFIG.INITIAL_HEALTH; game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH; game.time = 0; 
        game.xp = 0; game.xpNeeded = GAME_CONFIG.INITIAL_XP_NEEDED; game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
        
        Object.assign(settings, { 
            spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
            maxEnemies: GAME_CONFIG.MAX_ENEMIES,
            eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
            lastHazardSpawn: 0, 
            lastSiegeEvent: 0, 
            // POPRAWKA v0.77: Resetowanie interwału oblężenia (do stałej wartości startowej 150s)
            currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME 
        });
        settings.lastFire = 0;
        settings.lastElite = 0;

        // POPRAWKA V0.66: Użyj rozmiarów świata zamiast canvas.width/height
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; 
        const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.reset(worldWidth, worldHeight);
        
        for (let key in perkLevels) {
            delete perkLevels[key];
        }
    } else {
        console.log("ResetAll: Pomijam reset statystyk (załadowano preset).");
        // POPRAWKA v0.75: Tylko statystyki, które MUSZĄ być zresetowane
        game.score = 0; 
        // game.time = 0; // NIE RESETUJ CZASU, jeśli preset jest załadowany
        
        // Level, XP, MaxHP/HP są zachowywane, ponieważ zostały ustawione przez Dev Menu.
        
        settings.lastFire = 0;
        settings.lastElite = 0;
        settings.lastHazardSpawn = 0; 
        settings.lastSiegeEvent = 0; 
        // POPRAWKA v0.77: Resetowanie interwału oblężenia (do stałej wartości startowej 150s)
        settings.currentSiegeInterval = SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
        
        devSettings.presetLoaded = false;
        
        // POPRAWKA V0.67: Upewnij się, że gracz jest na środku świata po resecie presetów
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; 
        const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.x = worldWidth / 2;
        uiData.player.y = worldHeight / 2;
        camera.offsetX = (worldWidth / 2) - (canvas.width / 2);
        camera.offsetY = (worldHeight / 2) - (canvas.height / 2);
    }

    // Te rzeczy resetujemy ZAWSZE
    game.magnet = false; game.magnetT = 0;
    game.shield = false; game.shieldT = 0; game.speedT = 0; game.freezeT = 0; game.shakeT = 0;
    game.shakeMag = 0; game.manualPause = false; game.collisionSlowdown = 0;

    // Czyszczenie tablic (te, które nie są pulami)
    uiData.enemies.length = 0; 
    uiData.chests.length = 0; 
    uiData.pickups.length = 0; 
    uiData.bombIndicators.length = 0;
    uiData.hazards.length = 0; // POPRAWKA v0.68b: Reset Hazardów
    
    // NOWE v0.75: Resetowanie kolejki spawnów oblężnika
    if (uiData.siegeSpawnQueue) {
        uiData.siegeSpawnQueue.length = 0;
    }

    // POPRAWKA v0.62: Zwalnianie obiektów z puli
    if (uiData.bulletsPool) {
        uiData.bulletsPool.releaseAll();
    }
    if (uiData.eBulletsPool) {
        uiData.eBulletsPool.releaseAll();
    }
    if (uiData.gemsPool) {
        uiData.gemsPool.releaseAll();
    }
    if (uiData.particlePool) {
        uiData.particlePool.releaseAll();
    }
    if (uiData.hitTextPool) {
        uiData.hitTextPool.releaseAll();
    }

    xpBarFill.style.width = '0%';
    uiData.initStarsCallback();
    
    // POPRAWKA v0.77j: Użyj bezpiecznego pobierania referencji
    if (!hpBarOuterRef) {
        hpBarOuterRef = document.getElementById('playerHPBarOuter');
    }
    if (hpBarOuterRef) {
        hpBarOuterRef.classList.remove('low-health-pulse');
    }
}

export function pauseGame(game, settings, weapons, player) {
    if (game.paused || game.inMenu) return;
    game.manualPause = true;
    game.paused = true;
    // POPRAWKA v0.70: Wywołanie funkcji z zaimportowanego levelManager
    updateStatsUI(game, player, settings, null, statsDisplayPause);
    pauseOverlay.style.display = 'flex';
}

// POPRAWKA v0.65: Używa stałej z UI_CONFIG
export function resumeGame(game, timerDuration = UI_CONFIG.RESUME_TIMER) {
    game.manualPause = false;
    pauseOverlay.style.display = 'none';
    levelUpOverlay.style.display = 'none'; 
    chestOverlay.style.display = 'none'; // POPRAWKA v0.70: Ukryj również skrzynię

    if (timerDuration <= 0) {
        resumeOverlay.style.display = 'none';
        game.paused = false;
        return;
    }

    let t = timerDuration;
    resumeOverlay.style.display = 'flex';
    const id = setInterval(() => {
        t = Math.max(0, t - 0.05);
        resumeText.textContent = `Wznawianie za: ${t.toFixed(2)} s`;
        if (t <= 0) {
            clearInterval(id);
            resumeOverlay.style.display = 'none';
            game.paused = false;
        }
    }, 50);
}

export function gameOver(game, uiData) {
    game.running = false;
    game.paused = true;
    uiData.savedGameState = null;
    
    const finalTimeValue = Math.floor(game.time);
    const currentRun = {
        score: game.score,
        level: game.level,
        time: finalTimeValue
    };
    
    finalScore.textContent = currentRun.score;
    finalLevel.textContent = currentRun.level;
    finalTime.textContent = formatTime(currentRun.time); 
    
    // POPRAWKA v0.70: Wywołania funkcji z zaimportowanego scoreManager
    saveScore(currentRun);
    displayScores('scoresBodyGameOver', currentRun); 
    attachClearScoresListeners();
    
    gameOverOverlay.style.display = 'flex';
    
    // POPRAWKA v0.77j: Użyj bezpiecznego pobierania referencji
    if (!hpBarOuterRef) {
        hpBarOuterRef = document.getElementById('playerHPBarOuter');
    }
    if (hpBarOuterRef) {
        hpBarOuterRef.classList.remove('low-health-pulse');
    }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77k] js/ui/ui.js: Usunięto błędny import paska HP.');