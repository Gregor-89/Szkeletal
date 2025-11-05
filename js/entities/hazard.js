// ==============
// HAZARD.JS (v0.68 - Użycie rozdzielonych multiplerów dla Damage Over Time)
// Lokalizacja: /js/entities/hazard.js
// ==============

// POPRAWKA v0.68: Import nowej centralnej konfiguracji dla parametrów
import { HAZARD_CONFIG } from '../config/gameData.js';

/**
 * Klasa dla statycznego Pola Zagrożenia (np. Kwaśna Plama).
 * Jest to stały element na mapie, który zadaje obrażenia i spowalnia gracza.
 */
export class Hazard {
  // POPRAWKA v0.68: Dodano isMega i scale
  constructor(x, y, isMega = false, scale = 1) {
    this.x = x;
    this.y = y;
    
    // POPRAWKA v0.68: Rozmiar skalowany
    this.scale = scale;
    this.r = HAZARD_CONFIG.SIZE * scale; // Promień kolizji i rysowania
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // POPRAWKA v0.68: Flaga Mega Hazard
    this.isMega = isMega;
    
    // --- NOWA LOGIKA V0.68 (Fine Tuning) ---
    // Pobranie multiplerów obrażeń z gameData.js
    const playerDmgMult = this.isMega ?
      HAZARD_CONFIG.MEGA_HAZARD_PLAYER_DAMAGE_MULTIPLIER :
      1;
    const enemyDmgMult = this.isMega ?
      HAZARD_CONFIG.MEGA_HAZARD_ENEMY_DAMAGE_MULTIPLIER :
      1;
    
    // Obrażenia obliczane są dynamicznie na podstawie skali i multiplerów
    // Gracz: DPS / 5 * Skala * Multipler Mega Gracza
    this.playerDmgPerHit = (HAZARD_CONFIG.DAMAGE_PER_SECOND / 5) * this.scale * playerDmgMult;
    // Wróg: DPS / 5 * Skala * Multipler Mega Wroga (teraz ustawione na 1.0, zgodnie z wymaganiem)
    this.enemyDmgPerHit = (HAZARD_CONFIG.HAZARD_ENEMY_DAMAGE_PER_SECOND / 5) * this.scale * enemyDmgMult;
    
    // POPRAWKA v0.68a: Właściwości Decay i Warning
    this.life = HAZARD_CONFIG.HAZARD_LIFE;
    this.maxLife = HAZARD_CONFIG.HAZARD_LIFE;
    this.activeTime = 0; // Czas od spawnu
  }
  
  /**
   * Zwraca true, jeśli Hazard jest w pełni aktywny (po fazie ostrzegawczej).
   */
  isActive() {
    return this.activeTime >= HAZARD_CONFIG.HAZARD_WARNING_TIME;
  }
  
  /**
   * Zwraca true, jeśli Hazard powinien zostać usunięty.
   */
  isDead() {
    return this.life <= 0;
  }
  
  /**
   * Aktualizuje stan zagrożenia (pulsowanie, czas życia, czas aktywny).
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.pulsePhase += dt * 3;
    
    // Logika Decay
    if (this.isActive()) {
      this.life -= dt;
    }
    
    // Logika Warning
    this.activeTime += dt;
  }
  
  /**
   * Rysuje pole zagrożenia na canvasie.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.save();
    
    const pulseScale = 1 + 0.05 * Math.sin(this.pulsePhase);
    const radius = this.r * pulseScale;
    
    // Logika wizualnego ostrzeżenia i zanikania
    let alpha = 1;
    let color = this.isMega ? 'rgba(150, 0, 150, 0.6)' : 'rgba(0, 150, 0, 0.6)'; // MEGA: Fioletowy, Standard: Zielony
    let shadowColor = this.isMega ? 'rgba(255, 0, 255, 0.8)' : 'rgba(0, 255, 0, 0.4)'; // Cień
    
    if (!this.isActive()) {
      // Faza ostrzegawcza (czerwony/żółty pulsujący pierścień)
      const colorFactor = Math.sin(this.activeTime * 12);
      
      alpha = 0.5 + 0.5 * Math.sin(this.activeTime * 8); // Migotanie
      color = `rgba(255, 100, 0, ${0.4 + 0.3 * colorFactor})`;
      shadowColor = `rgba(255, 0, 0, ${0.4 + 0.4 * colorFactor})`;
      
      ctx.setLineDash([10, 5]);
    } else if (this.life < 10) {
      // Faza zanikania (Decay)
      alpha = Math.max(0, this.life / 10);
    }
    
    ctx.globalAlpha = alpha;
    
    // 1. Rysowanie cienia (glow)
    ctx.shadowBlur = 25;
    ctx.shadowColor = shadowColor;
    
    // 2. Rysowanie samej plamy (Acid Pool)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 3. Wewnętrzny, jaśniejszy pierścień (efekt "gotowania")
    const innerColor = this.isMega ? 'rgba(200, 0, 200, 0.4)' : 'rgba(0, 200, 0, 0.4)';
    ctx.fillStyle = this.isActive() ? innerColor : 'rgba(0, 0, 0, 0.0)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // 4. Usuwamy cień przed rysowaniem konturu
    ctx.shadowBlur = 0;
    
    // Użyj jaśniejszego konturu dla Mega Hazardu
    ctx.strokeStyle = this.isActive() ? (this.isMega ? 'rgba(255, 0, 255, 0.8)' : 'rgba(0, 255, 0, 0.8)') : 'rgba(255, 165, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset dashed line po fazie ostrzegawczej
    ctx.setLineDash([]);
    
    ctx.restore();
  }
}