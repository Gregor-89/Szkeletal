// ==============
// MAPMANAGER.JS (v1.01 - Spatial Hash & Fix)
// Lokalizacja: /js/managers/mapManager.js
// ==============

import { Obstacle } from '../entities/obstacle.js';
import { MAP_CONFIG, WORLD_CONFIG } from '../config/gameData.js';

/**
 * Generuje przeszkody używając Spatial Hash do szybkiej detekcji kolizji.
 * Rozwiązuje problem wydajności (O(N) zamiast O(N^2)) oraz problem "pustych pól"
 * przez wydajniejsze próbkowanie.
 */
export function generateMap(obstacles, player, worldWidth, worldHeight) {
  obstacles.length = 0;

  const w = worldWidth || (800 * WORLD_CONFIG.SIZE);
  const h = worldHeight || (600 * WORLD_CONFIG.SIZE);

  console.log(`[MapManager] Generowanie mapy (SpatialHash) dla świata: ${Math.round(w)}x${Math.round(h)}...`);

  const safeX = player.x;
  const safeY = player.y;
  const safeR = MAP_CONFIG.SAFE_ZONE_RADIUS;

  // Spatial Hash Grid
  const CELL_SIZE = 400; // Rozmiar komórki siatki (większy niż największy obiekt)
  const grid = new Map();

  const addToGrid = (obs) => {
    const cx = Math.floor(obs.x / CELL_SIZE);
    const cy = Math.floor(obs.y / CELL_SIZE);
    const key = `${cx},${cy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(obs);
  };

  /* FIX ETAP 5: Ulepszona kolizja z dystansem dla konkretnych typów (np. Kapliczki) */
  const checkCollisionFast = (x, y, radius, typeToAvoid = null, minTypeDist = 0) => {
    const cx = Math.floor(x / CELL_SIZE);
    const cy = Math.floor(y / CELL_SIZE);

    // Sprawdzamy komórkę + sąsiadów
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cell = grid.get(key);
        if (cell) {
          for (const other of cell) {
            const distSq = (x - other.x) ** 2 + (y - other.y) ** 2;

            // Specjalny warunek dla tego samego typu (np. shrine vs shrine)
            if (typeToAvoid && other.type === typeToAvoid) {
              if (distSq < minTypeDist * minTypeDist) return true;
            }

            const minSeparation = radius + (other.hitboxRadius || 20) + 20; // +20 margines standardowy
            if (distSq < minSeparation * minSeparation) {
              return true; // Kolizja fizyczna
            }
          }
        }
      }
    }
    return false;
  };

  const spawnObjects = (baseCount, typeKey, forcedMinDistance = 0) => {
    const stats = MAP_CONFIG.OBSTACLE_STATS[typeKey];
    if (!stats) return;

    // Skalowanie: Używamy liniowego skalowania względem rozmiaru świata, ale bez absurdu.
    // Base counts w gameData.js są już spore (np. 1200 drzew).
    // Jeśli świat jest 24x większy liniowo (576x powierzchniowo), to 1200 drzew to wciąż mało.
    // Ale 700k drzew (1200*576) zabije przeglądarkę pamięciowo.
    // FIX: Skalowanie wyłączone na życzenie użytkownika ("ma być jak dawniej")
    const densityMultiplier = 1.0;
    const targetCount = Math.floor(baseCount * densityMultiplier);

    let placed = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 20; // Mniej prób per obiekt, bo SpatialHash jest szybki

    const maxGenericRadius = (stats.size * (stats.maxScale || 1.0)) / 2;

    while (placed < targetCount && attempts < maxAttempts) {
      attempts++;

      const margin = 50;
      const x = margin + Math.random() * (w - 2 * margin);
      const y = margin + Math.random() * (h - 2 * margin);

      // Strefa bezpieczna gracza
      const distToPlayerSq = (x - safeX) ** 2 + (y - safeY) ** 2;
      if (distToPlayerSq < safeR * safeR) continue;

      // Przekazujemy typ i wymagany dystans, jeśli to 'shrine'
      if (!checkCollisionFast(x, y, maxGenericRadius, forcedMinDistance > 0 ? typeKey : null, forcedMinDistance)) {
        const obs = new Obstacle(x, y, stats);
        // Nadpisujemy typ dla pewności (zostanie użyty w kolizjach)
        obs.type = typeKey;
        obstacles.push(obs);
        addToGrid(obs);
        placed++;
      }
    }
    console.log(`[MapManager] Rozmieszczono ${placed}/${targetCount} obiektów '${typeKey}'.`);
  };

  // Kolejność spawnu
  spawnObjects(MAP_CONFIG.WATER_COUNT, 'water');
  spawnObjects(MAP_CONFIG.HUTS_COUNT, 'hut');
  spawnObjects(MAP_CONFIG.TREES_COUNT, 'tree');
  spawnObjects(MAP_CONFIG.ROCKS_COUNT, 'rock');
  // FIX: Kapliczki rozmieszczone z dużą separacją (np. 1500px)
  spawnObjects(MAP_CONFIG.SHRINE_COUNT, 'shrine', 1500);
}