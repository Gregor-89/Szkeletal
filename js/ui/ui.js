// ==============
// UI.JS (v0.91 - Fix: Graphic Guide, Timers Position)
// Lokalizacja: /js/ui/ui.js
// ==============

import { devSettings } from '../services/dev.js';
import { initAudio, playSound } from '../services/audio.js';
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG 
} from '../config/gameData.js';
import { getLang } from '../services/i18n.js';
import { get as getAsset } from '../services/assets.js';
import { devStartTime } from '../services/dev.js';

import {
    xpBarFill, playerHPBarInner, playerHPBarTxt, xpBarTxt, bonusPanel,
    statsDisplayPause, menuOverlay, btnContinue,
    levelUpOverlay, pauseOverlay, resumeOverlay, resumeText, 
    chestOverlay, gameOverOverlay, finalScore, finalLevel,
    finalTime, titleDiv, docTitle,
    enemyCountSpan, enemyLimitSpan, enemyProgressDiv 
} from './domElements.js';

import {
    formatTime, saveScore, displayScores, attachClearScoresListeners
} from '../services/scoreManager.js';

import { updateStatsUI } from '../managers/levelManager.js';


// --- FUNKCJE POMOCNICZE ---

function getIconTag(assetKey, cssClass = 'bar-icon') {
    const asset = getAsset(assetKey);
    if (asset) {
        return `<img src="${asset.src}" class="${cssClass}" alt="">`;
    }
    return ''; 
}

// KOMPLETNY GENERATOR PRZEWODNIKA (WSZYSTKIE OBIEKTY)
function generateGuide() {
    const guideContainer = document.getElementById('guideContent');
    if (!guideContainer) return;

    // Definicja sekcji i elementów
    const guideData = [
        { header: "Bohater i Zasoby" },
        { asset: 'player', title: 'Drakul', desc: 'Główny bohater. Przetrwaj jak najdłużej.' },
        { asset: 'gem', title: 'Ziemniak (XP)', desc: 'Zbieraj je, aby awansować na kolejne poziomy.' },
        { asset: 'chest', title: 'Skrzynia', desc: 'Zawiera potężne ulepszenia. Wypada z Elit.' },

        { header: "Znajdźki (Pickupy)" },
        { asset: 'pickup_heal', title: 'Leczenie', desc: 'Odnawia 30 punktów życia.' },
        { asset: 'pickup_magnet', title: 'Magnes', desc: 'Przyciąga wszystkie leżące na ziemi Ziemniaki.' },
        { asset: 'pickup_shield', title: 'Tarcza', desc: 'Daje tymczasową nieśmiertelność.' },
        { asset: 'pickup_speed', title: 'Szybkość', desc: 'Tymczasowo zwiększa prędkość poruszania się.' },
        { asset: 'pickup_bomb', title: 'Bomba', desc: 'Niszczy wszystkich widocznych wrogów.' },
        { asset: 'pickup_freeze', title: 'Zamrożenie', desc: 'Zatrzymuje wrogów w miejscu.' },

        { header: "Wrogowie" },
        { asset: 'enemy_standard', title: 'Fanatyk', desc: 'Podstawowy przeciwnik. Słaby, ale liczny.' },
        { asset: 'enemy_horde', title: 'Horda', desc: 'Bardzo szybki, atakuje w grupach.' },
        { asset: 'enemy_tank', title: 'Tank', desc: 'Powolny, ale bardzo wytrzymały.' },
        { asset: 'enemy_aggressive', title: 'Agresor', desc: 'Szybko szarżuje na gracza.' },
        { asset: 'enemy_ranged', title: 'Strzelec', desc: 'Rzuca butelkami z dystansu.' },
        { asset: 'enemy_splitter', title: 'Podziałowiec', desc: 'Rozpada się na mniejsze po śmierci.' },
        { asset: 'enemy_kamikaze', title: 'Kamikaze', desc: 'Wybucha przy zbliżeniu.' },
        { asset: 'enemy_wall', title: 'Oblężnik', desc: 'Tworzy ściany blokujące ruch.' },
        { asset: 'enemy_elite', title: 'Elita', desc: 'Boss. Bardzo silny, zostawia skrzynię.' },
        
        { header: "Bronie i Perki" },
        { asset: 'icon_whip', title: 'Bicz', desc: 'Atakuje w poziomie.' },
        { asset: 'icon_autogun', title: 'AutoGun', desc: 'Automatycznie strzela do najbliższego wroga.' },
        { asset: 'icon_orbital', title: 'Orbital', desc: 'Ziemniak krążący wokół gracza.' },
        { asset: 'icon_nova', title: 'Nova', desc: 'Wybuch wokół gracza.' },
        { asset: 'icon_lightning', title: 'Piorun', desc: 'Raźi losowych wrogów łańcuchem.' }
    ];

    let html = '<h4 style="color:#4caf50; margin-bottom:15px;">📖 Encyklopedia Szkeletal</h4>';
    
    guideData.forEach(item => {
        if (item.header) {
            html += `<div class="guide-section-title">${item.header}</div>`;
        } else {
            // Generowanie wpisu z obrazkiem
            const imgTag = getIconTag(item.asset, 'guide-icon');
            const displayIcon = imgTag ? imgTag : '<span style="font-size:24px;">❓</span>';
            
            html += `
                <div class="guide-entry">
                    <div style="width:40px; text-align:center; flex-shrink:0;">${displayIcon}</div>
                    <div>
                        <strong style="color:#fff;">${item.title}</strong><br>
                        <span style="color:#bbb; font-size:13px;">${item.desc}</span>
                    </div>
                </div>
            `;
        }
    });
    
    html += '<p style="margin-top:20px; color:#666; font-size:11px;">* Grafiki v0.91</p>';
    guideContainer.innerHTML = html;
}

// Podmiana ikon w elementach statycznych (Dev Menu, Tabele)
function updateStaticIcons() {
    const headerMap = {
        'scoresRankMenu': '#️⃣', 
        'scoresScoreMenu': 'icon_hud_score',
        'scoresLevelMenu': 'icon_hud_level',
        'scoresTimeMenu': 'icon_hud_time',
        'scoresRankGO': '#️⃣',
        'scoresScoreGO': 'icon_hud_score',
        'scoresLevelGO': 'icon_hud_level',
        'scoresTimeGO': 'icon_hud_time'
    };

    for (const [id, assetKey] of Object.entries(headerMap)) {
        const el = document.getElementById(id);
        if (el) {
            if (assetKey.startsWith('icon_')) {
                // Pobieramy sam tekst bez starych obrazków/emoji
                const cleanText = el.innerText.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ: ]/g, '').trim();
                el.innerHTML = getIconTag(assetKey, 'bar-icon') + ' ' + cleanText;
            } 
        }
    }
}

// Inicjalizacja z opóźnieniem (aby assets.js zdążyło załadować grafiki)
setTimeout(() => {
    generateGuide();
    updateStaticIcons();
}, 600);


// --- GŁÓWNA FUNKCJA AKTUALIZACJI UI ---

let hpBarOuterRef = null;

export function updateEnemyCounter(game, enemies) {
    if (!game.running || game.paused) return;
    const nonWallEnemiesCount = enemies.filter(e => e.type !== 'wall').length;
    const limit = game.dynamicEnemyLimit;
    
    if (enemyCountSpan) enemyCountSpan.textContent = nonWallEnemiesCount;
    if (enemyLimitSpan) enemyLimitSpan.textContent = limit;
    
    if (enemyProgressDiv && limit > 0) {
        const enemyPct = Math.min(100, (nonWallEnemiesCount / limit) * 100);
        enemyProgressDiv.style.width = enemyPct.toFixed(1) + '%';
        
        if (enemyPct > 85) {
             enemyProgressDiv.style.background = 'linear-gradient(90deg, #f44336, #e53935)';
        } else if (enemyPct > 50) {
             enemyProgressDiv.style.background = 'linear-gradient(90deg, #ff9800, #fb8c00)';
        } else {
             enemyProgressDiv.style.background = 'linear-gradient(90deg, #4fc3f7, #81c784)';
        }
    }
}


export function updateUI(game, player, settings, weapons, enemies = []) {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('xp').textContent = game.xp;
    document.getElementById('xpNeeded').textContent = game.xpNeeded;
    document.getElementById('health').textContent = Math.max(0, Math.floor(game.health));
    document.getElementById('time').textContent = formatTime(Math.floor(game.time));

    const xpPct = Math.max(0, Math.min(1, game.xp / game.xpNeeded));
    xpBarFill.style.width = (xpPct * 100).toFixed(1) + '%';
    document.getElementById('xpProgress').style.width = (xpPct * 100).toFixed(1) + '%';
    document.getElementById('healthProgress').style.width = (Math.max(0, game.health / game.maxHealth) * 100).toFixed(1) + '%';
    document.getElementById('levelProgress').style.width = (Math.min(100, game.level * 5)) + '%';
    document.getElementById('scoreProgress').style.width = (Math.min(100, game.score / 50)) + '%';
    document.getElementById('timeProgress').style.width = (Math.min(100, game.time / 6)) + '%';

    const healthPct = Math.max(0, Math.min(1, game.health / game.maxHealth));
    playerHPBarInner.style.width = (healthPct * 100).toFixed(1) + '%';
    playerHPBarTxt.innerHTML = `${getIconTag('icon_hud_health')} ${Math.max(0, Math.floor(game.health))} / ${game.maxHealth}`;

    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) { 
        if (healthPct <= UI_CONFIG.LOW_HEALTH_THRESHOLD && game.health > 0) {
            hpBarOuterRef.classList.add('low-health-pulse');
        } else {
            hpBarOuterRef.classList.remove('low-health-pulse');
        }
    }

    if (xpBarTxt) {
        xpBarTxt.innerHTML = `${getIconTag('icon_hud_xp')} ${game.xp} / ${game.xpNeeded}`;
    }

    // --- PANEL BONUSÓW ---
    let bonusHTML = '';
    
    const bonusAssets = { 
        magnet: 'icon_hud_magnet', shield: 'icon_hud_shield', speed: 'icon_hud_speed', freeze: 'icon_hud_freeze' 
    };
    
    const createBonusEntry = (type, time) => {
        const asset = getAsset(bonusAssets[type]);
        const iconHtml = asset 
            ? `<img src="${asset.src}" class="bonus-icon-img">` 
            : `<span class="bonus-emoji">❓</span>`;
        return `<div class="bonus-entry">${iconHtml}<span class="bonus-txt">${Math.ceil(time)}s</span></div>`;
    };

    if (game.magnetT > 0) bonusHTML += createBonusEntry('magnet', game.magnetT);
    if (game.shieldT > 0) bonusHTML += createBonusEntry('shield', game.shieldT);
    if (game.speedT > 0) bonusHTML += createBonusEntry('speed', game.speedT);
    if (game.freezeT > 0) bonusHTML += createBonusEntry('freeze', game.freezeT);
    
    bonusPanel.innerHTML = bonusHTML;
}

// --- ZARZĄDZANIE STANEM GRY ---

export function showMenu(game, resetAll, uiData, allowContinue = false) {
    if (!allowContinue) {
        resetAll(uiData.canvas, uiData.settings, uiData.perkLevels, uiData, uiData.camera); 
        uiData.savedGameState = null;
    }

    if (uiData.savedGameState && allowContinue) btnContinue.style.display = 'block';
    else btnContinue.style.display = 'none';

    menuOverlay.style.display = 'flex';
    game.inMenu = true; game.paused = true; game.running = false;

    if (uiData.animationFrameId !== null) { cancelAnimationFrame(uiData.animationFrameId); uiData.animationFrameId = null; }
    if (uiData.animationFrameId === null) uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);

    docTitle.textContent = `${getLang('ui_player_name')} v${uiData.VERSION}`;
    
    // Wymuszamy odświeżenie przewodnika przy otwarciu menu
    generateGuide();
    updateStaticIcons();
    
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
    } else {
        game.score = 0; 
        settings.lastFire = 0; settings.lastElite = 0; settings.lastHazardSpawn = 0; settings.lastSiegeEvent = 0; 
        settings.currentSiegeInterval = SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
        game.newEnemyWarningT = 0; game.newEnemyWarningType = null;
        devSettings.presetLoaded = false;
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
    uiData.initStarsCallback();
    
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) hpBarOuterRef.classList.remove('low-health-pulse');
    
    bonusPanel.innerHTML = '';
}

export function pauseGame(game, settings, weapons, player) {
    if (game.paused || game.inMenu) return;
    game.manualPause = true; game.paused = true;
    updateStatsUI(game, player, settings, weapons, statsDisplayPause);
    pauseOverlay.style.display = 'flex';
}

export function resumeGame(game, timerDuration = UI_CONFIG.RESUME_TIMER) {
    game.manualPause = false;
    pauseOverlay.style.display = 'none';
    levelUpOverlay.style.display = 'none'; 
    chestOverlay.style.display = 'none'; 
    if (timerDuration <= 0) { resumeOverlay.style.display = 'none'; game.paused = false; return; }
    let t = timerDuration;
    resumeOverlay.style.display = 'flex';
    const id = setInterval(() => {
        t = Math.max(0, t - 0.05);
        resumeText.textContent = `${getLang('ui_resume_text')} ${t.toFixed(2)} s`;
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
    displayScores('scoresBodyGameOver', currentRun); 
    attachClearScoresListeners();
    gameOverOverlay.style.display = 'flex';
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) hpBarOuterRef.classList.remove('low-health-pulse');
    
    updateStaticIcons();
}