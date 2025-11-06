// ==============
// NOVAWEAPON.JS (v0.73 - Uproszczenie Użycia PERK_CONFIG)
// Lokalizacja: /js/config/weapons/novaWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { limitedShake } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';
// POPRAWKA v0.65: Zmieniono import na centralną konfigurację
import { WEAPON_CONFIG, PERK_CONFIG } from '../gameData.js';
// POPRAWKA v0.71: Import 3 podklas broni z nowego folderu
import { AutoGun } from './autoGun.js';

/**
 * NovaWeapon: Broń obszarowa.
 */
export class NovaWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    this.cooldown = 0;
    this.bulletCount = 0;
    
    this.novaConfig = PERK_CONFIG.nova; // Cache dla configu
    this.updateStats();
  }
  
  // POPRAWKA v0.65: Skalowanie pobierane z PERK_CONFIG
  // POPRAWKA v0.73: Używa teraz funkcji z PERK_CONFIG.
  updateStats() {
    
    // Logika przeniesiona do gameData.js
    this.cooldown = this.novaConfig.calculateCooldown(this.level);
    this.bulletCount = this.novaConfig.calculateCount(this.level);
    
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  update(state) {
    const { dt, game, bulletsPool, settings } = state;
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      const autoGun = this.player.getWeapon(AutoGun);
      // POPRAWKA v0.65: Użyj wartości z WEAPON_CONFIG jako fallback
      const fallbackConfig = WEAPON_CONFIG.AUTOGUN || {};
      const dmg = autoGun ? autoGun.bulletDamage : (fallbackConfig.BASE_DAMAGE || 1);
      const pierce = autoGun ? autoGun.pierce : 0;
      const speed = autoGun ? autoGun.bulletSpeed : (fallbackConfig.BASE_SPEED || 864); // Już w px/s
      const size = autoGun ? autoGun.bulletSize : (fallbackConfig.BASE_SIZE || 3);
      
      for (let i = 0; i < this.bulletCount; i++) {
        const ang = (i / this.bulletCount) * Math.PI * 2;
        
        const bullet = bulletsPool.get();
        if (bullet) {
          bullet.init(
            this.player.x,
            this.player.y,
            Math.cos(ang) * speed, // px/s
            Math.sin(ang) * speed, // px/s
            size,
            dmg,
            '#FFC107',
            pierce
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