// ==============
// UI.JS (v1.0d - Game Ref Passed)
// Lokalizacja: /js/ui/ui.js
// ==============

import { devSettings, devStartTime, retryLastScenario } from '../services/dev.js'; 
import { initAudio, playSound } from '../services/audio.js'; 
import { GAME_CONFIG, PLAYER_CONFIG, UI_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } from '../config/gameData.js';
import { getLang } from '../services/i18n.js';
import { 
    menuOverlay, btnContinue, levelUpOverlay, pauseOverlay, 
    resumeOverlay, resumeText, chestOverlay, gameOverOverlay, finalScore, 
    finalLevel, finalTime, enemyCountSpan, enemyLimitSpan,
    statsDisplayPause
} from './domElements.js';
import { formatTime, saveScore, attachClearScoresListeners, displayScores } from '../services/scoreManager.js';
import { updateStatsUI } from '../managers/levelManager.js';
import { VERSION } from '../config/version.js'; 

import * as Hud from './hud.js';
import * as Menus from './menus.js';
import * as LeaderboardUI from './leaderboardUI.js';

let hpBarOuterRef = null;

export function updateEnemyCounter(game, enemies) {
    Hud.updateEnemyCounter(game, enemies);
}

export function updateUI(game, player, settings, weapons, enemies = []) {
    Hud.updateUI(game, player, settings);
}

export function showMenu(game, resetAllFn, uiData, allowContinue = false) {
    devSettings.presetLoaded = false; 
    
    // ZMIANA: Ustawiamy referencję gry w LeaderboardUI
    LeaderboardUI.setGameRef(game);

    if (!allowContinue) { 
        if (resetAllFn) {
            resetAllFn();
        } else {
            resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
        }
        uiData.savedGameState = null; 
    }
    
    if (uiData.savedGameState && allowContinue) {
        if(btnContinue) btnContinue.style.display = 'block'; 
    } else {
        if(btnContinue) btnContinue.style.display = 'none';
    }
    
    Menus.switchView('view-main');
    if(menuOverlay) menuOverlay.style.display = 'flex';
    
    Menus.updateStaticTranslations(); 
    
    const verTag = document.getElementById('menuVersionTag');
    if(verTag) verTag.textContent = `v${VERSION}`;
    
    game.inMenu = true; 
    game.paused = true; 
    game.running = false;
    
    initAudio(); 
    playSound('MusicMenu');
    
    if (uiData.animationFrameId !== null) { 
        cancelAnimationFrame(uiData.animationFrameId); 
        uiData.animationFrameId = null; 
    }
    if (uiData.animationFrameId === null) {
        uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
    
    Menus.initRetroToggles(game, uiData);
    
    if(window.wrappedGenerateGuide) window.wrappedGenerateGuide();
    updateUI(game, uiData.player, uiData.settings, null); 
    uiData.ctx.clearRect(0, 0, uiData.canvas.width, uiData.canvas.height);
    uiData.drawCallback(); 
    
    LeaderboardUI.initLeaderboardUI(); 
    
    if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard();
    else displayScores('scoresBodyMenu');
    
    attachClearScoresListeners();
}

export function startRun(game, resetAllFn, uiData) {
    // ZMIANA: Upewniamy się, że referencja jest świeża
    LeaderboardUI.setGameRef(game);

    if (devSettings.presetLoaded && !devSettings.justStartedFromMenu) { 
        retryLastScenario(); 
    }
    devSettings.justStartedFromMenu = false;

    const startOffset = devStartTime;
    
    if (resetAllFn) {
        resetAllFn();
    } else {
        resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
    }

    uiData.savedGameState = null;
    if(menuOverlay) menuOverlay.style.display = 'none';
    
    initAudio(); 
    playSound('MusicGameplay');
    
    if (uiData.animationFrameId === null) {
        uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }

    game.inMenu = false; 
    game.running = true;
    
    const currentTime = performance.now();
    game.time = startOffset; 
    uiData.startTime = currentTime - startOffset * 1000;
    uiData.lastTime = currentTime;
    
    uiData.settings.lastElite = game.time;
    uiData.settings.lastSiegeEvent = game.time; 
    if (uiData.settings.currentSiegeInterval < startOffset) {
        uiData.settings.currentSiegeInterval = startOffset + 10.0; 
    }
    
    console.log("[UI] startRun: Gra uruchomiona.", { time: game.time, enemies: devSettings.allowedEnemies });

    const tutorialSeen = localStorage.getItem('szkeletal_tutorial_seen');
    if (!tutorialSeen) {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            Menus.updateStaticTranslations();
            game.paused = true; 
        }
    } else {
        game.paused = false; 
    }
}

export function resetAll(canvas, settings, perkLevels, uiData, camera) {
    if (uiData.animationFrameId !== null) { 
        cancelAnimationFrame(uiData.animationFrameId); 
        uiData.animationFrameId = null; 
    }
    uiData.lastTime = 0; 
    uiData.startTime = 0;
    const game = uiData.game; 
    
    if (devSettings.presetLoaded === false) {
        game.score = 0; 
        game.level = 1; 
        game.health = PLAYER_CONFIG.INITIAL_HEALTH; 
        game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH; 
        game.time = 0; 
        game.xp = 0; 
        game.xpNeeded = GAME_CONFIG.INITIAL_XP_NEEDED; 
        game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
        
        Object.assign(settings, { 
            spawn: GAME_CONFIG.INITIAL_SPAWN_RATE, 
            maxEnemies: GAME_CONFIG.MAX_ENEMIES, 
            eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL, 
            lastHazardSpawn: 0, 
            lastSiegeEvent: 0, 
            currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME 
        });
        settings.lastFire = 0; 
        settings.lastElite = 0;
        
        game.newEnemyWarningT = 0; 
        game.newEnemyWarningType = null; 
        game.seenEnemyTypes = [];
        game.totalKills = 0; 
        game.gameplayQuoteTimer = 60; 
        
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; 
        const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.reset(worldWidth, worldHeight);
        
        for (let key in perkLevels) delete perkLevels[key];
    } else {
        game.score = 0; 
        settings.lastFire = 0; 
        settings.lastElite = 0; 
        settings.lastHazardSpawn = 0; 
        settings.lastSiegeEvent = 0; 
        settings.currentSiegeInterval = SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
        game.newEnemyWarningT = 0; 
        game.newEnemyWarningType = null; 
        game.totalKills = 0; 
        game.gameplayQuoteTimer = 60; 
        
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; 
        const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.x = worldWidth / 2; 
        uiData.player.y = worldHeight / 2;
        camera.offsetX = (worldWidth / 2) - (canvas.width / 2); 
        camera.offsetY = (worldHeight / 2) - (canvas.height / 2);
    }
    
    game.magnet = false; game.magnetT = 0; 
    game.shield = false; game.shieldT = 0; 
    game.speedT = 0; game.freezeT = 0; 
    game.shakeT = 0; game.shakeMag = 0; 
    game.manualPause = false; 
    game.collisionSlowdown = 0; 
    game.dynamicEnemyLimit = GAME_CONFIG.INITIAL_MAX_ENEMIES;
    game.hunger = GAME_CONFIG.MAX_HUNGER || 100;
    
    uiData.enemies.length = 0; 
    uiData.chests.length = 0; 
    uiData.pickups.length = 0; 
    uiData.bombIndicators.length = 0; 
    uiData.hazards.length = 0; 
    if (uiData.siegeSpawnQueue) uiData.siegeSpawnQueue.length = 0;
    
    if (uiData.bulletsPool) uiData.bulletsPool.releaseAll();
    if (uiData.eBulletsPool) uiData.eBulletsPool.releaseAll();
    if (uiData.gemsPool) uiData.gemsPool.releaseAll();
    if (uiData.particlePool) uiData.particlePool.releaseAll();
    if (uiData.hitTextPool) uiData.hitTextPool.releaseAll();
    
    Hud.resetHealthBarVisuals();
    const xpFill = document.getElementById('xpBarFill');
    if(xpFill) xpFill.style.width = '0%';
    
    if (uiData.initStarsCallback) uiData.initStarsCallback();
}

export function pauseGame(game, settings, weapons, player) {
    if (game.isDying) return;
    if (game.paused || game.inMenu) return;
    
    game.manualPause = true; 
    game.paused = true;
    
    if(pauseOverlay) pauseOverlay.style.display = 'flex'; 
    if(resumeOverlay) resumeOverlay.style.display = 'none';
    
    try { 
        if (statsDisplayPause) updateStatsUI(game, player, settings, weapons, statsDisplayPause); 
    } catch (e) { console.error(e); }
    
    Menus.updateStaticTranslations(); 
}

export function resumeGame(game, timerDuration = UI_CONFIG.RESUME_TIMER) {
    game.manualPause = false;
    
    if(pauseOverlay) pauseOverlay.style.display = 'none'; 
    if(levelUpOverlay) levelUpOverlay.style.display = 'none'; 
    if(chestOverlay) chestOverlay.style.display = 'none'; 
    
    if (timerDuration <= 0) { 
        if(resumeOverlay) resumeOverlay.style.display = 'none'; 
        game.paused = false; 
        playSound('MusicGameplay'); 
        return; 
    }
    
    let t = timerDuration;
    if(resumeOverlay) resumeOverlay.style.display = 'flex';
    
    const id = setInterval(() => {
        t = Math.max(0, t - 0.05);
        if(resumeText) resumeText.textContent = `${getLang('ui_resume_text')} ${t.toFixed(2)} s`;
        
        if (t <= 0) { 
            clearInterval(id); 
            if(resumeOverlay) resumeOverlay.style.display = 'none'; 
            game.paused = false; 
            playSound('MusicGameplay'); 
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
        time: finalTimeValue, 
        kills: game.totalKills || 0,
        date: new Date().toISOString()
    };
    
    if(finalScore) finalScore.textContent = currentRun.score; 
    if(finalLevel) finalLevel.textContent = currentRun.level; 
    if(finalTime) finalTime.textContent = formatTime(currentRun.time); 
    
    const gameOverKillsLabel = document.getElementById('totalKillsSpanGO');
    if (gameOverKillsLabel) gameOverKillsLabel.textContent = game.totalKills || 0;

    const playerNick = localStorage.getItem('szkeletal_player_nick') || "GRACZ";
    saveScore(currentRun, playerNick); 
    
    playSound('MusicMenu');
    
    const btnSubmit = document.getElementById('btnSubmitScore');
    const msgDiv = document.getElementById('submitMsg');
    if(btnSubmit) {
        if(game.score > 0) {
            btnSubmit.style.display = 'inline-block';
            if(msgDiv) msgDiv.textContent = "";
        } else {
            btnSubmit.style.display = 'none';
        }
    }

    attachClearScoresListeners();
    if(gameOverOverlay) gameOverOverlay.style.display = 'flex';
    
    LeaderboardUI.setLastRun(currentRun);
    LeaderboardUI.initGameOverTabs(); 

    Hud.resetHealthBarVisuals();
    Menus.updateStaticTranslations(); 
}

export const switchView = Menus.switchView;
export const updateStaticTranslations = Menus.updateStaticTranslations;
export const initRetroToggles = Menus.initRetroToggles;