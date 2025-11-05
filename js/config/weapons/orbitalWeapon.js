// ==============
// ORBITALWEAPON.JS (v0.71 - Refaktoryzacja Broni)
// Lokalizacja: /js/config/weapons/orbitalWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { killEnemy } from '../../managers/enemyManager.js';
import { addHitText } from '../../core/utils.js';
import { PERK_CONFIG } from '../gameData.js';

/**
 * OrbitalWeapon: Broń pasywna.
 */
export class OrbitalWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.items = [];
    this.angle = 0;
    this.radius = 0;
    this.damage = 0;
    this.speed = 0;
    this.collisionTimer = 0;
    this.updateStats();
  }
  
  // POPRAWKA v0.65: Skalowanie pobierane z PERK_CONFIG
  updateStats() {
    const c = PERK_CONFIG.orbital || {}; // POPRAWKA STABILNOŚCI: Dodanie defensywnego fallbacka
    
    this.damage = (c.DAMAGE_BASE || 1) + Math.floor(this.level / (c.DAMAGE_LEVEL_DIVISOR || 2));
    this.radius = ((c.RADIUS_BASE || 28) + (c.RADIUS_PER_LEVEL || 6) * this.level) * (c.RADIUS_MULTIPLIER || 1.5);
    this.speed = (c.SPEED_BASE || 1.2) + (c.SPEED_PER_LEVEL || 0.2) * this.level;
    
    // Ta logika jest poprawna - dodaje nowy orbital, jeśli poziom jest wyższy niż liczba itemów
    while (this.items.length < this.level) {
      this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
    }
    while (this.items.length > this.level) {
      this.items.pop();
    }
  }
  
  update(state) {
    // POPRAWKA v0.62: Pobranie pul obiektów
    const { dt, enemies, particlePool, hitTextPool, hitTexts, game, settings, gemsPool, pickups, chests } = state;
    
    // Ta prędkość (radiany/s) jest już poprawnie mnożona przez dt.
    this.angle += this.speed * dt;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const ang = this.angle + i * (Math.PI * 2 / this.items.length);
      it.ox = this.player.x + Math.cos(ang) * this.radius;
      it.oy = this.player.y + Math.sin(ang) * this.radius;
    }
    
    this.collisionTimer -= dt;
    if (this.collisionTimer > 0) return;
    
    this.collisionTimer = 0.05;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (Math.abs(it.ox - e.x) > this.radius || Math.abs(it.oy - e.y) > this.radius) {
          continue;
        }
        
        const d = Math.hypot(it.ox - e.x, it.oy - e.y);
        if (d < 5 + e.size * 0.5) {
          // POPRAWKA V0.67: Zmieniono obliczenie obrażeń na standardowe,
          // aby nie zadawało 0.05 (zaokrąglane do 0).
          const dmg = this.damage;
          
          e.hp -= dmg;
          
          // POPRAWKA v0.62e: Użyj puli cząsteczek i fizyki opartej na DT
          const p = particlePool.get();
          if (p) {
            p.init(
              e.x, e.y,
              (Math.random() - 0.5) * 1 * 60, // vx (px/s)
              (Math.random() - 0.5) * 1 * 60, // vy (px/s)
              0.16, // life (było 10 klatek)
              '#ff0000'
            );
          }
          
          // POPRAWKA v0.62: Użyj puli hitText
          // Używamy dmg (które jest liczbą całkowitą z definicji Orbitala)
          addHitText(hitTextPool, hitTexts, e.x, e.y, dmg, '#80deea');
          
          if (e.hp <= 0) {
            // POPRAWKA v0.62: Przekaż pule do killEnemy
            state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, true);
          }
        }
      }
    }
  }
  
  draw(ctx) {
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#80DEEA';
      ctx.fillStyle = '#80DEEA';
      ctx.beginPath();
      ctx.arc(it.ox, it.oy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      angle: this.angle
    };
  }
}