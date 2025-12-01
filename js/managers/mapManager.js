// ==============
// MAPMANAGER.JS (v0.97 - Map Generator)
// Lokalizacja: /js/managers/mapManager.js
// ==============

import { Obstacle } from '../entities/obstacle.js';
import { MAP_CONFIG, WORLD_CONFIG } from '../config/gameData.js';

export function generateMap(obstacles, player) {
  obstacles.length = 0; // Wyczyść stare przeszkody
  
  console.log('[MapManager] Generowanie proceduralnej mapy...');
  
  // Używamy zaktualizowanego WORLD_CONFIG.SIZE (teraz 16)
  const worldWidth = 800 * WORLD_CONFIG.SIZE;
  const worldHeight = 600 * WORLD_CONFIG.SIZE;
  
  const safeX = player.x;
  const safeY = player.y;
  const safeR = MAP_CONFIG.SAFE_ZONE_RADIUS;
  
  // Funkcja pomocnicza do stawiania obiektu
  const spawnObjects = (count, typeKey) => {
    const stats = MAP_CONFIG.OBSTACLE_STATS[typeKey];
    if (!stats) return;
    
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 20;
    
    while (placed < count && attempts < maxAttempts) {
      attempts++;
      
      const margin = 100;
      const x = margin + Math.random() * (worldWidth - 2 * margin);
      const y = margin + Math.random() * (worldHeight - 2 * margin);
      
      // Sprawdź czy nie jest na graczu (Safe Zone)
      const distToPlayer = Math.hypot(x - safeX, y - safeY);
      if (distToPlayer < safeR) continue;
      
      // Sprawdź kolizję z innymi przeszkodami (żeby nie nachodziły na siebie drastycznie)
      let overlap = false;
      for (const other of obstacles) {
        // Minimalny dystans między obiektami (suma promieni + lekki luz)
        const dist = Math.hypot(x - other.x, y - other.y);
        const minSeparation = (stats.size / 2 + other.size / 2) * 0.8;
        
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
  
  // Kolejność generowania (Warstwy):
  // 1. Woda (na samym spodzie logicznym)
  spawnObjects(MAP_CONFIG.WATER_COUNT, 'water');
  
  // 2. Chatki (duże, rzadkie)
  spawnObjects(MAP_CONFIG.HUTS_COUNT, 'hut');
  
  // 3. Skały
  spawnObjects(MAP_CONFIG.ROCKS_COUNT, 'rock');
  
  // 4. Drzewa (najwięcej)
  spawnObjects(MAP_CONFIG.TREES_COUNT, 'tree');
}