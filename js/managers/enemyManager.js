// ==============
// ENEMYMANAGER.JS (v0.75 - FIX: Poprawiono dryf spawnu Oblężnika)
// Lokalizacja: /js/managers/enemyManager.js
// ==============

import { devSettings } from '../services/dev.js';
// POPRAWKA v0.75: Import addBombIndicator dla sygnału Oblężenia
import { findFreeSpotForPickup, addBombIndicator } from '../core/utils.js';

// Import klasy bazowej
import { Enemy } from '../entities/enemy.js';
// Import 9 podklas wrogów (zrefaktoryzowane w v0.71)
import { StandardEnemy } from '../entities/enemies/standardEnemy.js';
import { HordeEnemy } from '../entities/enemies/hordeEnemy.js';
import { AggressiveEnemy } from '../entities/enemies/aggressiveEnemy.js';
import { KamikazeEnemy } from '../entities/enemies/kamikazeEnemy.js';
import { SplitterEnemy } from '../entities/enemies/splitterEnemy.js';
import { TankEnemy } from '../entities/enemies/tankEnemy.js';
import { RangedEnemy } from '../entities/enemies/rangedEnemy.js';
import { EliteEnemy } from '../entities/enemies/eliteEnemy.js';
import { WallEnemy } from '../entities/enemies/wallEnemy.js'; // NOWY IMPORT

// Import konfiguracji
import { ENEMY_STATS, SIEGE_EVENT_CONFIG } from '../config/gameData.js';

// POPRAWKA v0.71: Import 6 podklas pickupów z nowego folderu
import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';

import { Chest } from '../entities/chest.js';

// Mapa klas wrogów (działa bez zmian)
export const ENEMY_CLASS_MAP = {
    standard: StandardEnemy,
    horde: HordeEnemy,
    aggressive: AggressiveEnemy,
    kamikaze: KamikazeEnemy,
    splitter: SplitterEnemy,
    tank: TankEnemy,
    ranged: RangedEnemy,
    elite: EliteEnemy,
    wall: WallEnemy // DODANO
};

// Mapa klas pickupów (działa bez zmian, dzięki nowym importom)
const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

/**
 * Zwraca listę typów wrogów dozwolonych na podstawie czasu gry i ustawień dev.
 */
function getAvailableEnemyTypes(game) {
    const t = game.time;
    const types = ['standard'];
    if (t > 15) types.push('horde');
    if (t > 30) types.push('aggressive');
    if (t > 50) types.push('kamikaze');
    if (t > 70) types.push('splitter');
    if (t > 90) types.push('tank');
    if (t > 120) types.push('ranged');
    
    // POPRAWKA v0.75: 'wall' nie jest spawnowany losowo
    
    if (devSettings.allowedEnemies.includes('all')) return types;
    return types.filter(type => devSettings.allowedEnemies.includes(type));
}

/**
 * Tworzy instancję wroga na podstawie typu.
 */
function createEnemyInstance(type, x, y, hpScale, enemyIdCounter) {
    const stats = ENEMY_STATS[type];
    const EnemyClass = ENEMY_CLASS_MAP[type];
    
    if (!stats || !EnemyClass) {
        console.error(`Błąd krytyczny: Nieznany typ wroga '${type}'`);
        return null;
    }
    
    const newEnemy = new EnemyClass(x, y, stats, hpScale);
    newEnemy.id = enemyIdCounter;
    return newEnemy;
}

/**
 * Tworzy grupę wrogów typu 'horde'
 */
function spawnHorde(enemies, x, y, hpScale, enemyIdCounter) {
    const count = 4 + Math.floor(Math.random() * 3); // 4-6 wrogów
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 20; // 15-35px od punktu spawnu
        const hx = x + Math.cos(angle) * dist;
        const hy = y + Math.sin(angle) * dist;
        const newEnemy = createEnemyInstance('horde', hx, hy, hpScale, enemyIdCounter++);
        if (newEnemy) enemies.push(newEnemy);
    }
    return enemyIdCounter;
}

/**
 * Główna funkcja spawnująca wrogów (wywoływana z pętli)
 */
export function spawnEnemy(enemies, game, canvas, enemyIdCounter, camera) {
    let x, y;
    const margin = 20;
    
    const viewLeft = camera.offsetX;
    const viewRight = camera.offsetX + camera.viewWidth;
    const viewTop = camera.offsetY;
    const viewBottom = camera.offsetY + camera.viewHeight;
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;

    const edge = Math.random();
    if (edge < 0.25) { // Spawnowanie z Góry
        x = viewLeft + Math.random() * camera.viewWidth;
        y = viewTop - margin;
    } else if (edge < 0.5) { // Spawnowanie z Dołu
        x = viewLeft + Math.random() * camera.viewWidth;
        y = viewBottom + margin;
    } else if (edge < 0.75) { // Spawnowanie z Lewej
        x = viewLeft - margin;
        y = viewTop + Math.random() * camera.viewHeight;
    } else { // Spawnowanie z Prawej
        x = viewRight + margin;
        y = viewTop + Math.random() * camera.viewHeight;
    }

    x = Math.max(0, Math.min(worldWidth, x));
    y = Math.max(0, Math.min(worldHeight, y));

    const availableTypes = getAvailableEnemyTypes(game);
    
    if (availableTypes.length === 0) {
        return enemyIdCounter; 
    }
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const hpScale = 1 + 0.12 * (game.level - 1) + game.time / 90;

    if (type === 'horde') {
        enemyIdCounter = spawnHorde(enemies, x, y, hpScale, enemyIdCounter);
    } else {
        const newEnemy = createEnemyInstance(type, x, y, hpScale, enemyIdCounter++);
        if (newEnemy) enemies.push(newEnemy);
    }
    
    return enemyIdCounter;
}

/**
 * Spawnuje Elitę
 */
export function spawnElite(enemies, game, canvas, enemyIdCounter, camera) {
    if (devSettings.allowedEnemies.length > 0 && !devSettings.allowedEnemies.includes('all') && !devSettings.allowedEnemies.includes('elite')) {
        return enemyIdCounter; // Dev wyłączył elity
    }

    let x, y;
    const margin = 30; 
    
    const viewLeft = camera.offsetX;
    const viewRight = camera.offsetX + camera.viewWidth;
    const viewTop = camera.offsetY;
    const viewBottom = camera.offsetY + camera.viewHeight;
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;

    const edge = Math.random();
    if (edge < 0.25) { 
        x = viewLeft + Math.random() * camera.viewWidth; 
        y = viewTop - margin;
    } else if (edge < 0.5) { 
        x = viewLeft + Math.random() * camera.viewWidth; 
        y = viewBottom + margin;
    } else if (edge < 0.75) { 
        x = viewLeft - margin;
        y = viewTop + Math.random() * camera.viewHeight;
    } else { 
        x = viewRight + margin;
        y = viewTop + Math.random() * camera.viewHeight;
    }

    x = Math.max(0, Math.min(worldWidth, x));
    y = Math.max(0, Math.min(worldHeight, y));
    
    const hpScale = (1 + 0.12 * (game.level - 1) + game.time / 90) * 1.5; // Elity mają +50% HP
    const newEnemy = createEnemyInstance('elite', x, y, hpScale, enemyIdCounter++);
    if (newEnemy) enemies.push(newEnemy);
    
    return enemyIdCounter;
}

/**
 * NOWA FUNKCJA (v0.75): Dodaje wskaźniki ostrzegawcze Oblężenia.
 */
export function addSiegeIndicators(state) {
    const { bombIndicators, player } = state;
    
    const count = SIEGE_EVENT_CONFIG.SIEGE_EVENT_COUNT;
    const radius = SIEGE_EVENT_CONFIG.SIEGE_EVENT_RADIUS;
    const maxLife = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;

    // KRYTYCZNY FIX v0.75: Zapisz tablicę absolutnych współrzędnych do spawnu
    state.siegeSpawnQueue = []; // Inicjalizacja kolejki

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;
        
        // Zapisz współrzędne do użycia w fazie spawnu
        state.siegeSpawnQueue.push({ x, y });

        // Dodaj wskaźnik (używa absolutnych współrzędnych)
        bombIndicators.push({
            x: x,
            y: y,
            maxRadius: ENEMY_STATS.wall.size * 1.5, // Wskaż rozmiar zbliżony do wroga
            life: 0,
            maxLife: maxLife,
            isSiege: true 
        });
    }
}

/**
 * Pomocnicza funkcja do spawnowania Oblężników po ostrzeżeniu.
 */
export function spawnWallEnemies(state) {
    const { enemies, game } = state;
    
    // KRYTYCZNY FIX v0.75: Użyj wcześniej zapisanych współrzędnych z kolejki
    const spawnQueue = state.siegeSpawnQueue || []; 
    
    console.log(`[EVENT] Uruchamiam Wydarzenie Oblężenia! Spawnuję ${spawnQueue.length} wrogów 'wall' w pozycjach ostrzeżenia.`);

    for (let i = 0; i < spawnQueue.length; i++) {
        const { x, y } = spawnQueue[i];
        
        const hpScale = 1 + 0.12 * (game.level - 1) + game.time / 90;
        
        const newEnemy = createEnemyInstance('wall', x, y, hpScale, state.enemyIdCounter++);
        if (newEnemy) {
            enemies.push(newEnemy);
        }
    }
    
    // Opróżnij kolejkę po użyciu
    state.siegeSpawnQueue = []; 
    
    return state.enemyIdCounter;
}


/**
 * Główna funkcja spawnująca Wydarzenie Oblężenia.
 * POPRAWKA v0.75: Zmieniona, aby używać wskaźników.
 */
export function spawnSiegeRing(state) {
    // 1. Dodaj wskaźniki (ostrzeżenie)
    addSiegeIndicators(state);
    
    // 2. Wróć, a reszta logiczna zostanie wykonana w gameLogic.js
    console.log('[EVENT] Wysłano ostrzeżenie o Oblężeniu. Spawnowanie za ' + SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME + 's.');
    
    // Zwróć niezmieniony licznik - wrogowie zostaną dodani później
    return state.enemyIdCounter;
}


/**
 * Znajduje najbliższego wroga (używane przez broń)
 */
export function findClosestEnemy(player, enemies) {
    let closestDist = Infinity;
    let closestEnemy = null;
    
    if (!enemies || typeof enemies[Symbol.iterator] !== 'function') {
        return { enemy: null, distance: Infinity };
    }
    
    for (const e of enemies) {
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = e;
        }
    }
    return { enemy: closestEnemy, distance: closestDist };
}

/**
 * Logika zabicia wroga (wywoływana z kolizji)
 */
export function killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital = false) {
    game.score += e.stats.score;
    
    const gem = gemsPool.get();
    if (gem) {
        gem.init(
            e.x + (Math.random() - 0.5) * 5,
            e.y + (Math.random() - 0.5) * 5,
            4,
            e.stats.xp,
            '#4FC3F7'
        );
    }

    if (e.type !== 'elite') {
        for (const [type, prob] of Object.entries(e.stats.drops)) {
            if (devSettings.allowedEnemies.includes('all') || devSettings.allowedPickups.includes(type)) {
                if (Math.random() < prob) {
                    const pos = findFreeSpotForPickup(pickups, e.x, e.y);
                    const PickupClass = PICKUP_CLASS_MAP[type];
                    if (PickupClass) {
                        pickups.push(new PickupClass(pos.x, pos.y));
                    }
                    break;
                }
            }
        }
    }

    const particleCount = fromOrbital ? 3 : 8;
    for (let k = 0; k < particleCount; k++) {
        const p = particlePool.get();
        if (p) {
            const speed = (fromOrbital ? 2 : 4) * 60; // px/s
            p.init(
                e.x, e.y,
                (Math.random() - 0.5) * speed, // vx (px/s)
                (Math.random() - 0.5) * speed, // vy (px/s)
                fromOrbital ? 0.16 : 0.5, // life
                fromOrbital ? e.color : '#ff0000', // color
                0, // gravity
                (1.0 - 0.98) // friction
            );
        }
    }

    // Specjalna logika
    if (e.type === 'elite') {
        chests.push(new Chest(e.x, e.y));
    }
    
    if (e.type === 'splitter') {
        const hpScale = (1 + 0.12 * (game.level - 1) + game.time / 90) * 0.8; 
        
        const child1 = createEnemyInstance('horde', e.x - 5, e.y, hpScale, enemyIdCounter++);
        const child2 = createEnemyInstance('horde', e.x + 5, e.y, hpScale, enemyIdCounter++);
        
        if (child1) {
            child1.speed *= 1.1; 
            enemies.push(child1);
        }
        if (child2) {
            child2.speed *= 1.1; 
            enemies.push(child2);
        }
    }

    enemies.splice(idx, 1);
    return enemyIdCounter;
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.71] js/managers/enemyManager.js: Zaktualizowano importy pickupów do 6 oddzielnych plików.');