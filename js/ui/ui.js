// ==============
// UI.JS (v0.96b - Volume Sliders Logic)
// Lokalizacja: /js/ui/ui.js
// ==============

import { devSettings, devStartTime } from '../services/dev.js';
import { initAudio, playSound, setMusicVolume, setSfxVolume } from '../services/audio.js'; // FIX: Added volume setters
import { 
    GAME_CONFIG, PLAYER_CONFIG, UI_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG, MUSIC_CONFIG // FIX: Added MUSIC_CONFIG
} from '../config/gameData.js';
import { getLang } from '../services/i18n.js';
import { get as getAsset } from '../services/assets.js';

import {
    xpBarFill, playerHPBarInner, playerHPBarTxt, xpBarTxt, bonusPanel,
    statsDisplayPause, menuOverlay, btnContinue,
    levelUpOverlay, pauseOverlay, resumeOverlay, resumeText, 
    chestOverlay, gameOverOverlay, finalScore, finalLevel,
    finalTime, docTitle,
    enemyCountSpan, enemyLimitSpan 
} from './domElements.js';

import {
    formatTime, saveScore, displayScores, attachClearScoresListeners
} from '../services/scoreManager.js';

import { updateStatsUI } from '../managers/levelManager.js';
import { VERSION } from '../config/version.js'; 

export function switchView(viewId) {
    document.querySelectorAll('.menu-view').forEach(el => {
        el.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
        playSound('Click');
    }
    if (viewId === 'view-scores') {
        displayScores('scoresBodyMenu');
        const tableBody = document.getElementById('scoresBodyMenu');
        const emptyMsg = document.getElementById('scoresEmptyMsg');
        if (tableBody && tableBody.children.length === 0) {
            if(emptyMsg) emptyMsg.style.display = 'block';
        } else {
            if(emptyMsg) emptyMsg.style.display = 'none';
        }
    }
    if (viewId === 'view-guide') {
        if (window.wrappedGenerateGuide) window.wrappedGenerateGuide();
    }
}

export function initRetroToggles(game, uiData) {
    const hyperBtn = document.getElementById('toggleHyper');
    const hyperChk = document.getElementById('chkHyper');
    if (hyperBtn && hyperChk) {
        hyperChk.checked = game.hyper;
        updateToggleVisual(hyperBtn, game.hyper);
    }

    const shakeBtn = document.getElementById('toggleShake');
    const shakeChk = document.getElementById('chkShake');
    if (shakeBtn && shakeChk) {
        shakeChk.checked = !game.screenShakeDisabled;
        updateToggleVisual(shakeBtn, !game.screenShakeDisabled);
    }

    const fpsBtn = document.getElementById('toggleFPS');
    const fpsChk = document.getElementById('chkFPS');
    if (fpsBtn && fpsChk) {
        fpsChk.checked = uiData.showFPS;
        updateToggleVisual(fpsBtn, uiData.showFPS);
    }
    
    const lblBtn = document.getElementById('toggleLabels');
    const lblChk = document.getElementById('chkPickupLabels');
    if (lblBtn && lblChk) {
        lblChk.checked = uiData.pickupShowLabels;
        updateToggleVisual(lblBtn, uiData.pickupShowLabels);
    }

    // FIX v0.96b: Obsługa suwaków głośności
    const volMusic = document.getElementById('volMusic');
    if (volMusic) {
        // Synchronizuj suwak z aktualną głośnością przy otwarciu
        if (MUSIC_CONFIG && typeof MUSIC_CONFIG.VOLUME !== 'undefined') {
            volMusic.value = Math.floor(MUSIC_CONFIG.VOLUME * 100);
        }
        // Używamy oninput dla płynnej zmiany w trakcie przesuwania
        volMusic.oninput = (e) => {
            const val = parseInt(e.target.value) / 100;
            setMusicVolume(val);
        };
    }

    const volSFX = document.getElementById('volSFX');
    if (volSFX) {
        // SFX domyślnie startuje z 0.3 (30%), nie mamy configu w gameData dla SFX, więc ufamy suwakowi (z HTML value="30")
        volSFX.oninput = (e) => {
            const val = parseInt(e.target.value) / 100;
            setSfxVolume(val);
        };
    }
}

function updateToggleVisual(btn, isOn) {
    if (isOn) {
        btn.textContent = "WŁ";
        btn.className = "retro-toggle on";
    } else {
        btn.textContent = "WYŁ";
        btn.className = "retro-toggle off";
    }
}

function getIconTag(assetKey, cssClass = 'bar-icon') {
    const asset = getAsset(assetKey);
    if (asset) {
        return `<img src="${asset.src}" class="${cssClass}" alt="">`;
    }
    return ''; 
}

function generateGuide() {
    const guideContainer = document.getElementById('guideContent');
    if (!guideContainer) return;

    const guideData = [
        { customImg: 'img/drakul.png', nameKey: 'ui_player_name', descKey: 'ui_guide_intro' },
        { asset: 'gem', nameKey: 'ui_gem_name', descKey: 'ui_gem_desc' },
        { asset: 'chest', nameKey: 'pickup_chest_name', descKey: 'pickup_chest_desc' },
        { header: "Znajdźki" },
        { asset: 'pickup_heal', nameKey: 'pickup_heal_name', descKey: 'pickup_heal_desc' },
        { asset: 'pickup_magnet', nameKey: 'pickup_magnet_name', descKey: 'pickup_magnet_desc' },
        { asset: 'pickup_shield', nameKey: 'pickup_shield_name', descKey: 'pickup_shield_desc' },
        { asset: 'pickup_speed', nameKey: 'pickup_speed_name', descKey: 'pickup_speed_desc' },
        { asset: 'pickup_bomb', nameKey: 'pickup_bomb_name', descKey: 'pickup_bomb_desc' },
        { asset: 'pickup_freeze', nameKey: 'pickup_freeze_name', descKey: 'pickup_freeze_desc' },
        { header: "Wrogowie" },
        { asset: 'enemy_standard', nameKey: 'enemy_standard_name', descKey: 'enemy_standard_desc' },
        { asset: 'enemy_horde', nameKey: 'enemy_horde_name', descKey: 'enemy_horde_desc' },
        { asset: 'enemy_aggressive', nameKey: 'enemy_aggressive_name', descKey: 'enemy_aggressive_desc' },
        { asset: 'enemy_kamikaze', nameKey: 'enemy_kamikaze_name', descKey: 'enemy_kamikaze_desc' },
        { asset: 'enemy_splitter', nameKey: 'enemy_splitter_name', descKey: 'enemy_splitter_desc' },
        { asset: 'enemy_tank', nameKey: 'enemy_tank_name', descKey: 'enemy_tank_desc' },
        { asset: 'enemy_ranged', nameKey: 'enemy_ranged_name', descKey: 'enemy_ranged_desc' },
        { asset: 'enemy_wall', nameKey: 'enemy_wall_name', descKey: 'enemy_wall_desc' },
        { asset: 'enemy_elite', nameKey: 'enemy_elite_name', descKey: 'enemy_elite_desc' },
        { header: "Bronie" },
        { asset: 'icon_whip', nameKey: 'perk_whip_name', descKey: 'perk_whip_desc' },
        { asset: 'icon_autogun', nameKey: 'perk_autogun_name', descKey: 'perk_autogun_desc' },
        { asset: 'icon_orbital', nameKey: 'perk_orbital_name', descKey: 'perk_orbital_desc' },
        { asset: 'icon_nova', nameKey: 'perk_nova_name', descKey: 'perk_nova_desc' },
        { asset: 'icon_lightning', nameKey: 'perk_chainLightning_name', descKey: 'perk_chainLightning_desc' }
    ];

    let html = `<h4 style="color:#4caf50; margin-bottom:15px; text-align:center;">📖 ${getLang('ui_guide_title')}</h4>`;
    guideData.forEach(item => {
        if (item.header) {
            html += `<div class="guide-section-title" style="margin-top:20px; border-bottom:1px solid #444; color:#FFD700; font-size:1.2em;">${item.header}</div>`;
        } else {
            let displayIcon = '<span style="font-size:24px;">❓</span>';
            
            if (item.customImg) {
                displayIcon = `<img src="${item.customImg}" class="guide-icon">`;
            } else if (item.asset) {
                const asset = getAsset(item.asset);
                if(asset) displayIcon = `<img src="${asset.src}" class="guide-icon">`;
            }
            
            const name = item.nameKey ? getLang(item.nameKey) : item.title;
            const desc = item.descKey ? getLang(item.descKey) : item.desc;
            html += `<div class="guide-entry"><div class="guide-icon-wrapper">${displayIcon}</div><div class="guide-text-wrapper"><strong style="color:#FFD700;">${name}</strong><br><span style="color:#ccc; font-size:16px;">${desc}</span></div></div>`;
        }
    });
    guideContainer.innerHTML = html;
}

window.wrappedGenerateGuide = generateGuide;

let hpBarOuterRef = null;

export function updateEnemyCounter(game, enemies) {
    if (!game.running || game.paused) return;
    const nonWallEnemiesCount = enemies.filter(e => e.type !== 'wall').length;
    const limit = game.dynamicEnemyLimit;
    
    const cntSpan = document.getElementById('enemyCountSpan');
    const limSpan = document.getElementById('enemyLimitSpan');
    
    if (cntSpan) cntSpan.textContent = nonWallEnemiesCount;
    if (limSpan) limSpan.textContent = limit;
}

export function updateUI(game, player, settings, weapons, enemies = []) {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('xp').textContent = game.xp;
    document.getElementById('xpNeeded').textContent = game.xpNeeded;
    
    const healthTxt = document.getElementById('health');
    if(healthTxt) healthTxt.textContent = `${Math.max(0, Math.floor(game.health))}/${game.maxHealth}`;
    
    document.getElementById('time').textContent = formatTime(Math.floor(game.time));

    const xpPct = Math.max(0, Math.min(1, game.xp / game.xpNeeded));
    xpBarFill.style.width = (xpPct * 100).toFixed(1) + '%';

    const healthPctBar = Math.max(0, Math.min(1, game.health / game.maxHealth));
    playerHPBarInner.style.width = (healthPctBar * 100).toFixed(1) + '%';
    
    playerHPBarTxt.innerHTML = `${Math.max(0, Math.floor(game.health))}/${game.maxHealth}`;
    xpBarTxt.innerHTML = `${game.xp}/${game.xpNeeded}`;

    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) { 
        if (healthPctBar <= UI_CONFIG.LOW_HEALTH_THRESHOLD && game.health > 0) {
            hpBarOuterRef.classList.add('low-health-pulse');
        } else {
            hpBarOuterRef.classList.remove('low-health-pulse');
        }
    }

    let bonusHTML = '';
    const bonusAssets = { magnet: 'icon_hud_magnet', shield: 'icon_hud_shield', speed: 'icon_hud_speed', freeze: 'icon_hud_freeze' };
    const createBonusEntry = (type, time) => {
        const asset = getAsset(bonusAssets[type]);
        const iconHtml = asset ? `<img src="${asset.src}" class="bonus-icon-img">` : `<span class="bonus-emoji">❓</span>`;
        return `<div class="bonus-entry">${iconHtml}<span class="bonus-txt">${Math.ceil(time)}s</span></div>`;
    };

    if (game.magnetT > 0) bonusHTML += createBonusEntry('magnet', game.magnetT);
    if (game.shieldT > 0) bonusHTML += createBonusEntry('shield', game.shieldT);
    if (game.speedT > 0) bonusHTML += createBonusEntry('speed', game.speedT);
    if (game.freezeT > 0) bonusHTML += createBonusEntry('freeze', game.freezeT);
    bonusPanel.innerHTML = bonusHTML;
}

export function showMenu(game, resetAll, uiData, allowContinue = false) {
    devSettings.presetLoaded = false; 

    if (!allowContinue) {
        resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
        uiData.savedGameState = null;
    }

    if (uiData.savedGameState && allowContinue) btnContinue.style.display = 'block';
    else btnContinue.style.display = 'none';

    switchView('view-main');
    menuOverlay.style.display = 'flex';
    
    const verTag = document.getElementById('menuVersionTag');
    if(verTag) verTag.textContent = `v${VERSION}`;
    
    game.inMenu = true; game.paused = true; game.running = false;

    // FIX v0.96a: Start muzyki menu po wejściu do menu
    initAudio(); 
    playSound('MusicMenu');

    if (uiData.animationFrameId !== null) { cancelAnimationFrame(uiData.animationFrameId); uiData.animationFrameId = null; }
    if (uiData.animationFrameId === null) uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);

    initRetroToggles(game, uiData);
    window.wrappedGenerateGuide();
    
    updateUI(game, uiData.player, uiData.settings, null); 
    uiData.ctx.clearRect(0, 0, uiData.canvas.width, uiData.canvas.height);
    uiData.drawCallback(); 
    
    displayScores('scoresBodyMenu');
    attachClearScoresListeners();
}

export function startRun(game, resetAll, uiData) {
    const startOffset = devStartTime;
    resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
    uiData.savedGameState = null;
    menuOverlay.style.display = 'none';
    game.inMenu = false; game.paused = false; game.running = true;

    const currentTime = performance.now();
    game.time = startOffset; 
    uiData.startTime = currentTime - startOffset * 1000;
    uiData.lastTime = currentTime;

    uiData.settings.lastElite = game.time;
    uiData.settings.lastSiegeEvent = game.time; 
    if (uiData.settings.currentSiegeInterval < startOffset) {
        uiData.settings.currentSiegeInterval = startOffset + 10.0; 
    }
    
    initAudio();
    // FIX v0.96a: Start muzyki gameplay po rozpoczęciu gry
    playSound('MusicGameplay');
    
    if (uiData.animationFrameId === null) uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
}

export function resetAll(canvas, settings, perkLevels, uiData, camera) {
    if (uiData.animationFrameId !== null) { cancelAnimationFrame(uiData.animationFrameId); uiData.animationFrameId = null; }
    uiData.lastTime = 0; uiData.startTime = 0;
    const game = uiData.game; 
    
    if (devSettings.presetLoaded === false) {
        game.score = 0; game.level = 1; game.health = PLAYER_CONFIG.INITIAL_HEALTH; game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH; game.time = 0; 
        game.xp = 0; game.xpNeeded = GAME_CONFIG.INITIAL_XP_NEEDED; game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
        Object.assign(settings, { spawn: GAME_CONFIG.INITIAL_SPAWN_RATE, maxEnemies: GAME_CONFIG.MAX_ENEMIES, eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL, lastHazardSpawn: 0, lastSiegeEvent: 0, currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME });
        settings.lastFire = 0; settings.lastElite = 0;
        game.newEnemyWarningT = 0; game.newEnemyWarningType = null; game.seenEnemyTypes = ['standard'];
        
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.reset(worldWidth, worldHeight);
        
        for (let key in perkLevels) delete perkLevels[key];
    } 
    else {
        game.score = 0; 
        settings.lastFire = 0; 
        settings.lastElite = 0; 
        settings.lastHazardSpawn = 0; 
        settings.lastSiegeEvent = 0; 
        settings.currentSiegeInterval = SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
        game.newEnemyWarningT = 0; game.newEnemyWarningType = null;
        
        const worldWidth = canvas.width * WORLD_CONFIG.SIZE; const worldHeight = canvas.height * WORLD_CONFIG.SIZE; 
        uiData.player.x = worldWidth / 2; uiData.player.y = worldHeight / 2;
        camera.offsetX = (worldWidth / 2) - (canvas.width / 2); camera.offsetY = (worldHeight / 2) - (canvas.height / 2);
    }

    game.magnet = false; game.magnetT = 0; game.shield = false; game.shieldT = 0; game.speedT = 0; game.freezeT = 0; game.shakeT = 0;
    game.shakeMag = 0; game.manualPause = false; game.collisionSlowdown = 0; game.dynamicEnemyLimit = GAME_CONFIG.INITIAL_MAX_ENEMIES;
    
    uiData.enemies.length = 0; uiData.chests.length = 0; uiData.pickups.length = 0; uiData.bombIndicators.length = 0; uiData.hazards.length = 0; 
    if (uiData.siegeSpawnQueue) uiData.siegeSpawnQueue.length = 0;
    if (uiData.bulletsPool) uiData.bulletsPool.releaseAll();
    if (uiData.eBulletsPool) uiData.eBulletsPool.releaseAll();
    if (uiData.gemsPool) uiData.gemsPool.releaseAll();
    if (uiData.particlePool) uiData.particlePool.releaseAll();
    if (uiData.hitTextPool) uiData.hitTextPool.releaseAll();
    xpBarFill.style.width = '0%';
    if (uiData.initStarsCallback) uiData.initStarsCallback();
    
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) hpBarOuterRef.classList.remove('low-health-pulse');
    
    bonusPanel.innerHTML = '';
}

export function pauseGame(game, settings, weapons, player) {
    if (game.paused || game.inMenu) return;
    game.manualPause = true; 
    game.paused = true;
    pauseOverlay.style.display = 'flex';
    resumeOverlay.style.display = 'none';
    try {
        if (statsDisplayPause) {
            updateStatsUI(game, player, settings, weapons, statsDisplayPause);
        }
    } catch (e) {
        console.error("[UI] Błąd przy aktualizacji statystyk w pauzie:", e);
    }
}

export function resumeGame(game, timerDuration = UI_CONFIG.RESUME_TIMER) {
    game.manualPause = false;
    pauseOverlay.style.display = 'none';
    levelUpOverlay.style.display = 'none'; 
    chestOverlay.style.display = 'none'; 
    
    if (timerDuration <= 0) { resumeOverlay.style.display = 'none'; game.paused = false; return; }
    
    let t = timerDuration;
    resumeOverlay.style.display = 'flex';
    const titleEl = document.getElementById('resumeTitle');
    
    const id = setInterval(() => {
        t = Math.max(0, t - 0.05);
        resumeText.textContent = `${getLang('ui_resume_text')} ${t.toFixed(2)} s`;
        if(titleEl) titleEl.textContent = Math.ceil(t);
        
        if (t <= 0) { clearInterval(id); resumeOverlay.style.display = 'none'; game.paused = false; }
    }, 50);
}

export function gameOver(game, uiData) {
    game.running = false; game.paused = true; uiData.savedGameState = null;
    const finalTimeValue = Math.floor(game.time);
    const currentRun = { score: game.score, level: game.level, time: finalTimeValue };
    finalScore.textContent = currentRun.score;
    finalLevel.textContent = currentRun.level;
    finalTime.textContent = formatTime(currentRun.time); 
    saveScore(currentRun);
    
    // FIX v0.96a: Powrót muzyki menu przy Game Over
    playSound('MusicMenu');
    
    displayScores('scoresBodyGameOver', currentRun); 
    
    attachClearScoresListeners();
    gameOverOverlay.style.display = 'flex';
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) hpBarOuterRef.classList.remove('low-health-pulse');
}

window.wrappedDisplayScores = () => displayScores('scoresBodyMenu');