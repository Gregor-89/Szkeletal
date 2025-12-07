// ==============
// PARTICLE.JS (v0.63 - Render Logic Removed)
// Lokalizacja: /js/entities/particle.js
// ==============

/**
 * Klasa dla Cząsteczki, zoptymalizowana pod Pulę Obiektów.
 */
export class Particle {
  constructor() {
    this.pool = null;
    this.active = false;
    
    // Wartości są w "jednostkach na sekundę" (px/s, px/s^2, rad/s)
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0; // Czas życia w SEKUNDACH
    this.maxLife = 1;
    this.color = '#fff';
    this.gravity = 0; // px / s^2
    this.friction = 0; // % zaniku na sekundę (0.1 = 10%)
    this.rot = 0;
    this.rotSpeed = 0; // radiany / s
    this.size = 2;
  }
  
  /**
   * Inicjalizuje cząsteczkę.
   * Oczekuje wartości w "jednostkach na sekundę".
   */
  init(x, y, vx, vy, life, color, gravity = 0, friction = 0, size = 2, rotSpeed = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life; // Czas życia w SEKUNDACH
    this.maxLife = life;
    this.color = color;
    this.gravity = gravity;
    this.friction = friction; // np. 0.1 (10% zaniku na sekundę)
    this.size = size;
    this.rot = (rotSpeed !== 0) ? (Math.random() * Math.PI * 2) : 0;
    this.rotSpeed = rotSpeed;
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
  }
  
  /**
   * Aktualizuje stan (pozycja, fizyka, czas życia) w oparciu o Delta Time.
   */
  update(dt) {
    // 1. Zastosuj siły (grawitacja i tarcie)
    this.vy += this.gravity * dt;
    this.vx *= (1.0 - this.friction * dt);
    
    // 2. Zmień pozycję na podstawie prędkości
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // 3. Zastosuj obrót
    this.rot += this.rotSpeed * dt;
    
    // 4. Zmniejsz czas życia
    this.life -= dt;
    
    if (this.life <= 0) {
      this.release();
    }
  }
}