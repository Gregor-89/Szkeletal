// ==============
// TANKENEMY.JS (v0.93 - FIX: Crash & Restore Logic)
// Lokalizacja: /js/entities/enemies/tankEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg typu Tank (Szkielet).
 * Duży, wolny, odporny i z paskiem HP.
 */
export class TankEnemy extends Enemy {
  
  // KONSTRUKTOR
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // Hitbox fizyczny to 100px (z gameData).
    // Ustawiamy 1.1, co da wizualnie 110px wysokości.
    // (Poprzednia sugestia 0.35 była błędem obliczeniowym).
    this.visualScale = 1.1;
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
  
  // PRZYWRÓCONA LOGIKA v0.92: Tank jest bardzo powolny (60% bazowej prędkości)
  getSpeed(game) {
    // Wywołujemy logikę bazową (żeby uwzględnić freeze), a potem zwalniamy
    let speed = super.getSpeed(game);
    return speed * 0.6;
  }
  
  // PRZYWRÓCONA LOGIKA v0.92: Tank jest odporny na hitStun (nie zatrzymuje się po trafieniu)
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    this.hitStun = 0; // Reset stun immediately (Unstoppable)
    return result;
  }
  
  // Nadpisujemy draw, aby użyć automatycznej animacji (super.draw), 
  // ale dorysować pasek życia na wierzchu.
  draw(ctx, game) {
    // 1. Rysuj animowanego sprite'a (korzysta z logiki Enemy.js i spritesheeta)
    super.draw(ctx, game);
    
    // 2. Dorysuj pasek życia (logika lokalna, bo draw.js tego nie eksportuje)
    this.drawHealthBar(ctx);
  }
  
  // Lokalna implementacja paska życia (przywrócona z v0.92)
  drawHealthBar(ctx) {
    if (this.hp < this.maxHp && this.hp > 0) {
      const pct = this.hp / this.maxHp;
      const w = 60;
      const h = 6;
      // Pozycjonowanie paska nad głową (uwzględnia visualScale)
      const y = -(this.size * this.visualScale / 2) - 12;
      
      // Rysowanie paska względem środka wroga (0,0)
      ctx.fillStyle = '#222';
      ctx.fillRect(-w / 2, y, w, h);
      
      ctx.fillStyle = '#f44336';
      ctx.fillRect(-w / 2, y, w * pct, h);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, y, w, h);
    }
  }
}