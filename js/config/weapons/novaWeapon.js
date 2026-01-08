// ==============
// NOVAWEAPON.JS (v0.95 - Pulsed Damage Implementation)
// Lokalizacja: /js/config/weapons/novaWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { limitedShake } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG, PERK_CONFIG } from '../gameData.js';

/**
 * NovaWeapon: Broń obszarowa emitująca impulsy energii.
 */
export class NovaWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    this.cooldown = 0;
    this.bulletCount = 0;
    this.damage = 0;
    this.pierce = 0;
    
    // System ograniczania częstotliwości trafień (Ad Nova)
    this.strikeTimer = 0;
    this.currentStrikeId = "nova_init";
    
    this.novaConfig = PERK_CONFIG.nova;
    this.updateStats();
  }
  
  updateStats() {
    this.cooldown = this.novaConfig.calculateCooldown(this.level);
    this.bulletCount = this.novaConfig.calculateCount(this.level);
    this.damage = this.novaConfig.calculateDamage ? this.novaConfig.calculateDamage(this.level) : 8;
    
    // Pobieramy wartość pierce z configu (na 1 lvl powinna być 0)
    this.pierce = this.novaConfig.calculatePierce ? this.novaConfig.calculatePierce(this.level) : 0;
    
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  update(state) {
    const { dt, game, bulletsPool, settings } = state;
    
    // FIX Ad Nova: Odświeżanie StrikeID co 1 sekundę.
    // Przeciwnicy otrzymają obrażenia od "stojącego" w nich pocisku Nova tylko raz na impuls.
    this.strikeTimer += dt;
    if (this.strikeTimer >= 1.0) {
      this.strikeTimer = 0;
      this.currentStrikeId = "nova_puls_" + game.time.toFixed(1) + "_" + Math.random();
    }
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      const speed = WEAPON_CONFIG.NOVA.SPEED || 500;
      const size = 5;
      
      const spriteKey = WEAPON_CONFIG.NOVA.SPRITE || null;
      const spriteScale = WEAPON_CONFIG.NOVA.SPRITE_SCALE || 4.0;
      
      const dmg = this.damage;
      const pierceVal = this.pierce;
      
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
            pierceVal,
            3.0, // Czas życia pocisku
            0,
            0,
            null,
            null,
            0,
            spriteKey,
            spriteScale
          );
          // Przypisujemy StrikeID do pocisku Nova
          bullet.strikeId = this.currentStrikeId;
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