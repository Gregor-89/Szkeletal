// ==============
// MAPMANAGER.JS (v0.97k - Spawning Shrine)
// Lokalizacja: /js/managers/mapManager.js
// ==============

import { Obstacle } from '../entities/obstacle.js';
import { MAP_CONFIG, WORLD_CONFIG } from '../config/gameData.js';

export function generateMap(obstacles, player) {
  obstacles.length = 0;
  
  console.log('[MapManager] Generowanie proceduralnej mapy...');
  
  // FIX v0.97k: Nowy rozmiar (24)
  const worldWidth = 800 * WORLD_CONFIG.SIZE;
  const worldHeight = 600 * WORLD_CONFIG.SIZE;
  
  const safeX = player.x;
  const safeY = player.y;
  const safeR = MAP_CONFIG.SAFE_ZONE_RADIUS;
  
  const spawnObjects = (count, typeKey) => {
    const stats = MAP_CONFIG.OBSTACLE_STATS[typeKey];
    if (!stats) return;
    
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 20;
    
    const maxPossibleScale = stats.maxScale || 1.0;
    const maxPossibleRadius = (stats.size * maxPossibleScale) / 2;
    
    while (placed < count && attempts < maxAttempts) {
      attempts++;
      
      const margin = 100;
      const x = margin + Math.random() * (worldWidth - 2 * margin);
      const y = margin + Math.random() * (worldHeight - 2 * margin);
      
      const distToPlayer = Math.hypot(x - safeX, y - safeY);
      if (distToPlayer < safeR) continue;
      
      let overlap = false;
      for (const other of obstacles) {
        const dist = Math.hypot(x - other.x, y - other.y);
        const minSeparation = maxPossibleRadius + (other.size / 2) + 20;
        
        if (dist < minSeparation) {
          overlap = true;
          break;
        }
      }
      
      if (!overlap) {
        obstacles.push(new Obstacle(x, y, stats));
        placed++;
      }
    }
    console.log(`[MapManager] Wygenerowano ${placed}/${count} obiektów typu: ${typeKey}`);
  };
  
  spawnObjects(MAP_CONFIG.WATER_COUNT, 'water');
  spawnObjects(MAP_CONFIG.HUTS_COUNT, 'hut');
  spawnObjects(MAP_CONFIG.ROCKS_COUNT, 'rock');
  spawnObjects(MAP_CONFIG.TREES_COUNT, 'tree');
  
  // FIX v0.97k: Spawn Kapliczki
  spawnObjects(MAP_CONFIG.SHRINE_COUNT, 'shrine');
}