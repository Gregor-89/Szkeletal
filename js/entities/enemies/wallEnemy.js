// ==============
// WALLENEMY.JS (v0.75 - Final Enhancements: Dynamiczny HP Bar)
// Lokalizacja: /js/entities/enemies/wallEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WALL_DETONATION_CONFIG } from '../../config/gameData.js';
import { areaNuke } from '../../core/utils.js';

/**
 * Wróg Oblężnik (Wall).
 * Bardzo wolny i wytrzymały, pojawia się w Wydarzeniu Oblężenia.
 */
export class WallEnemy extends Enemy {
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // LOGIKA DYNAMICZNEGO HP BAR (v0.75)
    this.showHealthBar = false; // Czy pasek HP ma być widoczny
    
    // LOGIKA AUTODESTRUKCJI (v0.75)
    // Czas bazowy + losowa wariancja (np. 15s + 0-4s)
    this.initialLife = WALL_DETONATION_CONFIG.WALL_DECAY_TIME;
    this.detonationT = this.initialLife + (Math.random() * WALL_DETONATION_CONFIG.WALL_DETONATION_TIME_VARIANCE);
    this.isDetonating = false;
    this.isAutoDead = false; // Nowa flaga do usunięcia przez gameLogic
  }
  
  // NADPISANA METODA: Dezaktywuje odrzut w kolizji pocisk-wróg
  takeDamage(damage) {
      super.takeDamage(damage);
      // POPRAWKA v0.75: Pasek HP jest widoczny po pierwszym trafieniu
      this.showHealthBar = true;
      // USUNIĘTO logikę odrzutu, ponieważ jest obsługiwana w collisions.js
  }

  getOutlineColor() {
    return this.isDetonating ? '#FF4500' : '#90A4AE'; // Sygnalizacja kolorem
  }
  
  getSeparationRadius() {
    return 30; // Większa separacja, aby utrzymać "ścianę"
  }

  // NOWA METODA: Główna logika samodestrukcji
  selfDestruct(state) {
    const { game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators } = state;
    
    // 1. Efekt Area Nuke (niszczy dropy i gemy w zasięgu)
    areaNuke(
        this.x,
        this.y,
        WALL_DETONATION_CONFIG.WALL_DETONATION_RADIUS,
        false, // Wybuch dotyka też wrogów w zasięgu (ale areaNuke go ignoruje)
        game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators
    );

    // 2. Ustawienie flagi do usunięcia przez gameLogic 
    this.isAutoDead = true; 
    console.log(`[WallEnemy] Oblężnik ID:${this.id} detonuje i usuwa się z mapy.`);
  }

  // NADPISANA METODA: Logika timera i ruchu
  update(dt, player, game, state) {
    super.update(dt, player, game, state); // Ruch, separacja, hitstun
    
    // Logika timera detonacji
    if (!this.isAutoDead) {
        this.detonationT -= dt;

        if (this.detonationT <= WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME && !this.isDetonating) {
            this.isDetonating = true;
            // Opcjonalnie: playSound('WallWarning');
        }

        if (this.detonationT <= 0) {
            this.selfDestruct(state);
        }
    }
  }

  // NADPISANA METODA: Rysowanie z efektem ostrzegawczym
  draw(ctx, game) {
    ctx.save();
    
    // Sygnalizacja detonacji (migające tło)
    if (this.isDetonating) {
        const timeElapsed = WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME - this.detonationT;
        const blinkInterval = 0.1; // Miga co 100ms
        
        // Rysowanie pulsującego, czerwonego tła
        if (Math.floor(timeElapsed / blinkInterval) % 2 === 0) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#ff9800'; // Pomarańczowy ostrzegawczy
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // Wywołanie rysowania z klasy bazowej
    super.draw(ctx, game);
    ctx.restore();
  }
  
  // NADPISANA METODA: Rysowanie paska HP (tylko, jeśli trafiony)
  drawHealthBar(ctx) {
      if (!this.showHealthBar) return;
      
      const w = 26, h = 4;
      const frac = Math.max(0, this.hp / this.maxHp);
      const bx = this.x - w / 2;
      const by = this.y - this.size / 2 - 8;
      
      ctx.fillStyle = '#300';
      ctx.fillRect(bx, by, w, h);
      let hpColor;
      if (frac > 0.6) hpColor = '#0f0';
      else if (frac > 0.3) hpColor = '#ff0';
      else hpColor = '#f00';
      ctx.fillStyle = hpColor;
      ctx.fillRect(bx, by, w * frac, h);
      ctx.strokeStyle = '#111';
      ctx.strokeRect(bx, by, w, h);
  }
}