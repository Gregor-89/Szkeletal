// ==============
// AUTOGUN.JS (v0.77v - FIX: Usunięcie spamu z konsoli)
// Lokalizacja: /js/config/weapons/autoGun.js
// ==============

import { Weapon } from '../weapon.js';
import { findClosestEnemy } from '../../managers/enemyManager.js';
import { playSound } from '../../services/audio.js';
// Import konfiguracji
import { WEAPON_CONFIG, PERK_CONFIG } from '../gameData.js';

/**
 * AutoGun: Domyślna broń gracza.
 */
export class AutoGun extends Weapon {
  constructor(player) {
    super(player);
    
    // POPRAWKA STABILNOŚCI: Dodanie defensywnego fallbacka do konfiguracji
    const config = WEAPON_CONFIG.AUTOGUN || {};
    
    // POPRAWKA v0.65: Użyj wartości z WEAPON_CONFIG lub wartości domyślnych (500, 1, 864, 3)
    this.fireRate = config.BASE_FIRE_RATE || 500;
    this.bulletDamage = config.BASE_DAMAGE || 1;
    this.bulletSpeed = config.BASE_SPEED || 864;
    this.bulletSize = config.BASE_SIZE || 3;
    
    this.multishot = 0;
    this.pierce = 0;
    
    // POPRAWKA V0.67: USUNIĘTO BUFOROWANIE CELU
  }
  
  // Ta metoda jest teraz wywoływana przez perk.apply() w perks.js
  updateStats(perk) {
    if (!perk) return; // Wywołane przez addWeapon, a nie przez apply
    
    // Zabezpieczenie przed brakiem konfiguracji perka
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
    
    // POPRAWKA V0.67: Wyszukiwanie najbliższego celu w KAŻDEJ klatce strzelania
    const { enemy: target } = findClosestEnemy(this.player, enemies);
    
    if (!target) return;
    
    this.lastFire = now;
    playSound('Shoot');
    
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const baseAng = Math.atan2(dy, dx);
    const count = 1 + this.multishot;
    const spread = Math.min(0.4, 0.12 * this.multishot);
    
    // Prędkość jest już w px/s
    const finalSpeed = this.bulletSpeed * (game.hyper ? 1.15 : 1);
    
    for (let i = 0; i < count; i++) {
      const off = spread * (i - (count - 1) / 2);
      
      const bullet = bulletsPool.get();
      if (bullet) {
        bullet.init(
          this.player.x,
          this.player.y,
          Math.cos(baseAng + off) * finalSpeed, // px/s
          Math.sin(baseAng + off) * finalSpeed, // px/s
          this.bulletSize,
          this.bulletDamage,
          '#FFC107',
          this.pierce
        );
      }
    }
    
    // POPRAWKA v0.77v: Zakomentowano spamujący log
    // console.log('[DEBUG] js/config/weapon.js: AutoGun re-targeted instantly.');
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