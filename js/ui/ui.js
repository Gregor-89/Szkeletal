// ==============
// UI.JS (v0.65b - Poprawka krytycznego błędu importu)
// Lokalizacja: /js/ui/ui.js
// ==============

import { spawnConfetti, addHitText } from '../core/utils.js';
// POPRAWKA v0.65b: Dodano brakujące importy PLAYER_CONFIG, PERK_CONFIG i UI_CONFIG
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG 
} from '../config/gameData.js';
import { perkPool } from '../config/perks.js';
import { initAudio, playSound } from '../services/audio.js';
import { devSettings } from '../services/dev.js';
import { AutoGun, OrbitalWeapon, NovaWeapon } from '../config/weapon.js';

// --- REFERENCJE DO DOM ---
const xpBarFill = document.getElementById('xpBarFill');
const playerHPBarInner = document.getElementById('playerHPBarInner');
const playerHPBarTxt = document.getElementById('playerHPBarTxt');
const xpBarTxt = document.getElementById('xpBarTxt'); 
const bonusPanel = document.getElementById('bonusPanel');
const statsDisplay = document.getElementById('statsDisplay');
const statsDisplayPause = document.getElementById('statsDisplayPause');
const menuOverlay = document.getElementById('menuOverlay');
const btnContinue = document.getElementById('btnContinue');
const levelUpOverlay = document.getElementById('levelUpOverlay');
const perksDiv = document.getElementById('perks');
const btnContinueMaxLevel = document.getElementById('btnContinueMaxLevel');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeOverlay = document.getElementById('resumeOverlay');
const resumeText = document.getElementById('resumeText');
const chestOverlay = document.getElementById('chestOverlay');
const chestButton = document.getElementById('chestButton');
const chestRewardDisplay = document.getElementById('chestRewardDisplay');
export const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScore = document.getElementById('finalScore');
const finalLevel = document.getElementById('finalLevel');
const finalTime = document.getElementById('finalTime');
const titleDiv = document.getElementById('title');
const docTitle = document.querySelector('title');

const confirmOverlay = document.getElementById('confirmOverlay');
const confirmText = document.getElementById('confirmText');
const btnConfirmYes = document.getElementById('btnConfirmYes');
const btnConfirmNo = document.getElementById('btnConfirmNo');

// --- FUNKCJE POMOCNICZE ---

/**
 * Formatuje czas na "Xm Ys"
 */
function formatTime(totalSeconds) {
    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}


// --- GŁÓWNA FUNKCJA AKTUALIZACJI UI ---

export function updateUI(game, player, settings, weapons) {
    // Statystyki na górze
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('xp').textContent = game.xp;
    document.getElementById('xpNeeded').textContent = game.xpNeeded;
    document.getElementById('health').textContent = Math.max(0, Math.floor(game.health));
    document.getElementById('time').textContent = formatTime(Math.floor(game.time));

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

// --- ZARZĄDZANIE STANEM GRY (MENU, PAUZA, RESET) ---

export function showMenu(game, resetAll, uiData, allowContinue = false) {
    if (!allowContinue) {
        resetAll(uiData.canvas, uiData.settings, uiData.perkLevels);
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
    
    displayScores('scoresBodyMenu');
    attachClearScoresListeners();
}

export function startRun(game, resetAll, uiData) {
    resetAll(uiData.canvas, uiData.settings, uiData.perkLevels);
    uiData.savedGameState = null;
    menuOverlay.style.display = 'none';
    game.inMenu = false;
    game.paused = false;
    game.running = true;

    uiData.startTime = performance.now();
    uiData.lastTime = uiData.startTime;

    uiData.settings.lastElite = 0;

    initAudio();

    if (uiData.animationFrameId === null) {
        uiData.animationFrameId = requestAnimationFrame(uiData.loopCallback);
    }
}

// POPRAWKA v0.65: Używa stałych z gameData.js
export function resetAll(canvas, settings, perkLevels, uiData) {
    if (uiData.animationFrameId !== null) {
        cancelAnimationFrame(uiData.animationFrameId);
        uiData.animationFrameId = null;
    }

    uiData.lastTime = 0;
    uiData.startTime = 0;

    const game = uiData.game; 
    
    if (devSettings.presetLoaded === false) {
        console.log("ResetAll: Wykonuję pełny reset statystyk.");
        // POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG i GAME_CONFIG
        game.score = 0; game.level = 1; game.health = PLAYER_CONFIG.INITIAL_HEALTH; game.maxHealth = PLAYER_CONFIG.INITIAL_HEALTH; game.time = 0;
        game.xp = 0; game.xpNeeded = GAME_CONFIG.INITIAL_XP_NEEDED; game.pickupRange = PLAYER_CONFIG.INITIAL_PICKUP_RANGE;
        
        Object.assign(settings, { 
            spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
            maxEnemies: GAME_CONFIG.MAX_ENEMIES,
            eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL
        });
        settings.lastFire = 0;
        settings.lastElite = 0;

        uiData.player.reset(canvas.width, canvas.height);
        
        for (let key in perkLevels) {
            delete perkLevels[key];
        }
    } else {
        console.log("ResetAll: Pomijam reset statystyk (załadowano preset).");
        game.time = 0;
        settings.lastFire = 0;
        settings.lastElite = 0;
        devSettings.presetLoaded = false;
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
}

export function pauseGame(game, settings, weapons, player) {
    if (game.paused || game.inMenu) return;
    game.manualPause = true;
    game.paused = true;
    // POPRAWKA v0.62e: Przekaż 'player' zamiast 'weapons' (zgodnie z v0.54)
    updateStatsUI(game, player, settings, null, statsDisplayPause);
    pauseOverlay.style.display = 'flex';
}

// POPRAWKA v0.65: Używa stałej z UI_CONFIG
export function resumeGame(game, timerDuration = UI_CONFIG.RESUME_TIMER) {
    game.manualPause = false;
    pauseOverlay.style.display = 'none';
    levelUpOverlay.style.display = 'none'; 

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
    
    saveScore(currentRun);
    
    displayScores('scoresBodyGameOver', currentRun); 
    attachClearScoresListeners();
    
    gameOverOverlay.style.display = 'flex';
}

// --- OBSŁUGA PERKÓW I NAGRÓD ---

/**
 * POPRAWKA v0.65: Używa stałych z GAME_CONFIG do obliczania XP.
 */
export function levelUp(game, player, hitTextPool, particlePool, settings, weapons, perkLevels) {
    console.log(`--- LEVEL UP (Poziom ${game.level + 1}) ---`);
    
    game.xp -= game.xpNeeded;
    game.level += 1;
    
    // 'hitTexts' (przekazane jako hitTextPool.activeItems) jest potrzebne do logiki łączenia
    const hitTexts = hitTextPool.activeItems; 

    if (game.health < game.maxHealth) {
        const healedAmount = game.maxHealth - game.health;
        game.health = game.maxHealth;
        addHitText(hitTextPool, hitTexts, player.x, player.y - 20, -healedAmount, '#4caf50', 'Odnowione Życie');
        playSound('LevelUp');
    }

    game.shield = true;
    game.shieldT = 3;
    addHitText(hitTextPool, hitTexts, player.x, player.y - 35, 0, '#90CAF9', 'Tarcza +3s');

    // POPRAWKA v0.65: Użyj wartości z GAME_CONFIG
    game.xpNeeded = Math.floor(game.xpNeeded * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;
    
    // POPRAWKA v0.62e: Najpierw stwórz konfetti
    spawnConfetti(particlePool, player.x, player.y);

    console.log('[levelUp] Uruchamiam setTimeout do pokazania perków...');

    // POPRAWKA v0.65: Użyj wartości z UI_CONFIG
    setTimeout(() => {
        console.log('[levelUp] setTimeout wykonany. Pauzuję grę i pokazuję perki.');
        
        game.paused = true; // Zapauzuj grę DOPIERO TERAZ
        
        if (game.running && !game.inMenu) {
            levelUpOverlay.style.display = 'flex';
            updateStatsUI(game, player, settings, weapons, statsDisplay);
            showPerks(perkLevels); 

        } else {
            console.warn('[levelUp] Warunki NIESPEŁNIONE (gra nierozpoczęta lub w menu). Nie pokazano perków.');
        }
    }, UI_CONFIG.LEVEL_UP_PAUSE); // Czekaj na czas z konfiguracji
}

// POPRAWKA v0.65: Używa stałych z WEAPON_CONFIG i PERK_CONFIG
export function updateStatsUI(game, player, settings, weapons, targetElement = statsDisplay) {
    targetElement.innerHTML = '';
    
    const autoGun = player.getWeapon(AutoGun);
    const orbital = player.getWeapon(OrbitalWeapon);
    const nova = player.getWeapon(NovaWeapon);

    // POPRAWKA v0.65: Użyj wartości z WEAPON_CONFIG jako fallback i PERK_CONFIG dla max
    const stats = [
        { icon: '⭐', label: 'Poziom', value: game.level },
        { icon: '❤️', label: 'Zdrowie', value: `${Math.floor(game.health)}/${game.maxHealth}` },
        { icon: '🏃', label: 'Prędkość gracza', value: player.speed.toFixed(2) },
        
        { icon: '💥', label: 'Obrażenia', value: `${autoGun ? autoGun.bulletDamage.toFixed(0) : WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE} / ${PERK_CONFIG.damage.max + 1}` },
        { icon: '🔫', label: 'Szybkostrzelność', value: `${autoGun ? (1000 / autoGun.fireRate).toFixed(2) : (1000 / WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE).toFixed(2)}/s` },
        { icon: '🎯', label: 'Multishot', value: `${autoGun ? autoGun.multishot : '0'} / ${PERK_CONFIG.multishot.max}` },
        { icon: '➡️', label: 'Przebicie', value: `${autoGun ? autoGun.pierce : '0'} / ${PERK_CONFIG.pierce.max}` },
        { icon: '🌀', label: 'Orbital', value: `${orbital ? orbital.level : '0'} / ${PERK_CONFIG.orbital.max}` },
        { icon: '💫', label: 'Nova', value: `${nova ? nova.level : '0'} / ${PERK_CONFIG.nova.max}` }
    ];
    
    stats.forEach(s => {
        const el = document.createElement('div');
        el.className = 'stat-item';
        el.innerHTML = `
        <div class="stat-item-icon">${s.icon}</div>
        <div class="stat-item-content">
          <div class="stat-item-label">${s.label}</div>
          <div class="stat-item-value">${s.value}</div>
        </div>
      `;
        targetElement.appendChild(el);
    });
}

export function showPerks(perkLevels) {
    console.log('[showPerks] Rozpoczynam. Filtruję dostępne perki...');
    console.log('[showPerks] Otrzymane perkLevels:', JSON.parse(JSON.stringify(perkLevels)));

    // POPRAWKA v0.65: Filtr używa teraz 'perk.max' (który jest pobierany z PERK_CONFIG w perks.js)
    const avail = perkPool.filter(p => (perkLevels[p.id] || 0) < p.max);
    const picks = [];

    console.log(`[showPerks] Perki w puli: ${perkPool.length}. Perki dostępne (avail): ${avail.length}`);

    while (picks.length < 3 && avail.length > 0) {
        console.log(`[showPerks] Pętla WHILE: picks.length=${picks.length}, avail.length=${avail.length}`);
        
        const i = Math.floor(Math.random() * avail.length);
        picks.push(avail.splice(i, 1)[0]); 
    }

    console.log(`[showPerks] Zakończono pętlę. Wybrano perków: ${picks.length}`);

    perksDiv.innerHTML = '';

    if (picks.length === 0) {
        console.log('[showPerks] Nie wybrano żadnych perków (wszystkie wymaksowane?). Pokazuję przycisk Max Level.');
        btnContinueMaxLevel.style.display = 'block';
        perksDiv.innerHTML = '<p style="text-align:center; color:#aaa;">Osiągnięto maksymalny poziom wszystkich ulepszeń!</p>';
    } else {
        console.log(`[showPerks] Pokazuję ${picks.length} perków do wyboru.`);
        btnContinueMaxLevel.style.display = 'none';
        picks.forEach(perk => {
            const lvl = perkLevels[perk.id] || 0;
            const el = document.createElement('div');
            el.className = 'perk';
            const iconHTML = perk.emoji ? `<span class="picon-emoji">${perk.emoji}</span>` : `<span class="picon" style="background:${perk.color || '#999'}"></span>`;
            
            el.innerHTML = `<span class="badge">Poziom ${lvl} → ${lvl + 1}</span><h4>${iconHTML}${perk.name}</h4><p>${perk.desc}</p>`;
            
            el.onclick = () => { 
                if(window.wrappedPickPerk) window.wrappedPickPerk(perk); 
            };
            perksDiv.appendChild(el);
        });
    }
}

// POPRAWKA v0.65: Używa UI_CONFIG.RESUME_TIMER zamiast 1.5s
export function pickPerk(perk, game, perkLevels, settings, weapons, player) {
    if (!perk) {
        console.log('[pickPerk] Wybrano "Kontynuuj" (max level). Wznawiam grę.');
        resumeGame(game, 0); 
        return;
    }
    
    console.log(`[pickPerk] Wybrano perk: ${perk.id}`);
    
    // Używa perk.max (pobranego z PERK_CONFIG)
    if ((perkLevels[perk.id] || 0) >= perk.max) {
        console.warn(`[pickPerk] Próba wybrania perka (${perk.id}), który jest już na max poziomie. To nie powinno się zdarzyć.`);
        return;
    }
    
    const state = { game, settings, weapons, player }; 
    perk.apply(state, perk); 
    
    perkLevels[perk.id] = (perkLevels[perk.id] || 0) + 1;
    playSound('PerkPick');
    
    // Używa domyślnego czasu wznowienia
    resumeGame(game); 
}

export function pickChestReward(perkLevels) {
    // Używa perk.max (pobranego z PERK_CONFIG)
    const pool = perkPool.filter(p => (perkLevels[p.id] || 0) < p.max);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

export function openChest(game, perkLevels, uiData) {
    uiData.currentChestReward = pickChestReward(perkLevels);
    const reward = uiData.currentChestReward;

    if (reward) {
        const currentLevel = perkLevels[reward.id] || 0;
        // Używa reward.max (pobranego z PERK_CONFIG)
        const progress = ((currentLevel + 1) / reward.max) * 100;
        const iconHTML = reward.emoji ? `<span style="font-size:48px;">${reward.emoji}</span>` : `🎁`;

        chestRewardDisplay.innerHTML = `
        <div class="chest-reward-icon">
          ${iconHTML}
        </div>
        <div class="chest-reward-name">${reward.name}</div>
        <div class="chest-reward-desc">${reward.desc}</div>
        <div class="chest-reward-level">
          Poziom: ${currentLevel} → ${currentLevel + 1} (z ${reward.max})
        </div>
        <div class="chest-reward-level-bar">
          <div class="chest-reward-level-fill" style="width:${progress}%;"></div>
        </div>
      `;
    } else {
        chestRewardDisplay.innerHTML = `
        <div class="chest-reward-icon">😔</div>
        <div class="chest-reward-name">Skrzynia pusta</div>
        <div class="chest-reward-desc">Wszystkie ulepszenia są już wymaksowane!</div>
      `;
    }

    chestOverlay.style.display = 'flex';
    game.paused = true;
    playSound('ChestOpen');
}

// --- TABLICA WYNIKÓW ---

export function saveScore(currentRun) {
    try {
        const scores = JSON.parse(localStorage.getItem('szketalScores') || '[]');
        scores.push(currentRun);
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10);
        localStorage.setItem('szketalScores', JSON.stringify(scores));
    } catch (e) {
        console.error("BŁĄD: Nie można zapisać wyniku:", e);
    }
}

export function displayScores(targetId, highlightRun = null) {
    const scoresBody = document.getElementById(targetId);
    const scoresContainer = scoresBody ? scoresBody.closest('.scores-container') : null; 

    if (!scoresBody || !scoresContainer) {
        return;
    }

    try {
        const scores = JSON.parse(localStorage.getItem('szketalScores') || '[]');

        if (scores.length === 0) {
            scoresContainer.style.display = 'none';
            return; 
        } else {
            scoresContainer.style.display = 'block'; 
        }

        scoresBody.innerHTML = '';
        scores.forEach((s, idx) => {
            const tr = document.createElement('tr');
            
            if (highlightRun && 
                s.score === highlightRun.score && 
                s.level === highlightRun.level && 
                s.time === highlightRun.time) {
                tr.className = 'highlight-score';
                highlightRun = null; 
            }
            
            const formattedTime = formatTime(s.time);
            tr.innerHTML = `<td>${idx + 1}</td><td>${s.score}</td><td>${s.level}</td><td>${formattedTime}</td>`;
            scoresBody.appendChild(tr);
        });
    } catch (e) {
        console.error("BŁĄD: Nie można wyświetlić wyników:", e);
    }
}

function showConfirmModal(text, onConfirm) {
    if (!confirmOverlay || !confirmText || !btnConfirmYes || !btnConfirmNo) {
        console.error("BŁĄD: Brakuje elementów DOM dla modala potwierdzenia.");
        if (confirm(text)) {
            onConfirm();
        }
        return;
    }
    
    confirmText.textContent = text;
    confirmOverlay.style.display = 'flex';

    btnConfirmYes.onclick = () => {
        confirmOverlay.style.display = 'none';
        onConfirm(); 
    };
    
    btnConfirmNo.onclick = () => {
        confirmOverlay.style.display = 'none';
    };
}

function attachClearScoresListeners() {
    document.querySelectorAll('.btn-clear-scores').forEach(button => {
        button.onclick = () => {
            const clearScoresAction = () => {
                try {
                    localStorage.removeItem('szketalScores');
                    console.log("Tablica wyników wyczyszczona.");
                    displayScores('scoresBodyMenu');
                    displayScores('scoresBodyGameOver');
                } catch (e) {
                    console.error("BŁĄD: Nie można wyczyścić tablicy wyników:", e);
                    alert("Wystąpił błąd podczas czyszczenia wyników.");
                }
            };

            showConfirmModal(
                "Czy na pewno chcesz wyzerować tablicę wyników? Tej operacji nie można cofnąć.",
                clearScoresAction
            );
        };
    });
}