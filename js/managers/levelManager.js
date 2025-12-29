// ==============
// LEVELMANAGER.JS (v1.15 - Full Restore & Stats Fix)
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
import { pauseGame, resumeGame } from '../ui/ui.js'; 

import { AutoGun } from '../config/weapons/autoGun.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { NovaWeapon } from '../config/weapons/novaWeapon.js';
import { WhipWeapon } from '../config/weapons/whipWeapon.js';
import { ChainLightningWeapon } from '../config/weapons/chainLightningWeapon.js';

import {
    statsDisplay, levelUpOverlay, perksDiv, btnContinueMaxLevel, 
    chestRewardDisplay, chestOverlay
} from '../ui/domElements.js';

const WEAPON_CLASS_MAP_LOCAL = {
    'AutoGun': AutoGun,
    'ChainLightning': ChainLightningWeapon,
    'OrbitalWeapon': OrbitalWeapon,
    'NovaWeapon': NovaWeapon,
    'WhipWeapon': WhipWeapon
};

export function checkLevelUp(game, player, settings, weapons, state) {
    if (game.xp >= game.xpNeeded) {
        levelUp(game, player, state.hitTextPool, state.particlePool, settings, weapons, state.perkLevels);
    }
}

export function levelUp(game, player, hitTextPool, particlePool, settings, weapons, perkLevels) {
    console.log(`--- LEVEL UP (Poziom ${game.level + 1}) ---`);
    
    game.xp -= game.xpNeeded;
    game.level += 1;
    
    let growthFactor = GAME_CONFIG.XP_GROWTH_LATE; 
    if (game.level <= GAME_CONFIG.XP_THRESHOLD_LEVEL) {
        growthFactor = GAME_CONFIG.XP_GROWTH_EARLY;
    }
    
    game.xpNeeded = Math.floor(game.xpNeeded * growthFactor) + GAME_CONFIG.XP_GROWTH_ADD;

    const hitTexts = hitTextPool.activeItems; 

    if (game.health < game.maxHealth) {
        const healedAmount = game.maxHealth - game.health;
        game.health = game.maxHealth;
        addHitText(hitTextPool, hitTexts, player.x, player.y - 20, -healedAmount, '#4caf50', getLang('ui_hp_name')); 
    }

    playSound('LevelUp');

    game.shield = true;
    game.shieldT = 3;
    addHitText(hitTextPool, hitTexts, player.x, player.y - 35, 0, '#90CAF9', getLang('pickup_shield_name')); 
    
    spawnConfetti(particlePool, player.x, player.y);

    setTimeout(() => {
        if (game.running && !game.inMenu) {
            pauseGame(game, settings, weapons, player);
            const pauseOverlay = document.getElementById('pauseOverlay');
            if (pauseOverlay) pauseOverlay.style.display = 'none';
            levelUpOverlay.style.display = 'flex';
            
            updateStatsUI(game, player, settings, weapons, statsDisplay);
            showPerks(perkLevels, player, game, settings, weapons); 
        }
    }, UI_CONFIG.LEVEL_UP_PAUSE); 
}

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
        return asset ? `<img src="${asset.src}" class="stat-icon-img">` : fallbackEmoji;
    };

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
    const iconMultishot = getIcon('icon_multishot', '🎯');
    const iconPierce = getIcon('icon_pierce', '➡️');

    const pickupVal = (game.pickupRange || PLAYER_CONFIG.INITIAL_PICKUP_RANGE).toFixed(0);

    const stats = [
        { icon: iconLevel, label: getLang('ui_hud_level'), value: game.level },
        { icon: iconHealth, label: getLang('ui_hud_hp_name'), value: `${Math.floor(game.health)}/${game.maxHealth}` },
        { icon: iconSpeed, label: getLang('perk_speed_name'), value: player.speedMultiplier.toFixed(2) + 'x' }, 
        { icon: iconPickup, label: getLang('perk_pickup_name'), value: pickupVal },
        
        { icon: iconWhip, label: `${getLang('perk_whip_name')} (Lvl)`, value: `${whip ? whip.level : '1'} / ${PERK_CONFIG.whip?.max || 5}` },
        { icon: iconWhip, label: `${getLang('perk_whip_name')} (Dmg)`, value: `${whip ? (whip.damage || 0).toFixed(1) : '1'}` },
        
        { icon: iconOrbital, label: getLang('perk_orbital_name'), value: `${orbital ? orbital.level : '0'} / ${PERK_CONFIG.orbital?.max || 5}` },
        { icon: iconNova, label: getLang('perk_nova_name'), value: `${nova ? nova.level : '0'} / ${PERK_CONFIG.nova?.max || 5}` },
        
        ...(chainLightning ? [{ icon: iconLightning, label: `${getLang('perk_chainLightning_name')} (Lvl)`, value: `${chainLightning.level} / ${PERK_CONFIG.chainLightning?.max || 6}` }] : []),

        ...(autoGun ? [
            { icon: iconAutoGun, label: getLang('perk_autogun_name'), value: `ZAINSTALOWANY` },
            { icon: iconDamage, label: `${getLang('perk_damage_name')}`, value: `${autoGun.bulletDamage.toFixed(0)}` },
            { icon: iconFirerate, label: `${getLang('perk_firerate_name')}`, value: `${(1000 / autoGun.fireRate).toFixed(2)}/s` },
            // NOWOŚĆ: Dodanie brakujących statystyk
            { icon: iconMultishot, label: `Multishot`, value: `+${autoGun.multishot}` },
            { icon: iconPierce, label: `Przebicie`, value: `${autoGun.pierce} cel(i)` }
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
        </div>`;
        targetElement.appendChild(el);
    });

    const perkList = document.createElement('div');
    perkList.style.gridColumn = '1 / -1'; perkList.style.marginTop = '10px'; perkList.style.borderTop = '1px solid #444'; perkList.style.paddingTop = '10px';
    perkPool.forEach(perk => {
        const lvl = (player.perkLevels && player.perkLevels[perk.id]) || 0;
        if (lvl > 0) {
            const row = document.createElement('div');
            row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.fontSize = '0.9rem'; row.style.color = perk.color || '#fff';
            row.innerHTML = `<span>${perk.emoji || ''} ${getLang(perk.name)}</span> <span>POZ. ${lvl}</span>`;
            perkList.appendChild(row);
        }
    });
    if (perkList.children.length > 0) targetElement.appendChild(perkList);
}

function getDynamicDesc(perk, currentLvl) {
    let desc = getLang(perk.desc) || "";
    if (!desc.includes('{val}')) return desc;
    let displayVal = perk.value || "";
    if (perk.formatVal) displayVal = perk.formatVal(currentLvl);
    return desc.replace('{val}', displayVal);
}

export function showPerks(perkLevels, player, game, settings, weapons) {
    const avail = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        if (p.max !== undefined && currentLevel >= p.max) return false;
        if (p.requiresWeapon) { 
            const hasWeapon = player.weapons.some(w => w.constructor.name === p.requiresWeapon);
            if (!hasWeapon) return false;
        }
        return true; 
    });

    const picks = [];
    while (picks.length < 3 && avail.length > 0) {
        const i = Math.floor(Math.random() * avail.length);
        picks.push(avail.splice(i, 1)[0]); 
    }

    if (perksDiv) perksDiv.innerHTML = ''; 

    if (picks.length === 0) {
        btnContinueMaxLevel.style.display = 'block';
        perksDiv.innerHTML = `<p style="text-align:center; color:#aaa;">${getLang('ui_levelup_max')}</p>`;
        btnContinueMaxLevel.onclick = () => { levelUpOverlay.style.display = 'none'; resumeGame(game, 0); };
    } else {
        if (btnContinueMaxLevel) btnContinueMaxLevel.style.display = 'none';
        picks.forEach(perk => {
            const lvl = perkLevels[perk.id] || 0;
            const el = document.createElement('div');
            const dynamicDesc = getDynamicDesc(perk, lvl);
            let imgAsset = perk.icon ? getAsset(perk.icon) : null;

            if (imgAsset) {
                el.className = 'perk perk-graphic';
                el.innerHTML = `
                    <div class="perk-img-wrapper"><img src="${imgAsset.src}" alt="${perk.name}"></div>
                    <div class="perk-info">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                           <h4>${getLang(perk.name)}</h4>
                           <span class="badge">${lvl} » ${lvl + 1}</span>
                        </div>
                        <p>${dynamicDesc}</p>
                    </div>`;
            } else {
                el.className = 'perk';
                const iconHTML = perk.emoji ? `<span class="picon-emoji">${perk.emoji}</span>` : `<span class="picon" style="background:${perk.color || '#999'}"></span>`;
                el.innerHTML = `
                   <div class="perk-info">
                       <div style="display:flex; justify-content:space-between; align-items:center;">
                           <h4>${iconHTML}${getLang(perk.name)}</h4>
                           <span class="badge">${lvl} » ${lvl + 1}</span>
                       </div>
                       <p>${dynamicDesc}</p>
                   </div>`;
            }
            el.onclick = () => { 
                pickPerk(perk, game, perkLevels, settings, weapons, player, (g, t) => {
                    levelUpOverlay.style.display = 'none';
                    resumeGame(g, t !== undefined ? t : 0);
                });
            };
            if (perksDiv) perksDiv.appendChild(el);
        });
    }
}

export function pickPerk(perk, game, perkLevels, settings, weapons, player, resumeCallback) {
    if (!perk) { resumeCallback(game, 0); return; }
    if (perk.max !== undefined && (perkLevels[perk.id] || 0) >= perk.max) return;
    
    const state = { game, settings, weapons, player, perkLevels }; 
    if (perk.apply) perk.apply(state, perk); 
    
    perkLevels[perk.id] = (perkLevels[perk.id] || 0) + 1;
    playSound('PerkPick');
    resumeCallback(game); 
}

export function pickChestReward(perkLevels, player) {
    const pool = perkPool.filter(p => {
        const currentLevel = perkLevels[p.id] || 0;
        if (p.max !== undefined && currentLevel >= p.max) return false;
        if (p.requiresWeapon) return player.weapons.some(w => w.constructor.name === p.requiresWeapon);
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
        const progress = ((currentLevel + 1) / (reward.max || 10)) * 100;
        const dynamicDesc = getDynamicDesc(reward, currentLevel);
        let iconHTML = reward.icon ? `<img src="${getAsset(reward.icon).src}" class="chest-reward-img">` : `<div class="chest-reward-icon">${reward.emoji || '🎁'}</div>`;

        chestRewardDisplay.innerHTML = `
        ${iconHTML}<div class="chest-reward-name">${getLang(reward.name)}</div>
        <div class="chest-reward-desc">${dynamicDesc}</div>
        <div class="chest-reward-level">Poziom: ${currentLevel} » ${currentLevel + 1}</div>
        <div class="chest-reward-level-bar"><div class="chest-reward-level-fill" style="width:${progress}%;"></div></div>`;
    } else {
        chestRewardDisplay.innerHTML = `<div class="chest-reward-icon">😔</div><div class="chest-reward-name">${getLang('ui_chest_empty_title')}</div><div class="chest-reward-desc">${getLang('ui_chest_empty_desc')}</div>`;
    }
    if (chestOverlay) chestOverlay.style.display = 'flex';
    game.paused = true; playSound('ChestOpen');
}