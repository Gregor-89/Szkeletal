// ==============
// MAPMANAGER.JS (v0.99 - Full World Distribution)
// Lokalizacja: /js/managers/mapManager.js
// ==============

import { Obstacle } from '../entities/obstacle.js';
import { MAP_CONFIG, WORLD_CONFIG } from '../config/gameData.js';

/**
 * Generuje przeszkody rozrzucone po całym świecie gry.
 * @param {Array} obstacles - Lista obiektów mapy.
 * @param {Object} player - Gracz dla strefy bezpiecznej.
 * @param {number} worldWidth - Szerokość świata gry.
 * @param {number} worldHeight - Wysokość świata gry.
 */
export function generateMap(obstacles, player, worldWidth, worldHeight) {
  obstacles.length = 0;
  
  // FIX: Używamy przekazanych wymiarów świata (z main.js)
  const w = worldWidth || (800 * WORLD_CONFIG.SIZE);
  const h = worldHeight || (600 * WORLD_CONFIG.SIZE);
  
  console.log(`[MapManager] Generowanie mapy dla świata o wymiarach: ${Math.round(w)}x${Math.round(h)}...`);
  
  const safeX = player.x;
  const safeY = player.y;
  const safeR = MAP_CONFIG.SAFE_ZONE_RADIUS;
  
  const spawnObjects = (count, typeKey) => {
    const stats = MAP_CONFIG.OBSTACLE_STATS[typeKey];
    if (!stats) return;
    
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 60; // Zwiększona liczba prób dla ogromnej mapy
    
    const maxPossibleScale = stats.maxScale || 1.0;
    const maxPossibleRadius = (stats.size * maxPossibleScale) / 2;
    
    while (placed < count && attempts < maxAttempts) {
      attempts++;
      
      // FIX: Losowanie współrzędnych z pełnego zakresu mapy
      const margin = 200;
      const x = margin + Math.random() * (w - 2 * margin);
      const y = margin + Math.random() * (h - 2 * margin);
      
      const distToPlayer = Math.hypot(x - safeX, y - safeY);
      if (distToPlayer < safeR) continue;
      
      let overlap = false;
      for (const other of obstacles) {
        const distSq = (x - other.x) ** 2 + (y - other.y) ** 2;
        const minSeparation = maxPossibleRadius + (other.hitboxRadius || 20) + 50;
        
        if (distSq < minSeparation * minSeparation) {
          overlap = true;
          break;
        }
      }
      
      if (!overlap) {
        obstacles.push(new Obstacle(x, y, stats));
        placed++;
      }
    }
    console.log(`[MapManager] Rozmieszczono ${placed}/${count} obiektów '${typeKey}'.`);
  };
  
  // Spawning (kolejność: największe -> najmniejsze)
  spawnObjects(MAP_CONFIG.WATER_COUNT, 'water');
  spawnObjects(MAP_CONFIG.HUTS_COUNT, 'hut');
  spawnObjects(MAP_CONFIG.ROCKS_COUNT, 'rock');
  spawnObjects(MAP_CONFIG.TREES_COUNT, 'tree');
  spawnObjects(MAP_CONFIG.SHRINE_COUNT, 'shrine');
}