// ==============
// BULLET.JS (v0.61 - Implementacja Puli Obiektów)
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
    this.vx = vx;
    this.vy = vy;
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
   */
  update() {
    // Ta metoda jest teraz wywoływana tylko dla aktywnych pocisków
    this.x += this.vx;
    this.y += this.vy;
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
    return (
      this.x < 0 ||
      this.x > canvas.width ||
      this.y < 0 ||
      this.y > canvas.height
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