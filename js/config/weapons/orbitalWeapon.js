// ==============
// ORBITALWEAPON.JS (v0.98c - Balance Nerf)
// Lokalizacja: /js/config/weapons/orbitalWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { killEnemy } from '../../managers/enemyManager.js';
import { addHitText } from '../../core/utils.js';
import { get as getAsset } from '../../services/assets.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';

const ORBITAL_BASE_SIZE = 15;
const ORBITAL_COLOR = '#80DEEA';
const ORBITAL_GLOW_COLOR = 'rgba(255, 215, 0, 0.9)';

export class OrbitalWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.items = [];
    this.angle = 0;
    this.radius = 0;
    this.damage = 0;
    this.speed = 0;
    this.collisionTimer = 0;
    
    this.orbitalConfig = PERK_CONFIG.orbital;
    this.sprite = getAsset('weapon_orbital_potato');
    
    this.updateStats();
  }
  
  updateStats() {
    this.damage = this.orbitalConfig.calculateDamage(this.level);
    this.radius = this.orbitalConfig.calculateRadius(this.level);
    this.speed = this.orbitalConfig.calculateSpeed(this.level);
    
    while (this.items.length < this.level) {
      this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
    }
    while (this.items.length > this.level) {
      this.items.pop();
    }
  }
  
  update(state) {
    const { dt, enemies, particlePool, hitTextPool, hitTexts, game, settings, gemsPool, pickups, chests } = state;
    
    // 1. Aktualizacja Kąta i Pozycji
    this.angle += this.speed * dt;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const ang = this.angle + i * (Math.PI * 2 / this.items.length);
      it.ox = this.player.x + Math.cos(ang) * this.radius;
      it.oy = this.player.y + Math.sin(ang) * this.radius;
    }
    
    // 2. Obsługa Kolizji
    this.collisionTimer -= dt;
    if (this.collisionTimer > 0) return;
    
    // NERF: Zwiększono interwał uderzeń z 0.05 (20/s) na 0.15 (ok. 6/s)
    this.collisionTimer = 0.15;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e || e.isDead) continue;
        
        // Wstępny culling
        if (Math.abs(it.ox - e.x) > e.size + ORBITAL_BASE_SIZE || Math.abs(it.oy - e.y) > e.size + ORBITAL_BASE_SIZE) {
          continue;
        }
        
        const d = Math.hypot(it.ox - e.x, it.oy - e.y);
        if (d < ORBITAL_BASE_SIZE + e.size * 0.5) {
          
          const dmg = this.damage;
          e.takeDamage(dmg);
          
          playSound('Hit');
          
          if (e.type !== 'wall' && e.type !== 'tank') {
            const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
            // NERF: Zmniejszono knockback (mnożnik z 6 na 3)
            const kbForce = (dmg + 5) * 3.0;
            e.applyKnockback(Math.cos(angle) * kbForce, Math.sin(angle) * kbForce);
          }
          
          const p = particlePool.get();
          if (p) {
            p.init(e.x, e.y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 0.16, '#80DEEA');
          }
          
          addHitText(hitTextPool, hitTexts, e.x, e.y, dmg, ORBITAL_COLOR);
          
          if (e.hp <= 0) {
            state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, true);
          }
        }
      }
    }
  }
  
  draw(ctx) {
    if (!this.sprite) {
      for (const it of this.items) {
        ctx.save();
        ctx.fillStyle = ORBITAL_COLOR;
        ctx.beginPath();
        ctx.arc(it.ox, it.oy, ORBITAL_BASE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    
    const drawSize = ORBITAL_BASE_SIZE * 2;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      ctx.save();
      
      const glowPulse = 5 + 3 * Math.sin(performance.now() / 150 + it.angle);
      ctx.shadowBlur = glowPulse;
      ctx.shadowColor = ORBITAL_GLOW_COLOR;
      
      ctx.translate(it.ox, it.oy);
      const rotationAngle = this.angle + i * (Math.PI * 2 / this.items.length) + (it.angle * 0.1);
      ctx.rotate(rotationAngle);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      
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