// ==============
// ENEMYMANAGER.JS (v0.63c - Poprawka skalowania prędkości DT)
// Lokalizacja: /js/managers/enemyManager.js
// ==============

import { devSettings } from '../services/dev.js';
import { findFreeSpotForPickup } from '../core/utils.js';
import { 
    Enemy, StandardEnemy, HordeEnemy, AggressiveEnemy, 
    KamikazeEnemy, SplitterEnemy, TankEnemy, RangedEnemy, EliteEnemy 
} from '../entities/enemy.js';
// POPRAWKA v0.62: Nie importujemy już Gem, bo nie tworzymy go tutaj
// import { Gem } from '../entities/gem.js'; 
import { 
    HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from '../entities/pickup.js';
import { Chest } from '../entities/chest.js';

// POPRAWKA v0.63c: Przeskalowanie wszystkich bazowych prędkości na 144 FPS (zamiast 60)
export const ENEMY_STATS = {
    standard:   { type: 'standard',   hp: 3,   speed: 173,  size: 10, damage: 5, color: '#FFC107', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.2 * 144
    horde:      { type: 'horde',      hp: 3,   speed: 144,  size: 8,  damage: 5, color: '#8BC34A', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.0 * 144
    aggressive: { type: 'aggressive', hp: 3,   speed: 173,  size: 10, damage: 5, color: '#2196F3', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.2 * 144
    kamikaze:   { type: 'kamikaze',   hp: 2.4, speed: 158,  size: 9,  damage: 8, color: '#FFEB3B', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.1 * 144
    splitter:   { type: 'splitter',   hp: 4,   speed: 158,  size: 12, damage: 5, color: '#EC407A', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.1 * 144
    tank:       { type: 'tank',       hp: 9,   speed: 101,  size: 14, damage: 5, color: '#795548', score: 20, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 0.7 * 144
    ranged:     { type: 'ranged',     hp: 4,   speed: 144,  size: 10, damage: 5, color: '#00BCD4', score: 10, xp: 1, drops: { heal: 0.04, magnet: 0.025, speed: 0.02, shield: 0.015, bomb: 0.01, freeze: 0.01 } }, // 1.0 * 144
    elite:      { type: 'elite',      hp: 24,  speed: 130,  size: 18, damage: 5, color: '#9C27B0', score: 80, xp: 7, drops: {} } // 0.9 * 144
};

export const ENEMY_CLASS_MAP = {
    standard: StandardEnemy,
    horde: HordeEnemy,
    aggressive: AggressiveEnemy,
    kamikaze: KamikazeEnemy,
    splitter: SplitterEnemy,
    tank: TankEnemy,
    ranged: RangedEnemy,
    elite: EliteEnemy
};

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
export function spawnEnemy(enemies, game, canvas, enemyIdCounter) {
    let x, y;
    const edge = Math.random();
    if (edge < 0.25) { // Top
        x = Math.random() * canvas.width; y = -20;
    } else if (edge < 0.5) { // Bottom
        x = Math.random() * canvas.width; y = canvas.height + 20;
    } else if (edge < 0.75) { // Left
        x = -20; y = Math.random() * canvas.height;
    } else { // Right
        x = canvas.width + 20; y = Math.random() * canvas.height;
    }

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
export function spawnElite(enemies, game, canvas, enemyIdCounter) {
    if (devSettings.allowedEnemies.length > 0 && !devSettings.allowedEnemies.includes('all') && !devSettings.allowedEnemies.includes('elite')) {
        return enemyIdCounter; // Dev wyłączył elity
    }

    let x, y;
    const edge = Math.random();
    if (edge < 0.25) { // Top
        x = Math.random() * canvas.width; y = -30;
    } else if (edge < 0.5) { // Bottom
        x = Math.random() * canvas.width; y = canvas.height + 30;
    } else if (edge < 0.75) { // Left
        x = -30; y = Math.random() * canvas.height;
    } else { // Right
        x = canvas.width + 30; y = Math.random() * canvas.height;
    }
    
    const hpScale = (1 + 0.12 * (game.level - 1) + game.time / 90) * 1.5; // Elity mają +50% HP
    const newEnemy = createEnemyInstance('elite', x, y, hpScale, enemyIdCounter++);
    if (newEnemy) enemies.push(newEnemy);
    
    return enemyIdCounter;
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
 * POPRAWKA v0.62: Przyjmuje pule obiektów
 */
export function killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital = false) {
    game.score += e.stats.score;
    
    // POPRAWKA v0.62: Użyj puli gemów
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

    // POPRAWKA v0.62: Użyj puli cząsteczek
    const particleCount = fromOrbital ? 3 : 8;
    for (let k = 0; k < particleCount; k++) {
        const p = particlePool.get();
        if (p) {
            // POPRAWKA v0.62e: Zmiana czasu życia na sekundy i wartości fizyki
            const speed = (fromOrbital ? 2 : 4) * 60; // px/s
            p.init(
                e.x, e.y,
                (Math.random() - 0.5) * speed, // vx (px/s)
                (Math.random() - 0.5) * speed, // vy (px/s)
                fromOrbital ? 0.16 : 0.5, // life (było 10 / 30 klatek)
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