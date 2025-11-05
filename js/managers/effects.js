// ==============
// EFFECTS.JS (v0.68 FIX 3 - Usunięcie spamu logów z pętli)
// Lokalizacja: /js/managers/effects.js
// ==============

import { limitedShake, addBombIndicator, findFreeSpotForPickup } from '../core/utils.js';
import { devSettings } from '../services/dev.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { EFFECTS_CONFIG, HAZARD_CONFIG } from '../config/gameData.js'; // POPRAWKA v0.68: Import HAZARD_CONFIG
import { Hazard } from '../entities/hazard.js'; // POPRAWKA v0.68: Import nowej klasy Hazard
import { 
    HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from '../entities/pickup.js';

// Mapa dla klas pickupów
const PICKUP_CLASS_MAP = {
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
    
    for(let i = 0; i < maxAttempts; i++) {
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
    const newHazard = new Hazard(pos.x, pos.y);
    hazards.push(newHazard);
    
    console.log('[DEBUG] js/managers/effects.js: Spawn Hazard w pozycji', pos);
}


/**
 * Logika bomby: niszczy wrogów i tworzy efekty w danym promieniu.
 * POPRAWKA v0.65: Wartości fizyki cząsteczek pobierane z EFFECTS_CONFIG
 */
export function areaNuke(cx, cy, r, onlyXP = false, game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators) {
    
    // Pobierz konfigurację efektów bomby
    const c = EFFECTS_CONFIG;
    
    for(let i = 0; i < c.NUKE_PARTICLE_COUNT; i++){
      const angle = (i / c.NUKE_PARTICLE_COUNT) * Math.PI * 2;
      const dist = Math.random() * r;
      
      // POPRAWKA v0.62: Użyj puli cząsteczek
      const p = particlePool.get();
      if (p) {
        // init(x, y, vx, vy, life, color, gravity, friction, size)
        p.init(
            cx + Math.cos(angle) * dist,
            cy + Math.sin(angle) * dist,
            (Math.random()*2-1) * c.NUKE_PARTICLE_SPEED, // vx (px/s)
            (Math.random()*2-1) * c.NUKE_PARTICLE_SPEED, // vy (px/s)
            c.NUKE_PARTICLE_LIFE, // life (s)
            ['#ff6b00','#ff9500','#ffbb00','#fff59d'][Math.floor(Math.random()*4)], // color
            0, // gravity
            (1.0 - 0.98) // friction (0.02)
        );
      }
    }

    for(let j=enemies.length-1;j>=0;j--){
      const e=enemies[j];
      const d=Math.hypot(cx-e.x,cy-e.y);
      if(d<=r){
        // POPRAWKA v0.62: Użyj puli gemów
        const gem = gemsPool.get();
        if (gem) {
            gem.init(
                e.x+(Math.random()-0.5)*5,
                e.y+(Math.random()-0.5)*5,
                4,
                (e.type==='elite')?7:1,
                '#4FC3F7'
            );
        }
        game.score+=(e.type==='elite')?80: (e.type==='tank'?20:10);

        if(!onlyXP){
          function maybe(type,prob){
            if(!devSettings.allowedPickups.includes('all') && !devSettings.allowedPickups.includes(type)) return;
            if(Math.random()<prob) {
              const pos = findFreeSpotForPickup(pickups, e.x, e.y);
              const PickupClass = PICKUP_CLASS_MAP[type];
              if (PickupClass) {
                  pickups.push(new PickupClass(pos.x, pos.y));
              }
            }
          }
          maybe('heal',0.04);
          maybe('magnet',0.025);
          maybe('speed',0.02);
          maybe('shield',0.015);
          maybe('bomb',0.01);
          maybe('freeze',0.01);
        }

        // POPRAWKA v0.62: Użyj puli cząsteczek
        for(let k=0;k<4;k++){
          const p = particlePool.get();
          if (p) {
            // init(x, y, vx, vy, life, color)
            p.init(
                e.x, e.y,
                (Math.random()-0.5) * 4 * 60, // vx (px/s)
                (Math.random()-0.5) * 4 * 60, // vy (px/s)
                0.5, // life (było 30 klatek)
                '#ff0000' // color
            );
          }
        }

        enemies.splice(j,1);
      }
    }

    limitedShake(game, settings, 10, 180);
    addBombIndicator(bombIndicators, cx, cy, r);
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