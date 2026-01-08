// ==============
// GAMELOOP.JS (v1.0.1 - Full Logic Verification)
// Lokalizacja: /js/core/gameLoop.js
// ==============

import { updateGame } from './gameLogic.js';
import { updateIndicators } from '../managers/indicatorManager.js';
import { updateVisualEffects, updateParticles } from '../managers/effects.js';
import { updateEnemyCounter, updateUI } from '../ui/ui.js';
import { draw } from './draw.js';
import { devSettings } from '../services/dev.js';
import { playSound } from '../services/audio.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { WORLD_CONFIG } from '../config/gameData.js';
import { encrypt } from './gameState.js';

// Zmienne pomocnicze pętli
export let fps = 0;
let lastFrameTime = 0;
let frameCount = 0;
let lastEnemyCounterUpdate = 0;
const ENEMY_COUNTER_UPDATE_INTERVAL = 200;

/**
 * Inicjalizuje tło (gwiazdy) na podstawie rozmiaru świata.
 */
export function initStars(gameStateRef) {
  const { stars, canvas } = gameStateRef;
  stars.length = 0;
  const wWidth = canvas.width * WORLD_CONFIG.SIZE;
  const wHeight = canvas.height * WORLD_CONFIG.SIZE;
  for (let i = 0; i < 30 * WORLD_CONFIG.SIZE ** 2; i++) {
    stars.push({
      x: Math.random() * wWidth,
      y: Math.random() * wHeight,
      size: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      t: 0
    });
  }
}

/**
 * Główna logika aktualizacji klatki gry.
 */
function update(gameStateRef, dt) {
  const { game, camera, canvas } = gameStateRef;
  
  updateGame(gameStateRef, dt, window.wrappedLevelUp, window.wrappedOpenChest, camera);
  updateIndicators(gameStateRef, dt);
  
  if (canvas && camera) {
    const roundedX = Math.round(camera.offsetX);
    const roundedY = Math.round(camera.offsetY);
    canvas.style.backgroundPosition = `${-roundedX}px ${-roundedY}px`;
  }
  
  // Weryfikacja integralności (Anty-cheat)
  if (Math.random() < 0.01) {
    const shadows = game._getShadows();
    if (encrypt(game.score) !== shadows.s) game.isCheated = true;
    if (encrypt(game.health) !== shadows.h) game.isCheated = true;
  }
}

/**
 * Główna pętla requestAnimationFrame.
 */
export function loop(currentTime, gameStateRef, uiData) {
  const { game, player, settings, enemies, particles, particlePool, canvas, ctx, camera, bombIndicators } = gameStateRef;
  
  if (canvas === null) {
    uiData.animationFrameId = requestAnimationFrame((t) => loop(t, gameStateRef, uiData));
    return;
  }
  
  try {
    if (uiData.startTime === 0) {
      uiData.startTime = currentTime;
      uiData.lastTime = currentTime;
      lastFrameTime = currentTime;
    }
    
    const deltaMs = currentTime - uiData.lastTime;
    uiData.lastTime = currentTime;
    const dt = Math.min(deltaMs / 1000, 0.1);
    
    frameCount++;
    if (currentTime - lastFrameTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFrameTime = currentTime;
    }
    
    // Obsługa pauzy przez nakładki UI
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const introOverlay = document.getElementById('introOverlay');
    if ((tutorialOverlay && tutorialOverlay.style.display !== 'none') || (introOverlay && introOverlay.style.display === 'flex')) {
      game.paused = true;
    }
    
    updateVisualEffects(dt, [], [], bombIndicators);
    updateParticles(dt, particles);
    
    if (currentTime - lastEnemyCounterUpdate > ENEMY_COUNTER_UPDATE_INTERVAL) {
      updateEnemyCounter(game, enemies);
      lastEnemyCounterUpdate = currentTime;
    }
    
    if (game.paused || !game.running) {
      uiData.drawCallback();
      if (game.inMenu || game.manualPause || (document.getElementById('gameOverOverlay') && document.getElementById('gameOverOverlay').style.display === 'flex')) {
        updateUI(game, player, settings, null);
      }
    } else {
      if (game.isDying) {
        player.updateDeathAnimation(dt);
        uiData.drawCallback();
        if (player.deathTimer <= 0) {
          game.isDying = false;
          window.wrappedGameOver();
        }
        uiData.animationFrameId = requestAnimationFrame((t) => loop(t, gameStateRef, uiData));
        return;
      }
      
      game.time += dt;
      update(gameStateRef, dt);
      uiData.drawCallback();
      updateUI(game, player, settings, null);
      
      // Logika śmierci gracza
      if (game.health <= 0 && !devSettings.godMode && !game.isDying) {
        game.isDying = true;
        player.startDeath();
        playSound('Death');
        LeaderboardService.trackStat('deaths', 1);
        
        for (let k = 0; k < 150; k++) {
          const p = particlePool.get();
          if (p) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 600;
            p.init(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1.0 + Math.random(), '#b71c1c', 0, 0.92, 5 + Math.random() * 6);
          }
        }
      }
    }
  } catch (e) {
    console.error("KRYTYCZNY BŁĄD PĘTLI:", e.message);
    game.running = false;
    game.paused = true;
    if (uiData.animationFrameId) {
      cancelAnimationFrame(uiData.animationFrameId);
      uiData.animationFrameId = null;
    }
  }
  
  if (game.running || game.paused) {
    uiData.animationFrameId = requestAnimationFrame((t) => loop(t, gameStateRef, uiData));
  }
}