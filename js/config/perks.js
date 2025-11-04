// ==============
// PERKS.JS (v0.65 - Centralizacja Danych)
// Lokalizacja: /js/config/perks.js
// ==============

import { AutoGun, OrbitalWeapon, NovaWeapon } from './weapon.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PERK_CONFIG } from './gameData.js';

/**
 * Definicja puli perków.
 * Funkcje 'apply' przyjmują teraz obiekt 'state' oraz 'perk',
 * aby mogły wchodzić w interakcję z nowym systemem broni gracza.
 * * POPRAWKA v0.65: Wszystkie wartości 'max' i 'value' są
 * pobierane dynamicznie z pliku gameData.js (z PERK_CONFIG).
 */
export const perkPool = [
    {
        id: 'firerate', name: 'Szybszy ostrzał', desc:'+15% szybkostrzelności', 
        max: PERK_CONFIG.firerate.max, 
        color:'#90caf9', emoji:'🔫',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                // Zamiast *= 0.85, używamy wartości z konfiguracji
                gun.fireRate *= PERK_CONFIG.firerate.value;
                gun.upgrade(perk); // Przekazujemy, aby broń mogła zaktualizować swoje staty
            }
        }
    },
    {
        id: 'damage', name: 'Silniejsze pociski', desc:'+1 obrażeń pocisków', 
        max: PERK_CONFIG.damage.max, 
        color:'#ef5350', emoji:'💥',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                // Używamy wartości z konfiguracji
                gun.bulletDamage += PERK_CONFIG.damage.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'multishot', name: 'Multishot', desc:'+1 pocisk i większy rozrzut', 
        max: PERK_CONFIG.multishot.max, 
        color:'#ffca28', emoji:'🎯',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                // Używamy wartości z konfiguracji
                gun.multishot += PERK_CONFIG.multishot.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'pierce', name: 'Przebicie', desc:'+1 przebicia pocisków', 
        max: PERK_CONFIG.pierce.max, 
        color:'#ab47bc', emoji:'➡️',
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                // Używamy wartości z konfiguracji
                gun.pierce += PERK_CONFIG.pierce.value;
                gun.upgrade(perk);
            }
        }
    },
    {
        id: 'orbital', name: 'Orbital', desc:'Orbitujące ostrza zadają obrażenia', 
        max: PERK_CONFIG.orbital.max, 
        color:'#80deea', emoji:'🌀',
        apply: (state, perk) => { 
            state.player.addWeapon(OrbitalWeapon, perk);
        }
    },
    {
        id: 'nova', name: 'Nova', desc:'Cykliczny wybuch pocisków wokół postaci', 
        max: PERK_CONFIG.nova.max, 
        color:'#ffd54f', emoji:'💫',
        apply: (state, perk) => { 
            state.player.addWeapon(NovaWeapon, perk);
        }
    },
    {
        id: 'speed', name: 'Szybkość ruchu', desc:'+10% prędkości gracza', 
        max: PERK_CONFIG.speed.max, 
        color:'#66bb6a', emoji:'🏃',
        apply: (state, perk) => { 
            // Używamy wartości z konfiguracji
            state.player.speed *= PERK_CONFIG.speed.value; 
        }
    },
    {
        id: 'pickup', name: 'Zasięg zbierania', desc:'+40% zasięgu pickupów', 
        max: PERK_CONFIG.pickup.max, 
        color:'#b39ddb', emoji:'🧲',
        apply: (state, perk) => { 
            // Używamy wartości z konfiguracji
            state.game.pickupRange *= PERK_CONFIG.pickup.value; 
        }
    },
    {
        id: 'health', name: 'Zdrowie +', desc:'+20 maks. zdrowia i leczenie', 
        max: PERK_CONFIG.health.max, 
        color:'#e57373', emoji:'❤️',
        apply: (state, perk) => {
            // Używamy wartości z konfiguracji
            const bonusHealth = PERK_CONFIG.health.value;
            state.game.maxHealth += bonusHealth;
            state.game.health = Math.min(state.game.maxHealth, state.game.health + bonusHealth);
        }
    }
];