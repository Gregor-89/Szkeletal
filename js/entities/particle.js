// ==============
// PARTICLE.JS (v0.62 - Nowy plik dla Puli Obiektów)
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
    // Zastosuj tarcie (np. v = v * 0.99) w sposób niezależny od klatek
    // v_new = v_old * (1 - friction_per_second * dt)
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
  
  /**
   * Rysuje cząsteczkę.
   */
  draw(ctx) {
    // Oblicz alfę na podstawie czasu życia w sekundach
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    
    if (this.rotSpeed !== 0) {
      // Rysowanie obróconego kwadratu (dla konfetti)
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    } else {
      // Rysowanie standardowej kropki (dla trafień, itp.)
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    
    // Reset alpha jest robiony w pętli draw.js
  }
}