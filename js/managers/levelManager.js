// ==============
// LEVELMANAGER.JS (v0.94 - FIX: Restore Graphics & Audio)
// Lokalizacja: /js/managers/levelManager.js
// ==============

import { spawnConfetti, addHitText } from '../core/utils.js';
import { 
    GAME_CONFIG, WEAPON_CONFIG, PLAYER_CONFIG, PERK_CONFIG, UI_CONFIG 
} from '../config/gameData.js';
import { perkPool } from '../config/perks.js';
import { playSound } from '../services/audio.js';
import { getLang } from '../services/i18n.js';
import { get as getAsset } from '../services/assets.js';
import { pauseGame, resumeGame } from '../ui/ui.js'; // FIX: Import funkcji pauzy

// Importy Broni (potrzebne do sprawdzania wymagań)
import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js';
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

import {
    statsDisplay, levelUpOverlay, perksDiv, btnContinueMaxLevel, 
    chestRewardDisplay, chestOverlay
} from '../ui/domElements.js';

// Mapa klas broni (lokalna)
const WEAPON_CLASS_MAP_LOCAL = {
    'AutoGun': AutoGun,
    'ChainLightning': ChainLightningWeapon
};

export function checkLevelUp(game, player, settings, weapons, state) {
    if (game.xp >= game.xpNeeded) {
        levelUp(game, player, state.hitTextPool, state.particlePool, settings, weapons, state.perkLevels);
    }
}

export function levelUp(game, player, hitTextPool, particlePool, settings, weapons, perkLevels) {
    console.log(`--- LEVEL UP (Poziom ${game.level + 1}) ---`);
    
    // 1. Obsługa mechaniczna
    game.xp -= game.xpNeeded;
    game.level += 1;
    game.xpNeeded = Math.floor(game.xpNeeded * GAME_CONFIG.XP_GROWTH_FACTOR) + GAME_CONFIG.XP_GROWTH_ADD;

    // 2. Efekty (Leczenie, Tarcza)
    const hitTexts = hitTextPool.activeItems; 

    if (game.health < game.maxHealth) {
        const healedAmount = game.maxHealth - game.health;
        game.health = game.maxHealth;
        addHitText(hitTextPool, hitTexts, player.x, player.y - 20, -healedAmount, '#4caf50', getLang('ui_hp_name')); 
    }

    // FIX: Dźwięk Level Up
    playSound('LevelUp');

    game.shield = true;
    game.shieldT = 3;
    addHitText(hitTextPool, hitTexts, player.x, player.y - 35, 0, '#90CAF9', getLang('pickup_shield_name')); 
    
    spawnConfetti(particlePool, player.x, player.y);

    // 3. Pauza i UI (z małym opóźnieniem dla efektu)
    setTimeout(() => {
        if (game.running && !game.inMenu) {
            // FIX: Używamy pauseGame z ui.js aby obsłużyć to spójnie
            pauseGame(game, settings, weapons, player);
            
            // Ukrywamy standardowy overlay pauzy, bo chcemy LevelUpOverlay
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay) pauseOverlay.style.display = 'none';

            levelUpOverlay.style.display = 'flex';
            
            // Aktualizacja statystyk w oknie LevelUp
            updateStatsUI(game, player, settings, weapons, statsDisplay);
            
            // Generowanie kart perków (zwracamy uwagę na 'showPerks' z v0.93)
            showPerks(perkLevels, player, game, settings, weapons); 
        }
    }, UI_CONFIG.LEVEL_UP_PAUSE); 
}

// FIX: Funkcja z v0.93 do aktualizacji statystyk (nie zmieniałem logiki, tylko formatowanie)
export function updateStatsUI(game, player, settings, weapons, targetElement = statsDisplay) {
    if (!targetElement) return;
    targetElement.innerHTML = '';
    
    const weaponList = weapons || [];
    
    const whip = weaponList.find(w => w instanceof WhipWeapon);
    const autoGun = weaponList.find(w => w instanceof AutoGun);
    const orbital = weaponList.find(w => w instanceof OrbitalWeapon);
    const nova = weaponList.find(w => w instanceof NovaWeapon);
    const chainLightning = weaponList.find(w => w instanceof ChainLightningWeapon);

    const getIcon = (assetKey, fallbackEmoji) => {
        const asset = getAsset(assetKey);
        return asset 
            ? `<img src="${asset.src}" class="stat-icon-img">` 
            : fallbackEmoji;
    };

    // Ikony
    const iconLevel = getIcon('icon_level', '⭐');
    const iconHealth = getIcon('icon_health', '😋');
    const iconSpeed = getIcon('icon_speed', '👟');
    const iconPickup = getIcon('icon_pickup_range', '🧲');
    const iconWhip = getIcon('icon_whip', '🪢');
    const iconOrbital = getIcon('icon_orbital', '🌀');
    const iconNova = getIcon('icon_nova', '💫');
    const iconLightning = getIcon('icon_lightning', '⚡');
    const iconAutoGun = getIcon('icon_autogun', '🔫');
    const iconDamage = getIcon('icon_damage', '💥');
    const iconFirerate = getIcon('icon_firerate', '⏩');
    // const iconMultishot = getIcon('icon_multishot', '🎯'); // Nieużywane w tym widoku
    // const iconPierce = getIcon('icon_pierce', '➡️'); // Nieużywane w tym widoku

    // FIX: Bezpieczne pobieranie pickupRange
    const pickupVal = (game.pickupRange || PLAYER_CONFIG.INITIAL_PICKUP_RANGE).toFixed(0);

    const stats = [
        { icon: iconLevel, label: getLang('ui_hud_level'), value: game.level },
        { icon: iconHealth, label: getLang('ui_hud_hp_name'), value: `${Math.floor(game.health)}/${game.maxHealth}` },
        { icon: iconSpeed, label: getLang('perk_speed_name'), value: player.speedMultiplier.toFixed(2) + 'x' }, 
        { icon: iconPickup, label: getLang('perk_pickup_name'), value: pickupVal },
        
        { icon: iconWhip, label: `${getLang('perk_whip_name')} (Lvl)`, value: `${whip ? whip.level : '1'} / ${PERK_CONFIG.whip?.max || 5}` },
        { icon: iconWhip, label: `${getLang('perk_whip_name')} (Dmg)`, value: `${whip ? whip.damage : '1'}` },
        
        { icon: iconOrbital, label: getLang('perk_orbital_name'), value: `${orbital ? orbital.level : '0'} / ${PERK_CONFIG.orbital?.max || 5}` },
        { icon: iconNova, label: getLang('perk_nova_name'), value: `${nova ? nova.level : '0'} / ${PERK_CONFIG.nova?.max || 5}` },
        
        ...(chainLightning ? [
            { icon: iconLightning, label: `${getLang('perk_chainLightning_name')} (Lvl)`, value: `${chainLightning.level} / ${PERK_CONFIG.chainLightning?.max || 6}` },
        ] : []),

        ...(autoGun ? [
            { icon: iconAutoGun, label: getLang('perk_autogun_name'), value: `Level ${autoGun.level}` },
            { icon: iconDamage, label: `${getLang('perk_damage_name')}`, value: `${autoGun.bulletDamage.toFixed(0)}` },
            { icon: iconFirerate, label: `${getLang('perk_firerate_name')}`, value: `${(1000 / autoGun.fireRate).toFixed(2)}/s` },
        ] : [
            { icon: iconAutoGun, label: getLang('perk_autogun_name'), value: `---` }
        ])
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

// FIX: Przywrócona funkcja showPerks z v0.93 (obsługa grafik)
export function showPerks(perkLevels, player, game, settings, weapons) {
    // Filtrowanie
    const avail = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        if (currentLevel >= p.max) return false;
        if (p.requiresWeapon) { 
            const WeaponClass = WEAPON_CLASS_MAP_LOCAL[p.requiresWeapon];
            if (!WeaponClass || !player.getWeapon(WeaponClass)) return false;
        }
        return true; 
    });

    // Losowanie
    const picks = [];
    while (picks.length < 3 && avail.length > 0) {
        const i = Math.floor(Math.random() * avail.length);
        picks.push(avail.splice(i, 1)[0]); 
    }

    // Renderowanie
    perksDiv.innerHTML = ''; // FIX: Używamy perksDiv (element z domElements.js)

    if (picks.length === 0) {
        btnContinueMaxLevel.style.display = 'block';
        perksDiv.innerHTML = `<p style="text-align:center; color:#aaa;">${getLang('ui_levelup_max')}</p>`;
        
        // Obsługa przycisku kontynuacji
        btnContinueMaxLevel.onclick = () => {
             levelUpOverlay.style.display = 'none';
             resumeGame(game, 0);
        };

    } else {
        btnContinueMaxLevel.style.display = 'none';
        picks.forEach(perk => {
            const lvl = perkLevels[perk.id] || 0;
            const el = document.createElement('div');
            
            let imgAsset = null;
            if (perk.icon) {
                imgAsset = getAsset(perk.icon);
            }

            // Styl v0.93 - Perk Graphic
            if (imgAsset) {
                el.className = 'perk perk-graphic';
                el.innerHTML = `
                    <div class="perk-img-wrapper">
                        <img src="${imgAsset.src}" alt="${perk.name}">
                    </div>
                    <div class="perk-info">
                        <span class="badge">Poziom ${lvl} » ${lvl + 1}</span>
                        <h4>${getLang(perk.name)}</h4>
                        <p>${getLang(perk.desc)}</p>
                    </div>
                `;
            } else {
                el.className = 'perk';
                const iconHTML = perk.emoji ? `<span class="picon-emoji">${perk.emoji}</span>` : `<span class="picon" style="background:${perk.color || '#999'}"></span>`;
                el.innerHTML = `<span class="badge">Poziom ${lvl} » ${lvl + 1}</span><h4>${iconHTML}${getLang(perk.name)}</h4><p>${getLang(perk.desc)}</p>`;
            }
            
            el.onclick = () => { 
                pickPerk(perk, game, perkLevels, settings, weapons, player, (g, t) => {
                    levelUpOverlay.style.display = 'none';
                    resumeGame(g, t !== undefined ? t : 0);
                });
            };
            perksDiv.appendChild(el);
        });
    }
}

export function pickPerk(perk, game, perkLevels, settings, weapons, player, resumeCallback) {
    if (!perk) {
        resumeCallback(game, 0); 
        return;
    }
    
    if ((perkLevels[perk.id] || 0) >= perk.max) {
        return;
    }
    
    // Aplikuj efekt
    const state = { game, settings, weapons, player, perkLevels }; 
    if (perk.apply) {
        perk.apply(state, perk); 
    }
    
    perkLevels[perk.id] = (perkLevels[perk.id] || 0) + 1;
    playSound('PerkPick');
    
    resumeCallback(game); 
}

export function pickChestReward(perkLevels, player) {
    const pool = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        if (currentLevel >= p.max) return false;
        
        if (p.requiresWeapon) {
            const WeaponClass = WEAPON_CLASS_MAP_LOCAL[p.requiresWeapon];
            return !!(WeaponClass && player.getWeapon(WeaponClass));
        }
        return true;
    });
    
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

export function openChest(game, perkLevels, uiData, player) {
    uiData.currentChestReward = pickChestReward(perkLevels, player); 
    const reward = uiData.currentChestReward;

    if (reward) {
        const currentLevel = perkLevels[reward.id] || 0;
        const progress = ((currentLevel + 1) / reward.max) * 100;
        
        let iconHTML = '';
        if (reward.icon) {
            const asset = getAsset(reward.icon);
            if (asset) {
                iconHTML = `<img src="${asset.src}" class="chest-reward-img" alt="${reward.name}">`;
            }
        }
        if (!iconHTML) {
            iconHTML = `<div class="chest-reward-icon">${reward.emoji || '🎁'}</div>`;
        }

        chestRewardDisplay.innerHTML = `
        ${iconHTML}
        <div class="chest-reward-name">${getLang(reward.name)}</div>
        <div class="chest-reward-desc">${getLang(reward.desc)}</div>
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
        <div class="chest-reward-name">${getLang('ui_chest_empty_title')}</div>
        <div class="chest-reward-desc">${getLang('ui_chest_empty_desc')}</div>
      `;
    }

    chestOverlay.style.display = 'flex';
    game.paused = true;
    playSound('ChestOpen');
}