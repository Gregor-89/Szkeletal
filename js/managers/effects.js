// ==============
// EFFECTS.JS (v0.74 - Eksport PICKUP_CLASS_MAP)
// Lokalizacja: /js/managers/effects.js
// ==============

import { limitedShake, addBombIndicator, findFreeSpotForPickup } from '../core/utils.js';
import { devSettings } from '../services/dev.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { EFFECTS_CONFIG, HAZARD_CONFIG } from '../config/gameData.js'; // POPRAWKA v0.68: Import HAZARD_CONFIG
import { Hazard } from '../entities/hazard.js'; // POPRAWKA v0.68: Import nowej klasy Hazard

// POPRAWKA v0.71: Import 6 podklas pickupów z nowego folderu
import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';


// Mapa dla klas pickupów (działa bez zmian)
export const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

/**
 * POPRAWKA v0.68: Pomocnicza funkcja do znajdowania miejsca na spawn Hazardu.
 */
function findFreeSpotForHazard(player, camera) {
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;
    
    // Konfiguracja minimalnej odległości i promienia
    const minD = HAZARD_CONFIG.MIN_DIST_FROM_PLAYER;
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
        // Losuj pozycję w świecie
        const x = Math.random() * worldWidth;
        const y = Math.random() * worldHeight;
        
        const dist = Math.hypot(player.x - x, player.y - y);
        
        if (dist > minD) {
            return { x, y };
        }
    }
    
    // Jeśli nie znaleziono miejsca, spróbuj w losowym miejscu na granicy minimalnej odległości
    const angle = Math.random() * Math.PI * 2;
    return {
        x: player.x + Math.cos(angle) * (minD + HAZARD_CONFIG.SIZE),
        y: player.y + Math.sin(angle) * (minD + HAZARD_CONFIG.SIZE)
    };
}


/**
 * POPRAWKA v0.68: Spawnuje jedno Pole Zagrożenia.
 */
export function spawnHazard(hazards, player, camera) {
    if (hazards.length >= HAZARD_CONFIG.MAX_HAZARDS) {
        return; // Osiągnięto limit
    }
    
    const pos = findFreeSpotForHazard(player, camera);
    
    // --- Logika Mega Hazardu ---
    const isMega = Math.random() < HAZARD_CONFIG.MEGA_HAZARD_PROBABILITY;
    let scale = 1;
    
    if (isMega) {
        const minScale = HAZARD_CONFIG.MEGA_HAZARD_BASE_MULTIPLIER;
        const maxScale = HAZARD_CONFIG.MEGA_HAZARD_MAX_MULTIPLIER;
        // Losowa skala w zdefiniowanym zakresie
        scale = minScale + Math.random() * (maxScale - minScale);
    }
    
    const newHazard = new Hazard(pos.x, pos.y, isMega, scale);
    hazards.push(newHazard);
    
    console.log(`[DEBUG] js/managers/effects.js: Spawn Hazard (Mega: ${isMega ? 'Tak' : 'Nie'}, Scale: ${scale.toFixed(2)}) w pozycji`, pos);
}


/**
 * NOWA FUNKCJA V0.67: Aktualizuje cząsteczki (konfetti) niezależnie od pauzy.
 */
export function updateParticles(dt, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
    }
}


/**
 * Pętla aktualizująca wszystkie efekty wizualne (cząsteczki, teksty).
 * POPRAWKA v0.62e: Aktualizuje już tylko wskaźniki bomb.
 * POPRAWKA V0.67: Usuwa particles z sygnatury (jest w osobnej funkcji), ale jej to nie obchodzi.
 */
export function updateVisualEffects(dt, hitTexts_deprecated, confettis_deprecated, bombIndicators) {
    // Pętle for hitTexts i confettis zostały usunięte (przeniesione do gameLogic.js)
    
    // Aktualizuj wskaźniki bomb (nadal zwykła tablica)
    for (let i = bombIndicators.length - 1; i >= 0; i--) {
        const b = bombIndicators[i];
        b.life += dt;
        if (b.life >= b.maxLife) {
            bombIndicators.splice(i, 1);
        }
    }
    // Log diagnostyczny usunięty, aby zapobiec spamowi.
}