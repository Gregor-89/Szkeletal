// ==============
// AUTOGUN.JS (v0.94l - FIX: Missing ID for Perks)
// Lokalizacja: /js/config/weapons/autoGun.js
// ==============

import { Weapon } from '../weapon.js';
import { findClosestEnemy } from '../../managers/enemyManager.js';
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG, PERK_CONFIG } from '../gameData.js';

/**
 * AutoGun: Domyślna broń gracza (Plujko Jad).
 */
export class AutoGun extends Weapon {
  constructor(player) {
    super(player);
    
    // FIX: Przypisanie ID jest wymagane, aby perki (multishot, pierce) mogły znaleźć broń
    this.id = 'autogun';
    
    const config = WEAPON_CONFIG.AUTOGUN || {};
    
    this.fireRate = config.BASE_FIRE_RATE || 500;
    this.bulletDamage = config.BASE_DAMAGE || 1;
    this.bulletSpeed = config.BASE_SPEED || 864;
    this.bulletSize = config.BASE_SIZE || 3;
    
    this.multishot = 0;
    this.pierce = 0;
  }
  
  updateStats(perk) {
    if (!perk) return;
    
    const config = PERK_CONFIG[perk.id] || {};
    
    switch (perk.id) {
      case 'firerate':
        this.fireRate *= config.value;
        break;
      case 'damage':
        this.bulletDamage += config.value;
        break;
      case 'multishot':
        this.multishot += config.value;
        break;
      case 'pierce':
        this.pierce += config.value;
        break;
    }
  }
  
  update(state) {
    const { game, enemies, bulletsPool, settings, dt } = state;
    const now = performance.now();
    
    if (now - this.lastFire < this.fireRate / (game.hyper ? 1.2 : 1)) return;
    
    const { enemy: target } = findClosestEnemy(this.player, enemies);
    
    if (!target) return;
    
    this.lastFire = now;
    playSound('Shoot');
    
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const baseAng = Math.atan2(dy, dx);
    const count = 1 + this.multishot;
    const spread = Math.min(0.4, 0.12 * this.multishot);
    
    const finalSpeed = this.bulletSpeed * (game.hyper ? 1.15 : 1);
    
    const spriteKey = WEAPON_CONFIG.AUTOGUN.SPRITE || null;
    const spriteScale = WEAPON_CONFIG.AUTOGUN.SPRITE_SCALE || 1.0;
    
    for (let i = 0; i < count; i++) {
      const off = spread * (i - (count - 1) / 2);
      
      const bullet = bulletsPool.get();
      if (bullet) {
        bullet.init(
          this.player.x,
          this.player.y,
          Math.cos(baseAng + off) * finalSpeed,
          Math.sin(baseAng + off) * finalSpeed,
          this.bulletSize,
          this.bulletDamage,
          '#FFC107',
          this.pierce,
          Infinity,
          0,
          0,
          null,
          null,
          0,
          spriteKey,
          spriteScale
        );
      }
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      fireRate: this.fireRate,
      bulletDamage: this.bulletDamage,
      multishot: this.multishot,
      pierce: this.pierce
    };
  }
}