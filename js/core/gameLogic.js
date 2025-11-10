// ==============
// GAMELOGIC.JS (v0.77c - FIX: Uproszczenie logiki sprawdzania czasu Oblężenia)
// Lokalizacja: /js/core/gameLogic.js
// ==============

import { keys, jVec } from '../ui/input.js';
// POPRAWKA v0.75: Importujemy funkcję spawnWallEnemies i spawnSiegeRing
import { spawnEnemy, spawnElite, spawnSiegeRing, spawnWallEnemies } from '../managers/enemyManager.js'; 
import { spawnHazard } from '../managers/effects.js';
import { applyPickupSeparation, spawnConfetti } from './utils.js'; 
import { checkCollisions } from '../managers/collisions.js';
// POPRAWKA v0.68: Import HAZARD_CONFIG
import { HAZARD_CONFIG, SIEGE_EVENT_CONFIG } from '../config/gameData.js'; 

/**
 * Aktualizuje pozycję kamery, śledząc gracza i ograniczając ją do granic świata.
 */
export function updateCamera(player, camera, canvas) {
    // 1. Ograniczenie ruchu gracza do granic świata
    player.x = Math.max(player.size / 2, Math.min(camera.worldWidth - player.size / 2, player.x));
    player.y = Math.max(player.size / 2, Math.min(camera.worldHeight - player.size / 2, player.y));
    
    // 2. Wypośrodkowanie kamery na graczu (bez ograniczeń)
    let targetX = player.x - camera.viewWidth / 2;
    let targetY = player.y - camera.viewHeight / 2;
    
    // 3. Ograniczenie kamery do granic świata
    // Oś X
    targetX = Math.max(0, targetX); // Nie wyjeżdżaj na lewo
    targetX = Math.min(targetX, camera.worldWidth - camera.viewWidth); // Nie wyjeżdżaj na prawo
    // Oś Y
    targetY = Math.max(0, targetY); // Nie wyjeżdżaj na górę
    targetY = Math.min(targetY, camera.worldHeight - camera.viewHeight); // Nie wyjeżdżaj na dół

    // 4. Zastosowanie pozycji (Z KLUCZOWYM ZAOKRĄGLENIEM)
    camera.offsetX = Math.round(targetX);
    camera.offsetY = Math.round(targetY);
}

/**
 * Główna funkcja aktualizująca stan gry, wywoływana z pętli w main.js.
 * POPRAWKA v0.66: Dodano argument 'camera'.
 */
export function updateGame(state, dt, levelUpFn, openChestFn, camera) {
    const { 
        game, player, settings, canvas,
        enemies, eBullets, bullets, gems, pickups, stars, // 'bullets', 'eBullets', 'gems' to teraz 'activeItems'
        particles, hitTexts, chests, particlePool, hazards 
    } = state;

    // POPRAWKA v0.66: Przekazanie 'camera' do Player.update
    const playerMoved = player.update(dt, game, keys, jVec(), camera); 
    
    // POPRAWKA v0.66: Aktualizacja kamery
    updateCamera(player, camera, canvas);

    // POPRAWKA v0.62: Użyj puli cząsteczek do tworzenia śladów
    if (playerMoved && Math.random() < 0.15) {
        if (particlePool) {
            const particle = particlePool.get();
            if (particle) {
                // init(x, y, vx, vy, life, color, gravity, friction, size)
                particle.init(player.x, player.y, 0, 0, 0.25, player.color, 0, (1.0 - 0.95), 6); // 0.25s życia
            }
        }
    }

    if (game.magnet) { game.magnetT -= dt; if (game.magnetT <= 0) game.magnet = false; }
    if (game.shield) { game.shieldT -= dt; if (game.shieldT <= 0) game.shield = false; }
    if (game.speedT > 0) game.speedT -= dt;
    if (game.freezeT > 0) game.freezeT -= dt;

    // --- Timery Wrogów ---
    for (let i = enemies.length - 1; i >= 0; i--) { // Pętla wsteczna dla usuwania wrogów
        const e = enemies[i];
        if (e.hazardSlowdownT > 0) { // POPRAWKA v0.68a: Dekrementacja timera spowolnienia Hazardu
            e.hazardSlowdownT -= dt;
        }

        // NOWA LOGIKA v0.75: Usuwanie Oblężników po autodestrukcji
        if (e.type === 'wall' && e.isAutoDead) {
            enemies.splice(i, 1);
            continue;
        }
    }
    
    // --- Logika Spawnu Hazardów ---
    const timeSinceLastHazard = game.time - settings.lastHazardSpawn;
    if (timeSinceLastHazard > HAZARD_CONFIG.SPAWN_INTERVAL) {
        spawnHazard(hazards, player, camera);
        settings.lastHazardSpawn = game.time;
    }

    // --- Logika Spawnu (Standard) ---
    const spawnRate = settings.spawn * (game.hyper ? 1.25 : 1) * (1 + 0.15 * (game.level - 1)) * (1 + game.time / 60);
    if (Math.random() < spawnRate && enemies.length < settings.maxEnemies && !(settings.siegeWarningT > 0)) { // Zablokuj spawny, gdy timer ostrzeżenia jest AKTYWNY
        state.enemyIdCounter = spawnEnemy(enemies, game, canvas, state.enemyIdCounter, camera);
    }

    // --- Logika Spawnu (Elita) ---
    const timeSinceLastElite = game.time - settings.lastElite;
    if (timeSinceLastElite > (settings.eliteInterval / 1000) / (game.hyper ? 1.15 : 1) && !(settings.siegeWarningT > 0)) { // Zablokuj spawny, gdy timer ostrzeżenia jest AKTYWNY
        state.enemyIdCounter = spawnElite(enemies, game, canvas, state.enemyIdCounter, camera);
        settings.lastElite = game.time;
    }
    
    // --- POPRAWKA v0.77c: Uproszczona logika spawnu Oblężenia ---
    
    // 1. Sprawdź, czy należy rozpocząć OSTRZEŻENIE
    // 'currentSiegeInterval' to teraz absolutny czas gry, o którym ma się zacząć następne oblężenie.
    if (game.time >= settings.currentSiegeInterval && 
        (settings.siegeWarningT === undefined || settings.siegeWarningT <= 0) // Upewnij się, że nie jest już aktywne
    ) {
        // Ustaw timer ostrzeżenia
        settings.siegeWarningT = SIEGE_EVENT_CONFIG.SIEGE_WARNING_TIME;
        // Spawnowanie wskaźników
        state.enemyIdCounter = spawnSiegeRing(state); 
        settings.lastSiegeEvent = game.time;
        
        // Ustaw NOWY losowy interwał (względny do obecnego czasu)
        const min = SIEGE_EVENT_CONFIG.SIEGE_EVENT_INTERVAL_MIN;
        const max = SIEGE_EVENT_CONFIG.SIEGE_EVENT_INTERVAL_MAX;
        const nextInterval = min + Math.random() * (max - min);
        settings.currentSiegeInterval = game.time + nextInterval; // Ustaw absolutny czas następnego spawnu
        
        console.log(`[EVENT] Oblężenie aktywowane! Następne oblężenie za ${nextInterval.toFixed(1)}s (o ${settings.currentSiegeInterval.toFixed(1)}s)`);
    }

    // 2. Obsłuż timer OSTRZEŻENIA i SPRAWN
    if (settings.siegeWarningT > 0) {
        settings.siegeWarningT -= dt;
        
        if (settings.siegeWarningT <= 0) {
            // Timer minął, spawnuj wrogów 'wall'
            state.enemyIdCounter = spawnWallEnemies(state); 
            // Reset timera po użyciu
            settings.siegeWarningT = 0;
        }
    }


    // --- Pętle Aktualizacji (Update Loops) ---

    // Aktualizuj wrogów (nadal zwykła tablica)
    for (const e of enemies) {
        e.update(dt, player, game, state); 
        e.applySeparation(dt, enemies);
    }
    
    // Aktualizuj pociski gracza (z puli)
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt);
    }
    // Aktualizuj pociski wrogów (z puli)
    for (let i = eBullets.length - 1; i >= 0; i--) {
        eBullets[i].update(dt);
    }
    // Aktualizuj gemy (z puli)
    for (let i = gems.length - 1; i >= 0; i--) {
        gems[i].update(player, game, dt);
    }
    // POPRAWKA v0.62: Aktualizuj cząsteczki (z puli)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
    }
    // POPRAWKA v0.62: Aktualizuj teksty obrażeń (z puli)
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        hitTexts[i].update(dt);
    }

    // POPRAWKA v0.68: Aktualizuj Hazardy (nadal zwykła tablica)
    for (let i = hazards.length - 1; i >= 0; i--) { // POPRAWKA v0.68a: Zmieniono na pętlę wsteczną
        const h = hazards[i];
        h.update(dt);
        if (h.isDead()) { // POPRAWKA v0.68a: Sprawdzenie Decay
            hazards.splice(i, 1);
        }
    }

    if (game.xp >= game.xpNeeded) {
        levelUpFn(); 
    }

    // Aktualizuj pickupy (nadal zwykła tablica)
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.update(dt);
        if (p.isDead()) {
            pickups.splice(i, 1);
        }
    }
    
    // Aktualizuj skrzynie (nadal zwykła tablica)
    for (const c of chests) {
        c.update(dt);
    }

    applyPickupSeparation(pickups, canvas);

    // Aktualizuj gwiazdy (nadal zwykła tablica)
    for (let i = 0; i < stars.length; i++) { stars[i].t = (stars[i].t || 0) + dt; }

    state.dt = dt; 
    for (const w of player.weapons) {
        w.update(state);
    }

    checkCollisions(state); // Sprawdź kolizje dla wszystkich

    if (game.triggerChestOpen) {
        game.triggerChestOpen = false; 
        openChestFn(); 
        spawnConfetti(state.particlePool, player.x, player.y);
    }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77c] js/core/gameLogic.js: Uproszczono logikę spawnu Oblężenia (tylko 1 warunek czasowy).');