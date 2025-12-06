// ==============
// HITTEXT.JS (v0.99 - Offset Support)
// Lokalizacja: /js/entities/hitText.js
// ==============

/**
 * Klasa dla Tekstu Obrażeń, zoptymalizowana pod Pulę Obiektów.
 */
export class HitText {
  constructor() {
    this.pool = null; // Referencja do puli
    this.active = false; // Czy obiekt jest aktywny
    
    // Domyślne wartości
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#fff';
    this.life = 0; // Czas życia w SEKUNDACH
    this.maxLife = 1;
    this.vy = 0; // Prędkość w px/s
    
    // Używane do logiki łączenia (merge)
    this.spawnTime = 0;
    this.overrideText = null;
    this.damage = 0;
    
    // Śledzenie celu
    this.target = null;
    this.offsetY = -60; // Domyślny offset
  }
  
  /**
   * Inicjalizuje tekst.
   * Dodano parametr offsetY (domyślnie -60).
   */
  init(x, y, text, color, life, vy, target = null, offsetY = -60) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.vy = vy;
    this.target = target;
    this.offsetY = offsetY; // Zapamiętujemy offset
    this.active = true;
  }
  
  /**
   * Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false;
    this.spawnTime = 0;
    this.overrideText = null;
    this.damage = 0;
    this.target = null;
  }
  
  /**
   * Aktualizuje stan (pozycja i czas życia).
   */
  update(dt) {
    this.life -= dt;
    
    if (this.target) {
      // FIX: Używamy zapamiętanego offsetY, a nie sztywnej wartości
      this.x = this.target.x;
      this.y = this.target.y + this.offsetY;
    } else {
      // Standardowe zachowanie (floating up)
      this.y += this.vy * dt;
    }
    
    if (this.life <= 0) {
      this.release();
    }
  }
}