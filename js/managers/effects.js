// ==============
// EFFECTS.JS (v0.83t - FIX: Zapobieganie nakładaniu się Hazardów)
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
 * NOWA Funkcja (v0.83t): Znajduje miejsce dla nowego Hazardu, unikając kolizji z istniejącymi.
 * Dodatkowo próbuje utrzymać pozycję poza ekranem, ale w pobliżu gracza.
 */
function findHazardSpawnSpot(player, camera, hazards) {
    const maxAttempts = 12; // Zwiększona liczba prób
    const spawnMargin = 50; // Margines poza ekranem (w px)
    const separationDistance = HAZARD_CONFIG.SIZE * 1.5; // Minimalna odległość od centrum innego Hazardu
    
    // Granice świata
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x, y;
        
        // --- Krok 1: Wstępne określenie punktu spawnu (Poza ekranem) ---
        const viewLeft = camera.offsetX;
        const viewRight = camera.offsetX + camera.viewWidth;
        const viewTop = camera.offsetY;
        const viewBottom = camera.offsetY + camera.viewHeight;
        
        // Określenie, z której krawędzi ma nastąpić spawn
        const edge = Math.random();
        if (edge < 0.25) { // Spawnowanie z Góry
            x = viewLeft + Math.random() * camera.viewWidth;
            y = viewTop - spawnMargin;
        } else if (edge < 0.5) { // Spawnowanie z Dołu
            x = viewLeft + Math.random() * camera.viewWidth;
            y = viewBottom + spawnMargin;
        } else if (edge < 0.75) { // Spawnowanie z Lewej
            x = viewLeft - spawnMargin;
            y = viewTop + Math.random() * camera.viewHeight;
        } else { // Spawnowanie z Prawej
            x = viewRight + spawnMargin;
            y = viewTop + Math.random() * camera.viewHeight;
        }
        
        // Ograniczenie pozycji do granic świata
        x = Math.max(0, Math.min(worldWidth, x));
        y = Math.max(0, Math.min(worldHeight, y));
        
        // --- Krok 2: Sprawdzenie kolizji z istniejącymi Hazardami ---
        let isClear = true;
        for (const existingHazard of hazards) {
            const dx = x - existingHazard.x;
            const dy = y - existingHazard.y;
            const dist = Math.hypot(dx, dy);
            
            // Sprawdź, czy odległość jest mniejsza niż suma promieni z marginesem
            // Używamy ujednoliconej miary: separationDistance (1.5x HAZARD_CONFIG.SIZE)
            if (dist < separationDistance + existingHazard.r) {
                isClear = false;
                break;
            }
        }
        
        // --- Krok 3: Sprawdzenie minimalnej odległości od gracza (jeśli jest zbyt blisko) ---
        const distToPlayer = Math.hypot(x - player.x, y - player.y);
        if (distToPlayer < HAZARD_CONFIG.MIN_DIST_FROM_PLAYER) {
            isClear = false; // Odrzuć, jeśli jest zbyt blisko gracza
        }
        
        if (isClear) {
            return { x, y };
        }
    }
    
    // Jeśli po wielu próbach nie znaleziono idealnego miejsca, wróć do ostatniego losowego
    console.warn('[HazardManager] Nie znaleziono idealnego miejsca dla Hazardu po ' + maxAttempts + ' próbach. Użycie ostatniej losowej pozycji.');
    return {
        x: player.x + (Math.random() * 800 - 400),
        y: player.y + (Math.random() * 600 - 300)
    };
}


/**
 * POPRAWKA v0.68: Spawnuje jedno Pole Zagrożenia.
 */
export function spawnHazard(hazards, player, camera) {
    if (hazards.length >= HAZARD_CONFIG.MAX_HAZARDS) {
        return; // Osiągnięto limit
    }
    
    // POPRAWKA v0.83t: Użyj nowej, zaawansowanej funkcji sprawdzającej kolizje
    const pos = findHazardSpawnSpot(player, camera, hazards);
    
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
    
    // Usunięto log, aby nie spamować konsoli przy każdym spawnie
    // console.log(`[DEBUG] js/managers/effects.js: Spawn Hazard (Mega: ${isMega ? 'Tak' : 'Nie'}, Scale: ${scale.toFixed(2)}) w pozycji`, pos);
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