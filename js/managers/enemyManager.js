// ==============
// ENEMYMANAGER.JS (v0.94i - FIX: Tiered Gem Sizes)
// Lokalizacja: /js/managers/enemyManager.js
// ==============

import { devSettings } from '../services/dev.js';
import { findFreeSpotForPickup, addBombIndicator } from '../core/utils.js'; 
import { playSound } from '../services/audio.js';
import { getLang } from '../services/i18n.js';

import { Enemy } from '../entities/enemy.js';

import { StandardEnemy } from '../entities/enemies/standardEnemy.js';
import { HordeEnemy } from '../entities/enemies/hordeEnemy.js';
import { AggressiveEnemy } from '../entities/enemies/aggressiveEnemy.js';
import { KamikazeEnemy } from '../entities/enemies/kamikazeEnemy.js';
import { SplitterEnemy } from '../entities/enemies/splitterEnemy.js';
import { TankEnemy } from '../entities/enemies/tankEnemy.js';
import { RangedEnemy } from '../entities/enemies/rangedEnemy.js';
import { EliteEnemy } from '../entities/enemies/eliteEnemy.js';
import { WallEnemy } from '../entities/enemies/wallEnemy.js';

import { ENEMY_STATS, SIEGE_EVENT_CONFIG, WALL_DETONATION_CONFIG } from '../config/gameData.js';

import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';

import { Chest } from '../entities/chest.js';

export const ENEMY_CLASS_MAP = {
    standard: StandardEnemy,
    horde: HordeEnemy,
    aggressive: AggressiveEnemy,
    kamikaze: KamikazeEnemy,
    splitter: SplitterEnemy,
    tank: TankEnemy,
    ranged: RangedEnemy,
    elite: EliteEnemy,
    wall: WallEnemy
};

const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

export function getAvailableEnemyTypes(game) {
    const t = game.time;
    const seen = game.seenEnemyTypes; 

    const availableAtTime = [
        t > 0 ? 'standard' : null,
        t > 30 ? 'horde' : null,
        t > 60 ? 'aggressive' : null,
        t > 90 ? 'kamikaze' : null,
        t > 120 ? 'splitter' : null,
        t > 180 ? 'tank' : null,
        t > 210 ? 'ranged' : null
    ].filter(type => type !== null);

    let typesToSpawn = [];
    let newEnemyType = null;
    
    for (const type of availableAtTime) {
        if (!seen.includes(type)) {
            newEnemyType = type;
            break; 
        }
    }
    
    if (newEnemyType && game.newEnemyWarningT <= 0) {
        game.newEnemyWarningT = 3.0; 
        game.newEnemyWarningType = getLang(`enemy_${newEnemyType}_name`).toUpperCase();
        game.seenEnemyTypes.push(newEnemyType); 
        playSound('EliteSpawn'); 
        console.log(`[ENEMY-WARN] Aktywowano ostrzeżenie: ${newEnemyType}.`);
        
        typesToSpawn = availableAtTime.filter(type => seen.includes(type));
    } else if (newEnemyType && game.newEnemyWarningT > 0) {
         typesToSpawn = availableAtTime.filter(type => seen.includes(type));
    } else {
        typesToSpawn = availableAtTime;
    }

    const typesToSpawnFinal = typesToSpawn.filter(type => seen.includes(type));

    if (devSettings.allowedEnemies.includes('all')) {
        return typesToSpawnFinal.filter(type => type !== 'wall'); 
    }
    return typesToSpawnFinal.filter(type => devSettings.allowedEnemies.includes(type) && type !== 'wall');
}

export function createEnemyInstance(type, x, y, hpScale, enemyIdCounter) { 
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

function spawnHorde(enemies, x, y, hpScale, enemyIdCounter) {
    const count = 4 + Math.floor(Math.random() * 3); 
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 20; 
        const hx = x + Math.cos(angle) * dist;
        const hy = y + Math.sin(angle) * dist;
        const newEnemy = createEnemyInstance('horde', hx, hy, hpScale, enemyIdCounter++);
        if (newEnemy) enemies.push(newEnemy);
    }
    return enemyIdCounter;
}

export function spawnEnemy(enemies, game, canvas, enemyIdCounter, camera) {
    let x, y;
    const margin = 100; 
    
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

    const availableTypes = getAvailableEnemyTypes(game);
    
    if (availableTypes.length === 0) {
        return enemyIdCounter; 
    }
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const hpScale = 1 + 0.10 * (game.level - 1) + game.time / 90; 

    if (type === 'horde') {
        enemyIdCounter = spawnHorde(enemies, x, y, hpScale, enemyIdCounter);
    } else {
        const newEnemy = createEnemyInstance(type, x, y, hpScale, enemyIdCounter++);
        if (newEnemy) enemies.push(newEnemy);
    }
    
    return enemyIdCounter;
}

export function spawnElite(enemies, game, canvas, enemyIdCounter, camera) {
    if (devSettings.allowedEnemies.length > 0 && !devSettings.allowedEnemies.includes('all') && !devSettings.allowedEnemies.includes('elite')) {
        return enemyIdCounter; 
    }

    let x, y;
    const margin = 150; 
    
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
    
    const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 1.5; 
    const newEnemy = createEnemyInstance('elite', x, y, hpScale, enemyIdCounter++);
    if (newEnemy) {
        enemies.push(newEnemy);
        playSound('EliteSpawn');
    }
    
    return enemyIdCounter;
}

export function addSiegeIndicators(state) {
    const { bombIndicators, player } = state;
    
    const count = SIEGE_EVENT_CONFIG.SIEGE_EVENT_COUNT;
    const radius = SIEGE_EVENT_CONFIG.SIEGE_EVENT_RADIUS;
    const maxLife = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;

    state.siegeSpawnQueue = []; 

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;
        
        state.siegeSpawnQueue.push({ x, y });

        bombIndicators.push({
            maxRadius: ENEMY_STATS.wall.size * 0.6, 
            x: x,
            y: y,
            life: 0,
            maxLife: maxLife,
            isSiege: true 
        });
    }
}

export function spawnWallEnemies(state) {
    const { enemies, game } = state;
    
    const spawnQueue = state.siegeSpawnQueue || []; 
    
    console.log(`[EVENT] Uruchamiam Wydarzenie Oblężenia! Spawnuję ${spawnQueue.length} wrogów 'wall'.`);

    for (let i = 0; i < spawnQueue.length; i++) {
        const { x, y } = spawnQueue[i];
        
        const hpScale = 1 + 0.10 * (game.level - 1) + game.time / 90; 
        
        const newEnemy = createEnemyInstance('wall', x, y, hpScale, state.enemyIdCounter++);
        if (newEnemy) {
            enemies.push(newEnemy);
        }
    }
    
    state.siegeSpawnQueue = []; 
    
    return state.enemyIdCounter;
}

export function spawnSiegeRing(state) {
    const { game } = state;
    
    addSiegeIndicators(state);
    
    if (!game.seenEnemyTypes.includes('wall')) {
        game.newEnemyWarningT = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;
        game.newEnemyWarningType = getLang('enemy_wall_name').toUpperCase(); 
        game.seenEnemyTypes.push('wall'); 
        playSound('EliteSpawn'); 
    }

    console.log('[EVENT] Wysłano ostrzeżenie o Oblężeniu.');
    
    return state.enemyIdCounter;
}

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

function spawnColorParticles(particlePool, x, y, color, count = 10, speed = 240, life = 0.4) {
    for (let k = 0; k < count; k++) {
        const p = particlePool.get();
        if (p) {
            p.init(
                x, y,
                (Math.random() - 0.5) * speed, 
                (Math.random() - 0.5) * speed, 
                life, 
                color, 
                0, 
                (1.0 - 0.98) 
            );
        }
    }
}

export function killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital = false, preventDrops = false) {
    
    let spawnKnockback = false;
    if (e.type === 'splitter' && !preventDrops) {
         spawnKnockback = true; 
    }
    
    if (!preventDrops) {
        game.score += e.stats.score;
        
        if (e.stats.xp > 0) {
            const gem = gemsPool.get();
            if (gem) {
                let val = e.stats.xp;
                let color = '#4FC3F7'; // Blue
                let size = 4;          // Standard size
                
                // FIX: Zróżnicowane rozmiary dla lepszych gemów
                if (Math.random() < 0.05) { 
                    val *= 5; 
                    color = '#81C784'; // Green
                    size = 6;          // Większy
                } 
                else if (Math.random() < 0.01) { 
                    val *= 20; 
                    color = '#E57373'; // Red
                    size = 8;          // Największy
                } 

                gem.init(
                    e.x + (Math.random() - 0.5) * 5,
                    e.y + (Math.random() - 0.5) * 5,
                    size, 
                    val,
                    color
                );
            }
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
        
        if (e.type === 'elite') {
            chests.push(new Chest(e.x, e.y));
        }
    }

    const particleCount = fromOrbital ? 3 : 8;
    for (let k = 0; k < particleCount; k++) {
        const p = particlePool.get();
        if (p) {
            const speed = (fromOrbital ? 2 : 4) * 60; 
            p.init(
                e.x, e.y,
                (Math.random() - 0.5) * speed, 
                (Math.random() - 0.5) * speed, 
                fromOrbital ? 0.16 : 0.5, 
                fromOrbital ? e.color : '#ff0000', 
                0, 
                (1.0 - 0.98) 
            );
        }
    }

    if (e.type === 'splitter') {
        const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 0.8; 
        
        const child1 = createEnemyInstance('horde', e.x - 5, e.y, hpScale, enemyIdCounter++);
        const child2 = createEnemyInstance('horde', e.x + 5, e.y, hpScale, enemyIdCounter++);
        
        if (spawnKnockback) {
            const color = ENEMY_STATS.splitter.color; 
            spawnColorParticles(particlePool, e.x, e.y, color, 15, 300, 0.5);
        }
        
        if (child1) {
            child1.speed *= 1.1; 
            enemies.push(child1);
            
            if (spawnKnockback) {
                const angle = Math.atan2(child1.y - e.y, child1.x - e.x) + (Math.random() * 0.5 - 0.25);
                child1.x += Math.cos(angle) * 15;
                child1.y += Math.sin(angle) * 15;
                child1.hitStun = 0.5; 
            }
        }
        if (child2) {
            child2.speed *= 1.1; 
            enemies.push(child2);
            
            if (spawnKnockback) {
                const angle = Math.atan2(child2.y - e.y, child2.x - e.x) + (Math.random() * 0.5 - 0.25);
                child2.x += Math.cos(angle) * 15;
                child2.y += Math.sin(angle) * 15;
                child2.hitStun = 0.5; 
            }
        }
    }
    
    if (e.type === 'elite' && preventDrops) { 
        const color = ENEMY_STATS.elite.color; 
        spawnColorParticles(particlePool, e.x, e.y, color, 20, 350, 0.6);
    }

    enemies.splice(idx, 1);
    return enemyIdCounter;
}