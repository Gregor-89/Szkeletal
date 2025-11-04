// ==============
// PERKS.JS (v0.55 - Reorganizacja folderów)
// Lokalizacja: /js/config/perks.js
// ==============

// POPRAWKA v0.55: Ścieżka importu jest poprawna (ten sam folder)
import { AutoGun, OrbitalWeapon, NovaWeapon } from './weapon.js';

/**
 * Definicja puli perków.
 * Funkcje 'apply' przyjmują teraz obiekt 'state' oraz 'perk',
 * aby mogły wchodzić w interakcję z nowym systemem broni gracza.
 */
export const perkPool = [
    {
        id: 'firerate', name: 'Szybszy ostrzał', desc:'+15% szybkostrzelności', max:5, color:'#90caf9', emoji:'🔫',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) gun.upgrade(perk);
        }
    },
    {
        id: 'damage', name: 'Silniejsze pociski', desc:'+1 obrażeń pocisków', max:6, color:'#ef5350', emoji:'💥',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) gun.upgrade(perk);
        }
    },
    {
        id: 'multishot', name: 'Multishot', desc:'+1 pocisk i większy rozrzut', max:4, color:'#ffca28', emoji:'🎯',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) gun.upgrade(perk);
        }
    },
    {
        id: 'pierce', name: 'Przebicie', desc:'+1 przebicia pocisków', max:4, color:'#ab47bc', emoji:'➡️',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) gun.upgrade(perk);
        }
    },
    {
        id: 'orbital', name: 'Orbital', desc:'Orbitujące ostrza zadają obrażenia', max:5, color:'#80deea', emoji:'🌀',
        apply: (state, perk) => { 
            state.player.addWeapon(OrbitalWeapon, perk);
        }
    },
    {
        id: 'nova', name: 'Nova', desc:'Cykliczny wybuch pocisków wokół postaci', max:5, color:'#ffd54f', emoji:'💫',
        apply: (state, perk) => { 
            state.player.addWeapon(NovaWeapon, perk);
        }
    },
    {
        id: 'speed', name: 'Szybkość ruchu', desc:'+10% prędkości gracza', max:4, color:'#66bb6a', emoji:'🏃',
        apply: (state, perk) => { state.player.speed *= 1.1; }
    },
    {
        id: 'pickup', name: 'Zasięg zbierania', desc:'+40% zasięgu pickupów', max:3, color:'#b39ddb', emoji:'🧲',
        apply: (state, perk) => { state.game.pickupRange *= 1.4; }
    },
    {
        id: 'health', name: 'Zdrowie +', desc:'+20 maks. zdrowia i leczenie', max:3, color:'#e57373', emoji:'❤️',
        apply: (state, perk) => {
            state.game.maxHealth += 20;
            state.game.health = Math.min(state.game.maxHealth, state.game.health + 20);
        }
    }
];