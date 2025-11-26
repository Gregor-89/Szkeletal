// ==============
// NOVAWEAPON.JS (v0.94x - FIX: Dynamic Pierce)
// Lokalizacja: /js/config/weapons/novaWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { limitedShake } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG, PERK_CONFIG } from '../gameData.js';

/**
 * NovaWeapon: Broń obszarowa.
 */
export class NovaWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    this.cooldown = 0;
    this.bulletCount = 0;
    this.damage = 0;
    this.pierce = 1; // Domyślny pierce
    
    this.novaConfig = PERK_CONFIG.nova;
    this.updateStats();
  }
  
  updateStats() {
    this.cooldown = this.novaConfig.calculateCooldown(this.level);
    this.bulletCount = this.novaConfig.calculateCount(this.level);
    this.damage = this.novaConfig.calculateDamage ? this.novaConfig.calculateDamage(this.level) : 5;
    
    // FIX: Pobieranie wartości pierce z konfiguracji
    this.pierce = this.novaConfig.calculatePierce ? this.novaConfig.calculatePierce(this.level) : 1;
    
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  update(state) {
    const { dt, game, bulletsPool, settings } = state;
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      const speed = WEAPON_CONFIG.NOVA.SPEED || 600;
      const size = 5;
      
      const spriteKey = WEAPON_CONFIG.NOVA.SPRITE || null;
      const spriteScale = WEAPON_CONFIG.NOVA.SPRITE_SCALE || 2.0;
      
      const dmg = this.damage;
      const pierceVal = this.pierce; // Użyj aktualnego pierce
      
      for (let i = 0; i < this.bulletCount; i++) {
        const ang = (i / this.bulletCount) * Math.PI * 2;
        
        const bullet = bulletsPool.get();
        if (bullet) {
          bullet.init(
            this.player.x,
            this.player.y,
            Math.cos(ang) * speed,
            Math.sin(ang) * speed,
            size,
            dmg,
            '#FFC107',
            pierceVal, // FIX: Dynamiczny pierce
            3.0,
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
      
      playSound('Nova');
      limitedShake(game, settings, 4, 100);
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      timer: this.timer
    };
  }
}