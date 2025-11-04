// ==============
// BULLET.JS (v0.64 - Fizyka oparta na Delta Time)
// Lokalizacja: /js/entities/bullet.js
// ==============

/**
 * Klasa bazowa dla wszystkich pocisków.
 * Zmieniona, aby wspierać Object Pooling.
 */
class Bullet {
  constructor() {
    // Właściwości zostaną ustawione przez .init()
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.damage = 0;
    this.color = '#fff';
    
    // POPRAWKA v0.61: Właściwości Puli Obiektów
    this.active = false; // Czy obiekt jest aktualnie używany?
    this.pool = null; // Referencja do puli, do której należy
  }
  
  /**
   * POPRAWKA v0.61: Inicjalizuje pocisk danymi.
   * Ta metoda zastępuje stary konstruktor.
   */
  init(x, y, vx, vy, size, damage, color) {
    this.x = x;
    this.y = y;
    this.vx = vx; // Oczekuje teraz prędkości w px/sekundę
    this.vy = vy; // Oczekuje teraz prędkości w px/sekundę
    this.size = size;
    this.damage = damage;
    this.color = color;
    this.active = true;
  }
  
  /**
   * POPRAWKA v0.61: Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false; // Na wszelki wypadek
  }
  
  /**
   * Aktualizuje pozycję pocisku.
   * POPRAWKA v0.64: Zastosowano fizykę opartą na dt.
   */
  update(dt) {
    // Ta metoda jest teraz wywoływana tylko dla aktywnych pocisków
    this.x += this.vx * dt; // Zastosuj dt
    this.y += this.vy * dt; // Zastosuj dt
  }
  
  /**
   * Rysuje pocisk na canvasie.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // Ta metoda jest teraz wywoływana tylko dla aktywnych pocisków
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Sprawdza, czy pocisk jest poza ekranem.
   * @param {HTMLCanvasElement} canvas 
   * @returns {boolean}
   */
  isOffScreen(canvas) {
    // Zwiększamy margines, aby pociski (które są teraz szybsze)
    // nie "przeskoczyły" granicy w klatkach z niskim FPS
    const margin = 50;
    return (
      this.x < -margin ||
      this.x > canvas.width + margin ||
      this.y < -margin ||
      this.y > canvas.height + margin
    );
  }
}

/**
 * Klasa dla pocisków gracza.
 */
export class PlayerBullet extends Bullet {
  constructor() {
    super(); // Konstruktor jest pusty
    this.pierce = 0;
  }
  
  /**
   * POPRAWKA v0.61: Dedykowana metoda init
   */
  init(x, y, vx, vy, size, damage, color, pierce) {
    // Wywołaj metodę init() klasy bazowej
    super.init(x, y, vx, vy, size, damage, color);
    // Ustaw specyficzne właściwości
    this.pierce = pierce;
  }
}

/**
 * Klasa dla pocisków wroga.
 */
export class EnemyBullet extends Bullet {
  constructor() {
    super(); // Konstruktor jest pusty
  }
  
  /**
   * POPRAWKA v0.61: Dedykowana metoda init
   */
  init(x, y, vx, vy, size, damage, color) {
    // Wywołaj metodę init() klasy bazowej
    super.init(x, y, vx, vy, size, damage, color);
  }
}