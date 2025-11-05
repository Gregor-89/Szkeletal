// ==============
// LEVELMANAGER.JS (v0.71 - FIX: Poprawiony Import Broni)
// Lokalizacja: /js/managers/levelManager.js
// ==============

import { spawnConfetti, addHitText } from '../core/utils.js';
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG 
} from '../config/gameData.js';
import { perkPool } from '../config/perks.js';
import { playSound } from '../services/audio.js';

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';

// Import referencji DOM potrzebnych temu modułowi
import {
    statsDisplay, levelUpOverlay, perksDiv, btnContinueMaxLevel, 
    chestRewardDisplay, chestOverlay
} from '../ui/domElements.js';

/**
 * Logika zdobycia poziomu (przeniesione z ui.js).
 */
export function levelUp(game, player, hitTextPool, particlePool, settings, weapons, perkLevels) {
    console.log(`--- LEVEL UP (Poziom ${game.level + 1}) ---`);
    console.log('[DEBUG-LVLUP-01] Rozpoczęcie levelUp. Sprawdzam PERK_CONFIG:', PERK_CONFIG);
    
    game.paused = true;
    
    game.xp -= game.xpNeeded;
    game.level += 1;
    
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

    game.xpNeeded = Math.floor(game.xpNeeded * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;
    
    spawnConfetti(particlePool, player.x, player.y);

    console.log('[levelUp] Uruchamiam setTimeout do pokazania perków...');

    setTimeout(() => {
        console.log('[levelUp] setTimeout wykonany. Pokazuję perki.');
        
        if (game.running && !game.inMenu) {
            levelUpOverlay.style.display = 'flex';
            
            console.log('[DEBUG-LVLUP-02] Wywołuję updateStatsUI.');
            updateStatsUI(game, player, settings, weapons, statsDisplay);
            
            console.log('[DEBUG-LVLUP-03] Wywołuję showPerks.');
            showPerks(perkLevels); 

        } else {
            console.warn('[levelUp] Warunki NIESPEŁNIONE (gra nierozpoczęta lub w menu). Nie pokazano perków.');
        }
    }, UI_CONFIG.LEVEL_UP_PAUSE); 
}

/**
 * Aktualizuje panel statystyk (przeniesione z ui.js).
 */
export function updateStatsUI(game, player, settings, weapons, targetElement = statsDisplay) {
    targetElement.innerHTML = '';
    
    const weaponList = weapons || [];
    
    const autoGun = weaponList.find(w => w instanceof AutoGun);
    const orbital = weaponList.find(w => w instanceof OrbitalWeapon);
    const nova = weaponList.find(w => w instanceof NovaWeapon);

    const stats = [
        { icon: '⭐', label: 'Poziom', value: game.level },
        { icon: '❤️', label: 'Zdrowie', value: `${Math.floor(game.health)}/${game.maxHealth}` },
        { icon: '🏃', label: 'Prędkość gracza', value: player.speed.toFixed(2) },
        
        { icon: '💥', label: 'Obrażenia', value: `${autoGun ? autoGun.bulletDamage.toFixed(0) : WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE} / ${ (PERK_CONFIG.damage?.max || 6) + 1}` },
        { icon: '🔫', label: 'Szybkostrzelność', value: `${autoGun ? (1000 / autoGun.fireRate).toFixed(2) : (1000 / WEAPON_CONFIG.AUTOGUN.BASE_FIRE_RATE).toFixed(2)}/s` },
        { icon: '🎯', label: 'Multishot', value: `${autoGun ? autoGun.multishot : '0'} / ${PERK_CONFIG.multishot?.max || 4}` },
        { icon: '➡️', label: 'Przebicie', value: `${autoGun ? autoGun.pierce : '0'} / ${PERK_CONFIG.pierce?.max || 4}` },
        { icon: '🌀', label: 'Orbital', value: `${orbital ? orbital.level : '0'} / ${PERK_CONFIG.orbital?.max || 5}` },
        { icon: '💫', label: 'Nova', value: `${nova ? nova.level : '0'} / ${PERK_CONFIG.nova?.max || 5}` }
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

/**
 * Pokazuje perki do wyboru (przeniesione z ui.js).
 */
export function showPerks(perkLevels) {
    console.log('[DEBUG-SHOWPERKS-01] Rozpoczynam showPerks.');
    
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
            
            el.innerHTML = `<span class="badge">Poziom ${lvl} » ${lvl + 1}</span><h4>${iconHTML}${perk.name}</h4><p>${perk.desc}</p>`;
            
            el.onclick = () => { 
                if(window.wrappedPickPerk) window.wrappedPickPerk(perk); 
            };
            perksDiv.appendChild(el);
        });
    }
}

/**
 * Logika wyboru perku (przeniesione z ui.js).
 */
export function pickPerk(perk, game, perkLevels, settings, weapons, player, resumeGameCallback) {
    if (!perk) {
        console.log('[pickPerk] Wybrano "Kontynuuj" (max level). Wznawiam grę.');
        resumeGameCallback(game, 0); 
        return;
    }
    
    console.log(`[pickPerk] Wybrano perk: ${perk.id}`);
    
    if ((perkLevels[perk.id] || 0) >= perk.max) {
        console.warn(`[pickPerk] Próba wybrania perka (${perk.id}), który jest już na max poziomie. To nie powinno się zdarzyć.`);
        return;
    }
    
    const state = { game, settings, weapons, player }; 
    perk.apply(state, perk); 
    
    perkLevels[perk.id] = (perkLevels[perk.id] || 0) + 1;
    playSound('PerkPick');
    
    resumeGameCallback(game); 
}

/**
 * Wybiera losową nagrodę ze skrzyni (przeniesione z ui.js).
 */
export function pickChestReward(perkLevels) {
    const pool = perkPool.filter(p => (perkLevels[p.id] || 0) < p.max);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Logika otwierania skrzyni (przeniesione z ui.js).
 */
export function openChest(game, perkLevels, uiData) {
    uiData.currentChestReward = pickChestReward(perkLevels);
    const reward = uiData.currentChestReward;

    if (reward) {
        const currentLevel = perkLevels[reward.id] || 0;
        const progress = ((currentLevel + 1) / reward.max) * 100;
        const iconHTML = reward.emoji ? `<span style="font-size:48px;">${reward.emoji}</span>` : `🎁`;

        chestRewardDisplay.innerHTML = `
        <div class="chest-reward-icon">
          ${iconHTML}
        </div>
        <div class="chest-reward-name">${reward.name}</div>
        <div class="chest-reward-desc">${reward.desc}</div>
        <div class="chest-reward-level">
          Poziom: ${currentLevel} » ${currentLevel + 1} (z ${reward.max})
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