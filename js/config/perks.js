// ==============
// PERKS.JS (v0.71 - FIX: Poprawiony Import Broni)
// Lokalizacja: /js/config/perks.js
// ==============

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from './weapons/autoGun.js';
import { OrbitalWeapon } from './weapons/orbitalWeapon.js';
import { NovaWeapon } from './weapons/novaWeapon.js';

// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PERK_CONFIG } from './gameData.js';

/**
 * Definicja puli perków.
 */
export const perkPool = [
    {
        id: 'firerate', name: 'Szybszy ostrzał', desc:'+15% szybkostrzelności', 
        max: PERK_CONFIG.firerate?.max || 5, 
        color:'#90caf9', emoji:'🔫',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.fireRate *= PERK_CONFIG.firerate.value;
                gun.upgrade(perk); 
            }
        }
    },
    {
        id: 'damage', name: 'Silniejsze pociski', desc:'+1 obrażeń pocisków', 
        max: PERK_CONFIG.damage?.max || 6, 
        color:'#ef5350', emoji:'💥',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.bulletDamage += PERK_CONFIG.damage.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'multishot', name: 'Multishot', desc:'+1 pocisk i większy rozrzut', 
        max: PERK_CONFIG.multishot?.max || 4, 
        color:'#ffca28', emoji:'🎯',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.multishot += PERK_CONFIG.multishot.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'pierce', name: 'Przebicie', desc:'+1 przebicia pocisków', 
        max: PERK_CONFIG.pierce?.max || 4, 
        color:'#ab47bc', emoji:'➡️',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.pierce += PERK_CONFIG.pierce.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'orbital', name: 'Orbital', desc:'Orbitujące ostrza zadają obrażenia', 
        max: PERK_CONFIG.orbital?.max || 5, 
        color:'#80deea', emoji:'🌀',
        apply: (state, perk) => { 
            state.player.addWeapon(OrbitalWeapon, perk);
        }
    },
    {
        id: 'nova', name: 'Nova', desc:'Cykliczny wybuch pocisków wokół postaci', 
        max: PERK_CONFIG.nova?.max || 5, 
        color:'#ffd54f', emoji:'💫',
        apply: (state, perk) => { 
            state.player.addWeapon(NovaWeapon, perk);
        }
    },
    {
        id: 'speed', name: 'Szybkość ruchu', desc:'+10% prędkości gracza', 
        max: PERK_CONFIG.speed?.max || 4, 
        color:'#66bb6a', emoji:'🏃',
        apply: (state, perk) => { 
            state.player.speed *= PERK_CONFIG.speed.value; 
        }
    },
    {
        id: 'pickup', name: 'Zasięg zbierania', desc:'+40% zasięgu pickupów', 
        max: PERK_CONFIG.pickup?.max || 3, 
        color:'#b39ddb', emoji:'🧲',
        apply: (state, perk) => { 
            state.game.pickupRange *= PERK_CONFIG.pickup.value; 
        }
    },
    {
        id: 'health', name: 'Zdrowie +', desc:'+20 maks. zdrowia i leczenie', 
        max: PERK_CONFIG.health?.max || 3, 
        color:'#e57373', emoji:'❤️',
        apply: (state, perk) => {
            const bonusHealth = PERK_CONFIG.health.value;
            state.game.maxHealth += bonusHealth;
            state.game.health = Math.min(state.game.maxHealth, state.game.health + bonusHealth);
        }
    }
];