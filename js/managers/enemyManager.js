// ==============
// ENEMYMANAGER.JS (v1.07 - Stats Tracking & Full Code)
// Lokalizacja: /js/managers/enemyManager.js
// ==============

import { devSettings } from '../services/dev.js';
import { findFreeSpotForPickup, addBombIndicator } from '../core/utils.js'; 
import { playSound } from '../services/audio.js';
import { getLang } from '../services/i18n.js';
import { hpScale } from '../core/utils.js'; // Dodano import hpScale z utils, jeśli tam jest, lub zdefiniuj lokalnie

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
import { LumberjackEnemy } from '../entities/enemies/lumberjackEnemy.js'; 
import { SnakeEaterEnemy } from '../entities/enemies/snakeEaterEnemy.js';

import { ENEMY_STATS, SIEGE_EVENT_CONFIG, WALL_DETONATION_CONFIG, GAME_CONFIG } from '../config/gameData.js';

import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';

import { Chest } from '../entities/chest.js';
import { LeaderboardService } from '../services/leaderboard.js'; // IMPORT NOWY

export const ENEMY_CLASS_MAP = {
    standard: StandardEnemy,
    horde: HordeEnemy,
    aggressive: AggressiveEnemy,
    kamikaze: KamikazeEnemy,
    splitter: SplitterEnemy,
    tank: TankEnemy,
    ranged: RangedEnemy,
    elite: EliteEnemy,
    wall: WallEnemy,
    lumberjack: LumberjackEnemy,
    snakeEater: SnakeEaterEnemy
};

const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

const BOSS_TYPES = ['elite', 'lumberjack', 'snakeEater'];

export function getAvailableEnemyTypes(game) {
    const t = game.time;
    const seen = game.seenEnemyTypes; 

    const availableAtTime = [
        t > 0 ? 'standard' : null,
        t > 36 ? 'horde' : null,
        t > 72 ? 'aggressive' : null,
        t > 108 ? 'kamikaze' : null,
        t > 144 ? 'splitter' : null,
        t > 216 ? 'tank' : null,
        t > 240 ? 'snakeEater' : null,
        t > 252 ? 'ranged' : null
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
    const availableTypes = getAvailableEnemyTypes(game);
    
    if (availableTypes.length === 0) {
        return enemyIdCounter; 
    }
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    if (BOSS_TYPES.includes(type)) {
        const alreadyExists = enemies.some(e => e.type === type);
        if (alreadyExists) {
            return enemyIdCounter; 
        }
    }

    let x, y;
    const margin = 100; 
    const viewLeft = camera.offsetX;
    const viewRight = camera.offsetX + camera.viewWidth;
    const viewTop = camera.offsetY;
    const viewBottom = camera.offsetY + camera.viewHeight;
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;

    const edge = Math.random();
    if (edge < 0.25) { x = viewLeft + Math.random() * camera.viewWidth; y = viewTop - margin; }
    else if (edge < 0.5) { x = viewLeft + Math.random() * camera.viewWidth; y = viewBottom + margin; }
    else if (edge < 0.75) { x = viewLeft - margin; y = viewTop + Math.random() * camera.viewHeight; }
    else { x = viewRight + margin; y = viewTop + Math.random() * camera.viewHeight; }

    x = Math.max(0, Math.min(worldWidth, x));
    y = Math.max(0, Math.min(worldHeight, y));

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
    let bossType = null;

    if (devSettings.allowedEnemies.length === 1) {
        const forcedType = devSettings.allowedEnemies[0];
        if (BOSS_TYPES.includes(forcedType)) {
            const alreadyExists = enemies.some(e => e.type === forcedType);
            if (alreadyExists) return enemyIdCounter;
            
            bossType = forcedType;
        }
    }

    if (!bossType) {
        if (devSettings.allowedEnemies.length > 0 && !devSettings.allowedEnemies.includes('all')) {
            const allowedBosses = BOSS_TYPES.filter(t => devSettings.allowedEnemies.includes(t));
            if (allowedBosses.length === 0) return enemyIdCounter;
        }

        const activeBossTypes = enemies
            .filter(e => BOSS_TYPES.includes(e.type))
            .map(e => e.type);
            
        const availableBosses = BOSS_TYPES.filter(type => !activeBossTypes.includes(type));
        
        if (availableBosses.length === 0) return enemyIdCounter;
        
        bossType = availableBosses[Math.floor(Math.random() * availableBosses.length)];
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
    if (edge < 0.25) { x = viewLeft + Math.random() * camera.viewWidth; y = viewTop - margin; }
    else if (edge < 0.5) { x = viewLeft + Math.random() * camera.viewWidth; y = viewBottom + margin; }
    else if (edge < 0.75) { x = viewLeft - margin; y = viewTop + Math.random() * camera.viewHeight; }
    else { x = viewRight + margin; y = viewTop + Math.random() * camera.viewHeight; }

    x = Math.max(0, Math.min(worldWidth, x));
    y = Math.max(0, Math.min(worldHeight, y));
    
    const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 1.5; 
    
    const newEnemy = createEnemyInstance(bossType, x, y, hpScale, enemyIdCounter++);
    if (newEnemy) {
        enemies.push(newEnemy);
        playSound('EliteSpawn');
        console.log(`[BOSS] Zespawnowano: ${bossType.toUpperCase()}`);
        
        if (bossType === 'snakeEater') {
            game.newEnemyWarningT = 3.0; 
            game.newEnemyWarningType = getLang('enemy_snakeEater_name').toUpperCase();
        }
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
    if (e.dying && e.deathTimer < e.deathDuration) return enemyIdCounter;

    let spawnKnockback = false;
    if (e.type === 'splitter' && !preventDrops) {
         spawnKnockback = true; 
    }
    
    if (!preventDrops) {
        game.score += e.stats.score;
        game.totalKills = (game.totalKills || 0) + 1;
        
        // NOWOŚĆ: Śledzenie statystyk zabójstw w Talo
        // Wywołujemy trackStat dla ogólnej liczby i dla typu wroga
        LeaderboardService.trackStat('enemies_killed', 1);
        if (e.type) {
            LeaderboardService.trackStat(`killed_${e.type}`, 1);
        }

        if (e.stats.xp > 0) {
            const gem = gemsPool.get();
            if (gem) {
                let val = e.stats.xp;
                let color = '#4FC3F7'; 
                let size = 4;          
                if (Math.random() < 0.015) { val *= 5; color = '#81C784'; size = 6; } 
                else if (Math.random() < 0.001) { val *= 20; color = '#E57373'; size = 8; } 
                gem.init(e.x + (Math.random() - 0.5) * 5, e.y + (Math.random() - 0.5) * 5, size, val, color);
            }
        }

        if (e.type !== 'elite' && e.type !== 'lumberjack' && e.type !== 'snakeEater') {
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
        
        if (e.type === 'elite' || e.type === 'lumberjack' || e.type === 'snakeEater') {
            chests.push(new Chest(e.x, e.y));
        }
        
        // Dynamiczny wzrost limitu wrogów
        settings.maxEnemies = Math.min(1500, settings.maxEnemies + 0.1); 
    }

    const particleCount = 40; 
    const explosionSpeed = 500; 
    for (let k = 0; k < particleCount; k++) {
        const p = particlePool.get();
        if (p) {
            const chunkSize = 4 + Math.random() * 4; 
            p.init(e.x, e.y, (Math.random() - 0.5) * explosionSpeed, (Math.random() - 0.5) * explosionSpeed, 0.4 + Math.random() * 0.3, e.color, 0, 0.95, chunkSize);
        }
    }

    if (e.type === 'splitter') {
        const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 0.8; 
        const child1 = createEnemyInstance('horde', e.x - 5, e.y, hpScale, enemyIdCounter++);
        const child2 = createEnemyInstance('horde', e.x + 5, e.y, hpScale, enemyIdCounter++);
        
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
    
    if ((e.type === 'elite' || e.type === 'lumberjack' || e.type === 'snakeEater') && preventDrops) { 
        const color = ENEMY_STATS[e.type].color; 
        spawnColorParticles(particlePool, e.x, e.y, color, 20, 350, 0.6);
    }

    enemies.splice(idx, 1);
    return enemyIdCounter;
}