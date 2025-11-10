// ==============
// WALLENEMY.JS (v0.77 - Implementacja obrażeń AOE, blokady dropów i subtelnego wskaźnika)
// Lokalizacja /js/entities/enemies/wallEnemy.js
// ==============

import { Enemy } from '../enemy.js';
import { WALL_DETONATION_CONFIG } from '../../config/gameData.js';
import { areaNuke, addHitText } from '../../core/utils.js';
// NOWY IMPORT v0.77: Potrzebujemy dostępu do killEnemy
import { killEnemy } from '../../managers/enemyManager.js';

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
    this.initialLife = WALL_DETONATION_CONFIG.WALL_DECAY_TIME;
    this.detonationT = this.initialLife + (Math.random() * WALL_DETONATION_CONFIG.WALL_DETONATION_TIME_VARIANCE);
    this.isDetonating = false;
    this.isAutoDead = false; 
  }
  
  takeDamage(damage) {
      super.takeDamage(damage);
      this.showHealthBar = true;
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
    const { game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators, hitTextPool, hitTexts } = state;
    
    const radius = WALL_DETONATION_CONFIG.WALL_DETONATION_RADIUS; // 400
    const damage = WALL_DETONATION_CONFIG.WALL_DETONATION_DAMAGE; // 5
    
    // NOWA LOGIKA v0.77: Zadawanie obrażeń wrogom i blokowanie dropów
    // Iterujemy wstecz, ponieważ killEnemy modyfikuje tablicę
    for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        // Nie rań samego siebie (chociaż i tak zaraz zniknie)
        if (e.id === this.id) continue; 
        
        const d = Math.hypot(this.x - e.x, this.y - e.y);
        
        if (d <= radius) {
            e.takeDamage(damage);
            addHitText(hitTextPool, hitTexts, e.x, e.y, damage, '#ff9800'); // Pomarańczowy tekst
            
            if (e.hp <= 0) {
                // Zabij wroga, ale BLOKUJ dropy (ostatni argument = true)
                state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false, true); 
            }
        }
    }

    // 1. Efekt Area Nuke (niszczy dropy i gemy w zasięgu)
    // POPRAWKA v0.77: Użycie nowego, większego promienia (400)
    areaNuke(
        this.x,
        this.y,
        radius, // Użyj nowego promienia 400
        false, // onlyXP = false
        game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators,
        true // isWallNuke = true
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
        }

        if (this.detonationT <= 0) {
            this.selfDestruct(state);
        }
    }
  }

  // NADPISANA METODA: Rysowanie z efektem ostrzegawczym
  draw(ctx, game) {
    ctx.save();
    
    // ZBALANSOWANIE v0.77: Złagodzenie wskaźnika detonacji (subtelniejszy)
    if (this.isDetonating) {
        const timeElapsed = WALL_DETONATION_CONFIG.WALL_DETONATION_WARNING_TIME - this.detonationT;
        const pulseFactor = (Math.sin(timeElapsed * 8) + 1) / 2; // (Zakres 0.0 - 1.0)
        
        // Zmniejszona alpha (0.1 - 0.5) i rozmiar (1.1x - 1.4x)
        const pulseAlpha = 0.1 + (pulseFactor * 0.4); 
        const pulseSize = this.size * 1.1 + (pulseFactor * this.size * 0.3); 
        
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
console.log('[DEBUG-v0.77] js/entities/enemies/wallEnemy.js: Wdrożono obrażenia AOE, blokadę dropów i subtelniejszy wskaźnik.');