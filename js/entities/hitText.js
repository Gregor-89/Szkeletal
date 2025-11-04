// ==============
// HITTEXT.JS (v0.62 - Nowy plik dla Puli Obiektów)
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
  }
  
  /**
   * Inicjalizuje tekst.
   */
  init(x, y, text, color, life, vy) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = life; // Czas życia w sekundach
    this.maxLife = life;
    this.vy = vy; // Prędkość pionowa w px/s
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
    
    // Zresetuj właściwości łączenia
    this.spawnTime = 0;
    this.overrideText = null;
    this.damage = 0;
  }
  
  /**
   * Aktualizuje stan (pozycja i czas życia).
   */
  update(dt) {
    // Zastosuj fizykę opartą na DT
    this.y += this.vy * dt;
    this.life -= dt;
    
    if (this.life <= 0) {
      this.release();
    }
  }
} 