// ==============
// LEVELMANAGER.JS (v0.90 - Implementacja i18n)
// Lokalizacja: /js/managers/levelManager.js
// ==============

import { spawnConfetti, addHitText } from '../core/utils.js';
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG 
} from '../config/gameData.js';
import { perkPool } from '../config/perks.js';
import { playSound } from '../services/audio.js';
// NOWY IMPORT v0.90: Silnik i18n
import { getLang } from '../services/i18n.js';

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
// NOWY IMPORT v0.81b: Potrzebny do wyświetlania statystyk
import { WhipWeapon } from '../config/weapons/whipWeapon.js';
// NOWY IMPORT v0.82a
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

// Import referencji DOM potrzebnych temu modułowi
import {
    statsDisplay, levelUpOverlay, perksDiv, btnContinueMaxLevel, 
    chestRewardDisplay, chestOverlay
} from '../ui/domElements.js';

// NOWA MAPA v0.81c: Rozwiązuje stringi z perks.js aby naprawić błąd TDZ
const WEAPON_CLASS_MAP_LOCAL = {
    'AutoGun': AutoGun,
    'ChainLightning': ChainLightningWeapon // NOWA LINIA v0.82a
};

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
        // ZMIANA v0.90: Użyj i18n
        addHitText(hitTextPool, hitTexts, player.x, player.y - 20, -healedAmount, '#4caf50', getLang('ui_hp_name')); // "Sytość"
        playSound('LevelUp');
    }

    game.shield = true;
    game.shieldT = 3;
    // ZMIANA v0.90: Użyj i18n
    addHitText(hitTextPool, hitTexts, player.x, player.y - 35, 0, '#90CAF9', getLang('pickup_shield_name')); // "Tarcza LodoBoga"

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
            // POPRAWKA v0.81b: Przekaż 'player' do showPerks
            showPerks(perkLevels, player); 

        } else {
            console.warn('[levelUp] Warunki NIESPEŁNIONE (gra nierozpoczęta lub w menu). Nie pokazano perków.');
        }
    }, UI_CONFIG.LEVEL_UP_PAUSE); 
}

/**
 * Aktualizuje panel statystyk (przeniesione z ui.js).
 * POPRAWKA v0.82b: Zaktualizowano UI Pioruna dla 6 poziomów.
 * POPRAWKA v0.90: Zaimplementowano i18n dla etykiet.
 */
export function updateStatsUI(game, player, settings, weapons, targetElement = statsDisplay) {
    targetElement.innerHTML = '';
    
    const weaponList = weapons || [];
    
    // Pobierz wszystkie bronie
    const whip = weaponList.find(w => w instanceof WhipWeapon);
    const autoGun = weaponList.find(w => w instanceof AutoGun);
    const orbital = weaponList.find(w => w instanceof OrbitalWeapon);
    const nova = weaponList.find(w => w instanceof NovaWeapon);
    const chainLightning = weaponList.find(w => w instanceof ChainLightningWeapon); // NOWE

    const stats = [
        { icon: '⭐', label: getLang('ui_hud_level'), value: game.level },
        { icon: '😋', label: getLang('ui_hud_hp_text'), value: `${Math.floor(game.health)}/${game.maxHealth}` }, // ZMIANA v0.90
        { icon: '👟', label: getLang('perk_speed_name'), value: player.speed.toFixed(2) }, // v0.82a, v0.90
        
        // Statystyki Bicza (zawsze obecne)
        { icon: '🪢', label: `${getLang('perk_whip_name')} (Lvl)`, value: `${whip ? whip.level : '1'} / ${PERK_CONFIG.whip?.max || 5}` },
        { icon: '🪢', label: `${getLang('perk_whip_name')} (Dmg)`, value: `${whip ? whip.damage : '1'}` },
        { icon: '🪢', label: `${getLang('perk_whip_name')} (Count)`, value: `${whip ? whip.count : '1'}` },
        
        // Statystyki Orbitala (jeśli istnieje)
        { icon: '🌀', label: getLang('perk_orbital_name'), value: `${orbital ? orbital.level : '0'} / ${PERK_CONFIG.orbital?.max || 5}` },
        // Statystyki Novy (jeśli istnieje)
        { icon: '💫', label: getLang('perk_nova_name'), value: `${nova ? nova.level : '0'} / ${PERK_CONFIG.nova?.max || 5}` },
        
        // NOWE Statystyki Pioruna (jeśli istnieje)
        ...(chainLightning ? [
            // POPRAWKA v0.82b: Użyj PERK_CONFIG do odczytania max 6
            { icon: '⚡', label: `${getLang('perk_chainLightning_name')} (Lvl)`, value: `${chainLightning.level} / ${PERK_CONFIG.chainLightning?.max || 6}` },
            { icon: '⚡', label: `${getLang('perk_chainLightning_name')} (Dmg)`, value: `${chainLightning.damage}` },
            { icon: '⚡', label: `${getLang('perk_chainLightning_name')} (Targets)`, value: `${chainLightning.targets}` },
        ] : []),

        // Statystyki AutoGuna (tylko jeśli istnieje)
        ...(autoGun ? [
            { icon: '🔫', label: getLang('perk_autogun_name'), value: `Level ${autoGun.level}` },
            { icon: '💥', label: `${getLang('perk_damage_name')}`, value: `${autoGun.bulletDamage.toFixed(0)} / ${ (PERK_CONFIG.damage?.max || 6) + (WEAPON_CONFIG.AUTOGUN.BASE_DAMAGE || 1)}` },
            { icon: '⏩', label: `${getLang('perk_firerate_name')}`, value: `${(1000 / autoGun.fireRate).toFixed(2)}/s` }, // Używamy ⏩ dla szybkostrzelności
            { icon: '🎯', label: `${getLang('perk_multishot_name')}`, value: `${autoGun.multishot} / ${PERK_CONFIG.multishot?.max || 4}` },
            { icon: '➡️', label: `${getLang('perk_pierce_name')}`, value: `${autoGun.pierce} / ${PERK_CONFIG.pierce?.max || 4}` }
        ] : [
            // Pokaż slot na AutoGun, jeśli go nie ma
            { icon: '🔫', label: getLang('perk_autogun_name'), value: `---` } // POPRAWKA v0.81e
        ])
    ];
    
    stats.forEach(s => {
        const el = document.createElement('div');
        el.className = 'stat-item';
        el.innerHTML = `
        <div class="stat-item-icon">${s.icon}</div>
        <div class="stat-item-content">
          <div class="stat-item-label">${s.label}</div>
          <div class.stat-item-value">${s.value}</div>
        </div>
      `;
        targetElement.appendChild(el);
    });
}

/**
 * Pokazuje perki do wyboru (przeniesione z ui.js).
 * POPRAWKA v0.81c: Dodano filtrowanie na podstawie stringów (FIX TDZ).
 */
export function showPerks(perkLevels, player) {
    console.log('[DEBUG-SHOWPERKS-01] Rozpoczynam showPerks.');
    
    // NOWA LOGIKA FILTROWANIA v0.81c
    const avail = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        
        // 1. Odrzuć, jeśli perk jest na maksymalnym poziomie
        if (currentLevel >= p.max) {
            return false;
        }
        
        // 2. Odrzuć, jeśli perk wymaga broni, której gracz nie ma
        if (p.requiresWeapon) { // p.requiresWeapon to string (np. 'AutoGun')
            const WeaponClass = WEAPON_CLASS_MAP_LOCAL[p.requiresWeapon];
            if (!WeaponClass || !player.getWeapon(WeaponClass)) {
                // console.log(`[showPerks] Ukrywam perk '${p.id}', ponieważ brakuje broni: ${p.requiresWeapon}`);
                return false;
            }
        }
        
        return true; // Perk jest dostępny
    });

    const picks = [];

    console.log(`[showPerks] Perki w puli: ${perkPool.length}. Perki dostępne (avail) po filtrowaniu: ${avail.length}`);

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
        perksDiv.innerHTML = `<p style="text-align:center; color:#aaa;">${getLang('ui_levelup_max')}</p>`; // ZMIANA v0.90
    } else {
        console.log(`[showPerks] Pokazuję ${picks.length} perków do wyboru.`);
        btnContinueMaxLevel.style.display = 'none';
        picks.forEach(perk => {
            const lvl = perkLevels[perk.id] || 0;
            const el = document.createElement('div');
            el.className = 'perk';
            const iconHTML = perk.emoji ? `<span class="picon-emoji">${perk.emoji}</span>` : `<span class="picon" style="background:${perk.color || '#999'}"></span>`;
            
            // ZMIANA v0.90: perk.name i perk.desc są już przetłumaczone (pobrane z perks.js)
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
    
    // POPRAWKA v0.81b: 'state' musi zawierać 'player', aby 'apply' mogło go odczytać
    const state = { game, settings, weapons, player }; 
    perk.apply(state, perk); 
    
    perkLevels[perk.id] = (perkLevels[perk.id] || 0) + 1;
    playSound('PerkPick');
    
    resumeGameCallback(game); 
}

/**
 * Wybiera losową nagrodę ze skrzyni (przeniesione z ui.js).
 * POPRAWKA v0.81c: Musi także filtrować perki (tak samo jak showPerks) i przyjmować 'player'.
 */
export function pickChestReward(perkLevels, player) {
    // Użyj tej samej logiki filtrowania co showPerks
    const pool = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        if (currentLevel >= p.max) return false;
        
        if (p.requiresWeapon) { // p.requiresWeapon to string
            const WeaponClass = WEAPON_CLASS_MAP_LOCAL[p.requiresWeapon];
            return !!(WeaponClass && player.getWeapon(WeaponClass));
        }
        return true;
    });
    
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Logika otwierania skrzyni (przeniesione z ui.js).
 * POPRAWKA v0.81c: Przekazuje 'player' do pickChestReward.
 * POPRAWKA v0.90: Implementuje i18n dla pustej skrzyni.
 */
export function openChest(game, perkLevels, uiData, player) { // Dodano 'player'
    uiData.currentChestReward = pickChestReward(perkLevels, player); // Przekaż 'player'
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
        // ZMIANA v0.90: Użyj i18n
        chestRewardDisplay.innerHTML = `
        <div class="chest-reward-icon">😔</div>
        <div class="chest-reward-name">${getLang('ui_chest_empty_title')}</div>
        <div class="chest-reward-desc">${getLang('ui_chest_empty_desc')}</div>
      `;
    }

    chestOverlay.style.display = 'flex';
    game.paused = true;
    playSound('ChestOpen');
}