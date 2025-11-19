// ==============
// NOVAWEAPON.JS (v0.92E - Przekazywanie sprite'a)
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
      const fallbackConfig = WEAPON_CONFIG.AUTOGUN || {};
      const dmg = autoGun ? autoGun.bulletDamage : (fallbackConfig.BASE_DAMAGE || 1);
      const pierce = autoGun ? autoGun.pierce : 0;
      const speed = autoGun ? autoGun.bulletSpeed : (fallbackConfig.BASE_SPEED || 864);
      const size = autoGun ? autoGun.bulletSize : (fallbackConfig.BASE_SIZE || 3);
      
      // ZMIANA v0.92E: Pobranie konfiguracji sprite'a dla NOVY
      // (Nova używa własnego sprite'a, zdefiniowanego w WEAPON_CONFIG.NOVA)
      const spriteKey = WEAPON_CONFIG.NOVA.SPRITE || null;
      const spriteScale = WEAPON_CONFIG.NOVA.SPRITE_SCALE || 2.0;
      
      for (let i = 0; i < this.bulletCount; i++) {
        const ang = (i / this.bulletCount) * Math.PI * 2;
        
        const bullet = bulletsPool.get();
        if (bullet) {
          // ZMIANA v0.92E: Przekazanie spriteKey i spriteScale
          bullet.init(
            this.player.x,
            this.player.y,
            Math.cos(ang) * speed,
            Math.sin(ang) * speed,
            size,
            dmg,
            '#FFC107',
            pierce,
            Infinity,
            0,
            0,
            null,
            null,
            0,
            spriteKey, // NOWY ARGUMENT
            spriteScale // NOWY ARGUMENT
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