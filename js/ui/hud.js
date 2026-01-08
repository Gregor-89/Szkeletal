// ==============
// HUD.JS (v1.0a - Import Fix)
// Lokalizacja: /js/ui/hud.js
// ==============

// ZMIANA: Poprawiono import z 'getAsset' na 'get as getAsset', ponieważ assets.js eksportuje funkcję 'get'
import { get as getAsset } from '../services/assets.js';
import { getLang } from '../services/i18n.js';
import { UI_CONFIG } from '../config/gameData.js';
import { formatTime } from '../services/scoreManager.js';
import { 
    xpBarFill, playerHPBarInner, playerHPBarTxt, xpBarTxt, bonusPanel, 
    hungerWidget, hungerFill 
} from './domElements.js';

let hpBarOuterRef = null;

export function updateEnemyCounter(game, enemies) {
    if (!game.running || game.paused) return;
    
    // Filtrujemy wrogów typu 'wall', bo oni nie wliczają się do limitu spawnu
    const nonWallEnemiesCount = enemies.filter(e => e.type !== 'wall').length;
    const limit = game.dynamicEnemyLimit;
    
    const cntSpan = document.getElementById('enemyCountSpan');
    const limSpan = document.getElementById('enemyLimitSpan');
    const killsSpan = document.getElementById('totalKillsSpan'); 
    
    if (cntSpan) cntSpan.textContent = nonWallEnemiesCount;
    if (limSpan) limSpan.textContent = limit;
    if (killsSpan) killsSpan.textContent = game.totalKills || 0; 
}

export function updateUI(game, player, settings) {
    // Aktualizacja tekstów statystyk
    const elScore = document.getElementById('score');
    const elLevel = document.getElementById('level');
    const elXp = document.getElementById('xp');
    const elXpNeeded = document.getElementById('xpNeeded');
    const elHealth = document.getElementById('health');
    const elTime = document.getElementById('time');

    if(elScore) elScore.textContent = game.score;
    if(elLevel) elLevel.textContent = game.level;
    if(elXp) elXp.textContent = game.xp;
    if(elXpNeeded) elXpNeeded.textContent = game.xpNeeded;
    if(elHealth) elHealth.textContent = `${Math.max(0, Math.floor(game.health))}/${game.maxHealth}`;
    if(elTime) elTime.textContent = formatTime(Math.floor(game.time));

    // Paski postępu
    const xpPct = Math.max(0, Math.min(1, game.xp / game.xpNeeded));
    if(xpBarFill) xpBarFill.style.width = (xpPct * 100).toFixed(1) + '%';

    const healthPctBar = Math.max(0, Math.min(1, game.health / game.maxHealth));
    if(playerHPBarInner) playerHPBarInner.style.width = (healthPctBar * 100).toFixed(1) + '%';
    
    // Etykiety na paskach
    const hpLabel = getLang('ui_hud_hp_name') || 'HP';
    const xpLabel = getLang('ui_hud_xp_name') || 'XP';
    if(playerHPBarTxt) playerHPBarTxt.innerHTML = `${hpLabel}: ${Math.ceil(game.health)}/${game.maxHealth}`;
    if(xpBarTxt) xpBarTxt.innerHTML = `${xpLabel}: ${Math.floor(game.xp)}/${Math.floor(game.xpNeeded)}`;

    // Efekty wizualne paska HP (Low Health / Hunger)
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) { 
        const isLowHealth = healthPctBar <= UI_CONFIG.LOW_HEALTH_THRESHOLD && game.health > 0;
        
        // Low Health Pulse
        if (isLowHealth) {
            hpBarOuterRef.classList.add('low-health-pulse');
        } else {
            hpBarOuterRef.classList.remove('low-health-pulse');
        }
        
        // Starvation Effect
        if (game.hunger <= 0) {
            hpBarOuterRef.classList.add('hp-bar-starving');
        } else {
            hpBarOuterRef.classList.remove('hp-bar-starving');
        }
    }
    
    // Widget Głodu
    if (hungerFill) {
        const hungerPct = Math.max(0, Math.min(1, game.hunger / game.maxHunger));
        const topCut = (1 - hungerPct) * 100;
        hungerFill.style.clipPath = `inset(${topCut}% 0 0 0)`;
    }
    
    if (hungerWidget) {
        if (game.hunger <= 0) {
            hungerWidget.classList.add('starving');
        } else {
            hungerWidget.classList.remove('starving');
        }
    }
    
    // Panel Bonusów (Ikony)
    if(bonusPanel) {
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
}

export function resetHealthBarVisuals() {
    if (!hpBarOuterRef) hpBarOuterRef = document.getElementById('playerHPBarOuter');
    if (hpBarOuterRef) {
        hpBarOuterRef.classList.remove('low-health-pulse');
        hpBarOuterRef.classList.remove('hp-bar-starving');
    }
    if (bonusPanel) bonusPanel.innerHTML = '';
}