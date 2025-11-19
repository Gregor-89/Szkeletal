// ==============
// TANKENEMY.JS (v0.91R - Fix mrugania na biało)
// Lokalizacja: /js/entities/enemies/tankEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Tank.
 * Wolniejszy, ale bardziej wytrzymały (logika HP w gameData) i odporny na odrzut/hitStun oraz wszelkie spowolnienia.
 */
export class TankEnemy extends Enemy {
  
  // NOWY KONSTRUKTOR (v0.91N)
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    // Nadpisz domyślną skalę (1.0) z klasy bazowej Enemy
    this.drawScale = 1.5; // 150% bazowego rozmiaru (80px * 1.5 = 120px wysokości)
  }
  
  getSpeed(game, dist) {
    // NOWA LOGIKA V0.83V: Zignoruj wszystkie efekty spowalniające
    let speed = this.speed * 0.6;
    
    // Zastosuj tylko hitStun (który i tak jest zerowany w takeDamage())
    speed *= (1 - (this.hitStun || 0));
    
    return speed;
  }
  
  getSeparationRadius() {
    // POPRAWKA v0.77s: Zwiększono 2x (z 56 na 112)
    return 112; // Większy promień separacji dla większego wroga
  }
  
  getOutlineColor() {
    return '#8d6e63';
  }
  
  /**
   * NOWA METODA V0.83: Nadpisanie, aby zignorować hitStun.
   * POPRAWKA v0.91R: Umożliwiamy działanie super.takeDamage() (ustawia hitFlashT i hp), a potem zerujemy hitStun.
   */
  takeDamage(damage) {
    super.takeDamage(damage); // ZADANIE OBRAŻEŃ I USTAWIE hitFlashT = 0.15
    // Natychmiast wyzeruj hitStun, aby wróg był "nieustępliwy"
    this.hitStun = 0;
  }
  
  // NADPISANIE draw() dla wizualnego uniemożliwienia efektu spowolnienia
  draw(ctx, game) {
    ctx.save();
    
    // POPRAWKA v0.89d: Zmiana mignięcia na biały filtr (teraz używa hitFlashT z klasy bazowej)
    if (this.hitFlashT > 0 && Math.floor(performance.now() / 50) % 2 === 0) { // Używamy hitFlashT
      ctx.filter = 'grayscale(1) brightness(5)'; // Białe mignięcie
    }
    
    // --- NOWA LOGIKA RYSOWANIA SPRITE'A (v0.91M) ---
    if (this.spriteSheet) {
      // Cel: 80px wysokości * mnożnik (1.5)
      const targetVisualHeight = 80 * this.drawScale;
      
      // Oblicz proporcje (W / H)
      const aspectRatio = this.spriteWidth / this.spriteHeight;
      
      const drawHeight = targetVisualHeight;
      const drawWidth = targetVisualHeight * aspectRatio;
      
      ctx.save(); // DODATKOWY SAVE/RESTORE DLA TRANSFORMACJI
      ctx.translate(this.x, this.y);
      
      if (this.facingDir === -1) {
        ctx.scale(-1, 1);
      }
      
      ctx.imageSmoothingEnabled = false;
      
      ctx.drawImage(
        this.spriteSheet,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      
      ctx.restore(); // KONIEC TRANSFORMACJI
      
    } else {
      // Fallback (stara logika kwadratu)
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      
      ctx.strokeStyle = this.getOutlineColor();
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    // --- KONIEC NOWEJ LOGIKI RYSOWANIA SPRITE'A ---
    
    ctx.filter = 'none'; // Zawsze resetuj filtr
    ctx.globalAlpha = 1;
    
    this.drawHealthBar(ctx);
    
    ctx.restore();
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77s] js/entities/enemies/tankEnemy.js: Zwiększono separację (do 112).');