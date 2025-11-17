// ==============
// ENEMYMANAGER.JS (v0.90 - Implementacja i18n)
// Lokalizacja: /js/managers/enemyManager.js
// ==============

import { devSettings } from '../services/dev.js';
// POPRAWKA v0.75: Import addBombIndicator dla sygnału Oblężenia
import { findFreeSpotForPickup, addBombIndicator } from '../core/utils.js';
// POPRAWKA v0.86d: Poprawiona ścieżka importu Audio (było ../../services/audio.js)
import { playSound } from '../services/audio.js';
// NOWY IMPORT v0.90: Silnik i18n
import { getLang } from '../services/i18n.js';

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
// POPRAWKA v0.77: Import również WALL_DETONATION_CONFIG (dla obrażeń)
import { ENEMY_STATS, SIEGE_EVENT_CONFIG, WALL_DETONATION_CONFIG } from '../config/gameData.js';

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
 * Zwraca listę typów wrogów dozwolonych na podstawie czasu gry i ustawień dev,
 * jednocześnie aktywując ostrzeżenie o nowym typie wroga.
 *
 * ZMIANA V0.86: Ta funkcja teraz zwraca TYLKO wrogów, których gracz już spotkał.
 * Nowo dostępni wrogowie są umieszczani w game.newEnemyWarning, aby aktywować ostrzeżenie.
 */
export function getAvailableEnemyTypes(game) {
    const t = game.time;
    // Pamiętaj o wrogach, których gracz już spotkał
    const seen = game.seenEnemyTypes; 

    // Wrogowie dostępni w tej chwili gry (włączając Oblężnika, jeśli czas pozwala)
    // ZMIANA V0.87G: Przesunięto Tank (150->180) i Ranged (180->210)
    const availableAtTime = [
        t > 0 ? 'standard' : null,
        t > 30 ? 'horde' : null,
        t > 60 ? 'aggressive' : null,
        t > 90 ? 'kamikaze' : null,
        t > 120 ? 'splitter' : null,
        t > 180 ? 'tank' : null,    // ZMIENIONO (było 150)
        t > 210 ? 'ranged' : null   // ZMIENIONO (było 180)
        // Elite jest spawnowany osobno
    ].filter(type => type !== null);

    let typesToSpawn = [];
    let newEnemyType = null;
    let newEnemyTime = Infinity;

    for (const type of availableAtTime) {
        if (!seen.includes(type)) {
            // Znalazłem nowego wroga
            newEnemyType = type;
            
            // Określamy czas, w którym się pojawi (dla logowania)
            // ZMIANA V0.87G: Aktualizacja czasów
            if (type === 'horde') newEnemyTime = 30;
            else if (type === 'aggressive') newEnemyTime = 60;
            else if (type === 'kamikaze') newEnemyTime = 90;
            else if (type === 'splitter') newEnemyTime = 120;
            else if (type === 'tank') newEnemyTime = 180; // ZMIENIONO
            else if (type === 'ranged') newEnemyTime = 210; // ZMIENIONO
            
            break; // Ostrzegamy tylko o pierwszym nowym
        }
    }
    
    // --- Logika Ostrzeżenia ---
    if (newEnemyType && game.newEnemyWarningT <= 0) {
        // Aktywuj timer ostrzegawczy, blokując normalne spawny na 3s
        game.newEnemyWarningT = 3.0;
        // ZMIANA v0.90: Użyj i18n
        game.newEnemyWarningType = getLang(`enemy_${newEnemyType}_name`).toUpperCase();
        game.seenEnemyTypes.push(newEnemyType); // Oznacz jako widziane od razu
        playSound('EliteSpawn'); // Użyjemy dźwięku Elity jako ogólnego alarmu
        console.log(`[ENEMY-WARN] Aktywowano ostrzeżenie: ${newEnemyType} (o ${newEnemyTime}s).`);
        // Zwracamy listę TYLKO WROGÓW, których już widziano.
        typesToSpawn = availableAtTime.filter(type => seen.includes(type));
    } else if (newEnemyType && game.newEnemyWarningT > 0) {
         // Ostrzeżenie jest AKTYWNE, blokujemy nowy spawn.
         typesToSpawn = availableAtTime.filter(type => seen.includes(type));
    } else {
        // Nowych wrogów nie ma lub ostrzeżenie minęło
        typesToSpawn = availableAtTime;
    }

    // Dodajemy wrogów, których gracz już spotkał, do listy do spawnienia
    const typesToSpawnFinal = typesToSpawn.filter(type => seen.includes(type));

    // --- Dev Settings Filter ---
    if (devSettings.allowedEnemies.includes('all')) {
        // Użyj listy wszystkich dostępnych typów (włączając 'wall')
        return typesToSpawnFinal.filter(type => type !== 'wall'); 
    }
    return typesToSpawnFinal.filter(type => devSettings.allowedEnemies.includes(type) && type !== 'wall');
}

/**
 * Tworzy instancję wroga na podstawie typu.
 */
export function createEnemyInstance(type, x, y, hpScale, enemyIdCounter) { // DODANO EXPORT
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
    const hpScale = 1 + 0.10 * (game.level - 1) + game.time / 90; // Użycie 10% (z utils.js)

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
    
    const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 1.5; // Elity mają +50% HP (Użycie 10%)
    const newEnemy = createEnemyInstance('elite', x, y, hpScale, enemyIdCounter++);
    if (newEnemy) {
        enemies.push(newEnemy);
        // POPRAWKA v0.77n: Dodano dźwięk spawnu Elity
        playSound('EliteSpawn');
    }
    
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
        
        const hpScale = 1 + 0.10 * (game.level - 1) + game.time / 90; // Użycie 10%
        
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
 * ZMIANA v0.87h: Aktywuje również globalne ostrzeżenie tekstowe.
 */
export function spawnSiegeRing(state) {
    const { game } = state;
    
    // 1. Dodaj wskaźniki (ostrzeżenie na ziemi)
    addSiegeIndicators(state);
    
    // 2. NOWA LOGIKA (v0.87h): Aktywuj ostrzeżenie tekstowe, jeśli to pierwszy raz
    if (!game.seenEnemyTypes.includes('wall')) {
        game.newEnemyWarningT = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;
        // ZMIANA v0.90: Użyj i18n
        game.newEnemyWarningType = getLang('enemy_wall_name').toUpperCase(); // "SYNDROM OBLĘŻENIA"
        game.seenEnemyTypes.push('wall'); // Oznacz jako widziane, aby nie powtarzać
        playSound('EliteSpawn'); // Odtwórz dźwięk alarmu (ten sam co dla Elity)
    }

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

// Funkcja pomocnicza do tworzenia cząsteczek przy spawnach
function spawnColorParticles(particlePool, x, y, color, count = 10, speed = 240, life = 0.4) {
    for (let k = 0; k < count; k++) {
        const p = particlePool.get();
        if (p) {
            p.init(
                x, y,
                (Math.random() - 0.5) * speed, // vx (px/s)
                (Math.random() - 0.5) * speed, // vy (px/s)
                life, // life
                color, // color
                0, // gravity
                (1.0 - 0.98) // friction
            );
        }
    }
}


/**
 * Logika zabicia wroga (wywoływana z kolizji)
 */
export function killEnemy(idx, e, game, settings, enemies, particlePool, gemsPool, pickups, enemyIdCounter, chests, fromOrbital = false, preventDrops = false) {
    
    // NOWA LOGIKA V0.83: Wprowadzenie logiki odrzutu dla dzieci Splittera
    let spawnKnockback = false;
    if (e.type === 'splitter' && !preventDrops) {
         // Oznacz flagę (dla późniejszego użycia), ale nie usuwaj wroga, dopóki reszta killEnemy się nie wykona.
         spawnKnockback = true; 
    }
    // Koniec NOWEJ LOGIKI
    
    // POPRAWKA v0.77: Logika dropu i wyniku jest teraz warunkowa
    if (!preventDrops) {
        game.score += e.stats.score;
        
        // POPRAWKA v0.77w: Sprawdź, czy XP > 0, zanim stworzysz gema
        if (e.stats.xp > 0) {
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
    // Koniec bloku if(!preventDrops)

    // Efekty cząsteczkowe (zawsze występują)
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

    // Specjalna logika (zawsze występuje)
    if (e.type === 'splitter') {
        const hpScale = (1 + 0.10 * (game.level - 1) + game.time / 90) * 0.8; // Użycie 10%
        
        const child1 = createEnemyInstance('horde', e.x - 5, e.y, hpScale, enemyIdCounter++);
        const child2 = createEnemyInstance('horde', e.x + 5, e.y, hpScale, enemyIdCounter++);
        
        // NOWA LOGIKA V0.83V: Dodaj efekty wizualne
        if (spawnKnockback) {
            const color = ENEMY_STATS.splitter.color; // Różowy Splitter
            spawnColorParticles(particlePool, e.x, e.y, color, 15, 300, 0.5);
        }
        
        if (child1) {
            child1.speed *= 1.1; 
            enemies.push(child1);
            
            // NOWA LOGIKA V0.83: Odrzut i hitStun dla dzieci Splittera
            if (spawnKnockback) {
                // Siła odrzutu od centrum (e.x, e.y)
                const angle = Math.atan2(child1.y - e.y, child1.x - e.x) + (Math.random() * 0.5 - 0.25);
                child1.x += Math.cos(angle) * 15;
                child1.y += Math.sin(angle) * 15;
                child1.hitStun = 0.5; // Nietykalność na 0.5s
            }
        }
        if (child2) {
            child2.speed *= 1.1; 
            enemies.push(child2);
             // NOWA LOGIKA V0.83: Odrzut i hitStun dla dzieci Splittera
            if (spawnKnockback) {
                const angle = Math.atan2(child2.y - e.y, child2.x - e.x) + (Math.random() * 0.5 - 0.25);
                child2.x += Math.cos(angle) * 15;
                child2.y += Math.sin(angle) * 15;
                child2.hitStun = 0.5; // Nietykalność na 0.5s
            }
        }
    }
    
    // NOWA LOGIKA V0.83V: Efekty wizualne dla minionów Elity
    if (e.type === 'elite' && preventDrops) { // preventDrops jest true tylko jeśli killEnemy jest wywołane przez spawnMinions() Elity
        const color = ENEMY_STATS.elite.color; // Fioletowy Elita
        spawnColorParticles(particlePool, e.x, e.y, color, 20, 350, 0.6);
    }


    enemies.splice(idx, 1);
    return enemyIdCounter;
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.83a] js/managers/enemyManager.js: Opóźniono spawn agresywnych wrogów (z 15/30/50/70/90/120s na 30/60/90/120/150/180s) i dodano odrzut dla dzieci Splittera.');