// ==============
// WALLENEMY.JS (v0.76g - FIX: Przywrócenie oryginalnej separacji dla Oblężnika)
// Lokalizacja /js/entities/enemies/wallEnemy.js
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
    // Czas bazowy + losowa wariancja (pobierane z gameData.js)
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
    // POPRAWKA v0.76g: Przywrócenie oryginalnej wartości (z 60 na 30)
    return 30; // Utrzymanie ciasnej formacji "ściany"
  }

  // NOWA METODA: Główna logika samodestrukcji
  selfDestruct(state) {
    const { game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators } = state;
    
    // 1. Efekt Area Nuke
    // POPRAWKA v0.76a: Dodano 'true' jako ostatni argument (isWallNuke)
    areaNuke(
        this.x,
        this.y,
        WALL_DETONATION_CONFIG.WALL_DETONATION_RADIUS,
        false, // onlyXP = false
        game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators,
        true // <-- NOWA FLAGA: isWallNuke
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
    
    // ZBALANSOWANIE v0.76: Złagodzenie wskaźnika detonacji (z migania na pulsowanie)
    if (this.isDetonating) {
        // Oblicz progres pulsowania (0 do 1)
        const timeElapsed = WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME - this.detonationT;
        // Użyj funkcji sinus do stworzenia płynnego pulsowania
        // Mnożenie przez 8 sprawi, że będzie pulsować (ok. 1.27 Hz)
        const pulseFactor = (Math.sin(timeElapsed * 8) + 1) / 2; // (Zakres 0.0 - 1.0)
        
        // Użyj pulsowania do zmiany alphy i rozmiaru
        const pulseAlpha = 0.3 + (pulseFactor * 0.4); // Zakres 0.3 - 0.7
        const pulseSize = this.size * 1.2 + (pulseFactor * this.size * 0.5); // Zakres 1.2x - 1.7x
        
        ctx.globalAlpha = pulseAlpha;
        ctx.fillStyle = '#ff9800'; // Pomarańczowy ostrzegawczy
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1; // Reset alpha dla rysowania bazowego
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

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76g] js/entities/enemies/wallEnemy.js: Przywrócono separację (do 30).');