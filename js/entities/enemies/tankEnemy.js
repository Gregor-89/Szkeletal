// ==============
// TANKENEMY.JS (v0.83v - Odporność na Spowolnienie)
// Lokalizacja: /js/entities/enemies/tankEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Tank.
 * Wolniejszy, ale bardziej wytrzymały (logika HP w gameData) i odporny na odrzut/hitStun oraz wszelkie spowolnienia.
 */
export class TankEnemy extends Enemy {
  getSpeed(game, dist) {
    // NOWA LOGIKA V0.83V: Zignoruj wszystkie efekty spowalniające
    let speed = this.speed * 0.6;
    
    // Zastosuj tylko hitStun (który i tak jest zerowany w takeDamage())
    speed *= (1 - (this.hitStun || 0));
    
    return speed;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.77s: Zwiększono 2x (z 56 na 112)
    return 112;
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
  
  /**
   * NOWA METODA V0.83: Nadpisanie, aby zignorować hitStun.
   */
  takeDamage(damage) {
    super.takeDamage(damage);
    // Natychmiast wyzeruj hitStun, aby wróg był "nieustępliwy"
    this.hitStun = 0;
  }
  
  // NADPISANIE draw() dla wizualnego uniemożliwienia efektu spowolnienia
  draw(ctx, game) {
    ctx.save();
    
    // Spowolnienie Freeze lub Hazard jest rysowane TYLKO jeśli NIE jest to Tank
    if (this.hitStun > 0 && Math.floor(performance.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.7;
    }
    
    if (this.spriteSheet) {
      const sourceX = this.currentFrame * this.frameWidth;
      const sourceY = 0;
      const drawSize = this.size * 2.5;
      
      ctx.drawImage(
        this.spriteSheet,
        sourceX,
        sourceY,
        this.frameWidth,
        this.frameHeight,
        this.x - drawSize / 2,
        this.y - drawSize / 2,
        drawSize,
        drawSize
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      
      ctx.strokeStyle = this.getOutlineColor();
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    
    ctx.globalAlpha = 1;
    
    this.drawHealthBar(ctx);
    
    ctx.restore();
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77s] js/entities/enemies/tankEnemy.js: Zwiększono separację (do 112).');