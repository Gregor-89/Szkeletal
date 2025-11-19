// ==============
// PERKS.JS (v0.94 - Ikona Magnet Perk)
// Lokalizacja: /js/config/perks.js
// ==============

import { AutoGun } from './weapons/autoGun.js';
import { OrbitalWeapon } from './weapons/orbitalWeapon.js';
import { NovaWeapon } from './weapons/novaWeapon.js';
import { WhipWeapon } from './weapons/whipWeapon.js';
import { ChainLightningWeapon } from './weapons/chainLightningWeapon.js';

import { PERK_CONFIG } from './gameData.js';
import { getLang } from '../services/i18n.js';

export const perkPool = [
    {
        id: 'firerate', 
        name: getLang('perk_firerate_name'), 
        desc: getLang('perk_firerate_desc'), 
        max: PERK_CONFIG.firerate?.max || 6, 
        color:'#90caf9', emoji:'⏩',
        requiresWeapon: 'AutoGun', 
        icon: 'icon_firerate', 
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.fireRate *= PERK_CONFIG.firerate.value;
                gun.upgrade(perk); 
            }
        }
    },
    {
        id: 'damage', 
        name: getLang('perk_damage_name'), 
        desc: getLang('perk_damage_desc'), 
        max: PERK_CONFIG.damage?.max || 6, 
        color:'#ef5350', emoji:'💥',
        requiresWeapon: 'AutoGun', 
        icon: 'icon_damage',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.bulletDamage += PERK_CONFIG.damage.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'multishot', 
        name: getLang('perk_multishot_name'), 
        desc: getLang('perk_multishot_desc'), 
        max: PERK_CONFIG.multishot?.max || 4, 
        color:'#ffca28', emoji:'🎯',
        requiresWeapon: 'AutoGun', 
        icon: 'icon_multishot',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.multishot += PERK_CONFIG.multishot.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'pierce', 
        name: getLang('perk_pierce_name'), 
        desc: getLang('perk_pierce_desc'), 
        max: PERK_CONFIG.pierce?.max || 4, 
        color:'#ab47bc', emoji:'➡️',
        requiresWeapon: 'AutoGun', 
        icon: 'icon_pierce',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.pierce += PERK_CONFIG.pierce.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'autogun', 
        name: getLang('perk_autogun_name'), 
        desc: getLang('perk_autogun_desc'), 
        max: 1, 
        color:'#90caf9', emoji:'🔫',
        icon: 'icon_autogun', 
        apply: (state, perk) => { 
            state.player.addWeapon(AutoGun, perk);
        }
    },
    {
        id: 'whip', 
        name: getLang('perk_whip_name'), 
        desc: getLang('perk_whip_desc'), 
        max: PERK_CONFIG.whip?.max || 5, 
        color:'#C8E6C9', emoji:'🪢',
        icon: 'icon_whip', 
        apply: (state, perk) => { 
            state.player.addWeapon(WhipWeapon, perk);
        }
    },
    {
        id: 'orbital', 
        name: getLang('perk_orbital_name'), 
        desc: getLang('perk_orbital_desc'), 
        max: PERK_CONFIG.orbital?.max || 5, 
        color:'#80deea', emoji:'🌀',
        icon: 'icon_orbital', 
        apply: (state, perk) => { 
            state.player.addWeapon(OrbitalWeapon, perk);
        }
    },
    {
        id: 'nova', 
        name: getLang('perk_nova_name'), 
        desc: getLang('perk_nova_desc'), 
        max: PERK_CONFIG.nova?.max || 5, 
        color:'#ffd54f', emoji:'💫',
        icon: 'icon_nova', 
        apply: (state, perk) => { 
            state.player.addWeapon(NovaWeapon, perk);
        }
    },
    {
        id: 'chainLightning', 
        name: getLang('perk_chainLightning_name'), 
        desc: getLang('perk_chainLightning_desc'), 
        max: PERK_CONFIG.chainLightning?.max || 6, 
        color:'#40C4FF', emoji:'⚡',
        icon: 'icon_lightning', 
        apply: (state, perk) => { 
            state.player.addWeapon(ChainLightningWeapon, perk);
        }
    },
    {
        id: 'speed', 
        name: getLang('perk_speed_name'), 
        desc: getLang('perk_speed_desc'), 
        max: PERK_CONFIG.speed?.max || 4, 
        color:'#66bb6a', emoji:'👟', 
        icon: 'icon_speed',
        apply: (state, perk) => { 
            state.player.speed *= PERK_CONFIG.speed.value; 
        }
    },
    {
        id: 'pickup', 
        name: getLang('perk_pickup_name'), 
        desc: getLang('perk_pickup_desc'), 
        max: PERK_CONFIG.pickup?.max || 3, 
        color:'#b39ddb', emoji:'🧲',
        icon: 'icon_pickup_range', // NOWE v0.94: Dodano ikonę
        apply: (state, perk) => { 
            state.game.pickupRange *= PERK_CONFIG.pickup.value; 
        }
    },
    {
        id: 'health', 
        name: getLang('perk_health_name'), 
        desc: getLang('perk_health_desc'), 
        max: PERK_CONFIG.health?.max || 3, 
        color:'#e57373', emoji:'❤️',
        icon: 'icon_health',
        apply: (state, perk) => {
            const bonusHealth = PERK_CONFIG.health.value;
            state.game.maxHealth += bonusHealth;
            state.game.health = Math.min(state.game.maxHealth, state.game.health + bonusHealth);
        }
    }
];