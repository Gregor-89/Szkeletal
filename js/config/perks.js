// ==============
// PERKS.JS (v0.90 - Implementacja i18n)
// Lokalizacja: /js/config/perks.js
// ==============

// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from './weapons/autoGun.js';
import { OrbitalWeapon } from './weapons/orbitalWeapon.js';
import { NovaWeapon } from './weapons/novaWeapon.js';
import { WhipWeapon } from './weapons/whipWeapon.js';
// NOWY IMPORT v0.82a
import { ChainLightningWeapon } from './weapons/chainLightningWeapon.js';

// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PERK_CONFIG } from './gameData.js';
// NOWY IMPORT v0.90: Silnik i18n
import { getLang } from '../services/i18n.js';

/**
 * Definicja puli perków.
 */
export const perkPool = [
    {
        id: 'firerate', 
        name: getLang('perk_firerate_name'), // "Plujko Prędszy Jad"
        desc: getLang('perk_firerate_desc'), // "Bo hejt trzeba dawkować szybko!..."
        max: PERK_CONFIG.firerate?.max || 6, 
        color:'#90caf9', emoji:'⏩', // POPRAWKA v0.81e: Zmiana emoji
        requiresWeapon: 'AutoGun', // POPRAWKA v0.81c: Zmiana z klasy na string
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
        name: getLang('perk_damage_name'), // "Plujko Bólu Jad"
        desc: getLang('perk_damage_desc'), // "Obiektywne zwiększenie toksyczności..."
        max: PERK_CONFIG.damage?.max || 6, 
        color:'#ef5350', emoji:'💥',
        requiresWeapon: 'AutoGun', // POPRAWKA v0.81c: Zmiana z klasy na string
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
        name: getLang('perk_multishot_name'), // "Plujko Multi Jad"
        desc: getLang('perk_multishot_desc'), // "Wertykalna dywersyfikacja hejtu..."
        max: PERK_CONFIG.multishot?.max || 4, 
        color:'#ffca28', emoji:'🎯',
        requiresWeapon: 'AutoGun', // POPRAWKA v0.81c: Zmiana z klasy na string
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
        name: getLang('perk_pierce_name'), // "Plujko Dziurko Jad"
        desc: getLang('perk_pierce_desc'), // "Twój jad jest tak żrący..."
        max: PERK_CONFIG.pierce?.max || 4, 
        color:'#ab47bc', emoji:'➡️',
        requiresWeapon: 'AutoGun', // POPRAWKA v0.81c: Zmiana z klasy na string
        apply: (state, perk) => { 
            const gun = state.player.getWeapon(AutoGun);
            if (gun) {
                gun.pierce += PERK_CONFIG.pierce.value;
                gun.upgrade(perk);
            }
        }
    },
    // NOWY PERK v0.81b
    {
        id: 'autogun', 
        name: getLang('perk_autogun_name'), // "Plujko Jad"
        desc: getLang('perk_autogun_desc'), // "Automatyczny oręż..."
        max: 1, 
        color:'#90caf9', emoji:'🔫',
        apply: (state, perk) => { 
            // Ta funkcja tylko dodaje broń (level 1)
            state.player.addWeapon(AutoGun, perk);
        }
    },
    // NOWY PERK v0.81f (Przywrócenie ulepszenia dla Bicza)
    {
        id: 'whip', 
        name: getLang('perk_whip_name'), // "Tłuczek Hrabianki"
        desc: getLang('perk_whip_desc'), // "Broń startowa. Tłucze horyzontalnie..."
        max: PERK_CONFIG.whip?.max || 5, 
        color:'#C8E6C9', emoji:'🪢',
        apply: (state, perk) => { 
            // Gracz już ma Bicz, więc addWeapon() wywoła upgrade()
            state.player.addWeapon(WhipWeapon, perk);
        }
    },
    {
        id: 'orbital', 
        name: getLang('perk_orbital_name'), // "Orbitalne Ziemniaczki"
        desc: getLang('perk_orbital_desc'), // "Krążące artefakty-ziemniaczki..."
        max: PERK_CONFIG.orbital?.max || 5, 
        color:'#80deea', emoji:'🌀',
        apply: (state, perk) => { 
            state.player.addWeapon(OrbitalWeapon, perk);
        }
    },
    {
        id: 'nova', 
        name: getLang('perk_nova_name'), // "Eksplozja Mentalu"
        desc: getLang('perk_nova_desc'), // "Cykliczna emanacja \"pato-lore\"..."
        max: PERK_CONFIG.nova?.max || 5, 
        color:'#ffd54f', emoji:'💫',
        apply: (state, perk) => { 
            state.player.addWeapon(NovaWeapon, perk);
        }
    },
    // NOWA BROŃ v0.82a
    {
        id: 'chainLightning', 
        name: getLang('perk_chainLightning_name'), // "Pierun Ludologa"
        desc: getLang('perk_chainLightning_desc'), // "Automatyczny atak, razi najbliższego..."
        max: PERK_CONFIG.chainLightning?.max || 6, // POPRAWKA v0.82b: Zwiększono max
        color:'#40C4FF', emoji:'⚡',
        apply: (state, perk) => { 
            state.player.addWeapon(ChainLightningWeapon, perk);
        }
    },
    {
        id: 'speed', 
        name: getLang('perk_speed_name'), // "Chyżność Ucieczki"
        desc: getLang('perk_speed_desc'), // "Nawet Hrabia musi czasem..."
        max: PERK_CONFIG.speed?.max || 4, 
        color:'#66bb6a', emoji:'👟', // POPRAWKA v0.82a: Zmiana emoji
        apply: (state, perk) => { 
            state.player.speed *= PERK_CONFIG.speed.value; 
        }
    },
    {
        id: 'pickup', 
        name: getLang('perk_pickup_name'), // "Zasięg Żerowania"
        desc: getLang('perk_pickup_desc'), // "Im większy głód, tym dłuższe ręce..."
        max: PERK_CONFIG.pickup?.max || 3, 
        color:'#b39ddb', emoji:'🧲',
        apply: (state, perk) => { 
            state.game.pickupRange *= PERK_CONFIG.pickup.value; 
        }
    },
    {
        id: 'health', 
        name: getLang('perk_health_name'), // "Poziom Sytości"
        desc: getLang('perk_health_desc'), // "Większy żołądek na hejt..."
        max: PERK_CONFIG.health?.max || 3, 
        color:'#e57373', emoji:'❤️',
        apply: (state, perk) => {
            const bonusHealth = PERK_CONFIG.health.value;
            state.game.maxHealth += bonusHealth;
            state.game.health = Math.min(state.game.maxHealth, state.game.health + bonusHealth);
        }
    }
];