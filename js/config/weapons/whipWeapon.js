// ==============
// WHIPWEAPON.JS (v0.94c - FIX: Offset & Range)
// Lokalizacja: /js/config/weapons/whipWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';
import { get as getAsset } from '../../services/assets.js';

const WHIP_HITBOX_LIFE = 0.25; 
const WHIP_PIERCE = 99; 
const WHIP_COLOR = '#C8E6C9'; 

// FIX: Zwiększony offset, aby bicz startował od krawędzi gracza (jak w v0.92/0.93)
// Gracz ma radius ~20-40px (zależnie od skali), więc 60px to bezpieczny start
const WHIP_BASE_OFFSET = 60; 
const WHIP_SPACING = 40; // Zwiększony odstęp między hitboxami dla lepszego zasięgu

export class WhipWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    
    this.whipConfig = PERK_CONFIG.whip;
    
    this.cooldown = 0;
    this.damage = 0;
    this.drawScale = 0; 
    this.hitboxSize = 20; 
    this.count = 0;
    
    this.spriteSheet = getAsset('effect_whip');
    
    this.updateStats(); 
  }
  
  updateStats() {
    this.damage = this.whipConfig.calculateDamage(this.level);
    this.cooldown = this.whipConfig.calculateCooldown(this.level);
    this.drawScale = this.whipConfig.calculateDrawScale(this.level);
    this.hitboxSize = this.whipConfig.HITBOX_RADIUS || 25; 
    this.count = this.whipConfig.calculateCount(this.level);
    
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  update(state) {
    const { dt, bulletsPool } = state;
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      const attackX = 1;
      const attackY = 0;
      
      const animParams = {
        spriteSheet: this.spriteSheet,
        frameWidth: 125, 
        frameHeight: 150, 
        frameCount: 6, 
        animRow: 0, 
        animSpeed: (WHIP_HITBOX_LIFE * 1000) / 6 
      };
      
      const facingDir = this.player.facingDir; 
      const oppositeDir = -facingDir;
      
      const spawnHitbox = (side, offsetIdx) => {
        const offsetDist = WHIP_BASE_OFFSET + (offsetIdx * WHIP_SPACING);
        const hitboxX = this.player.x + (attackX * offsetDist * side);
        const hitboxY = this.player.y + (attackY * offsetDist * side);
        
        const bullet = bulletsPool.get();
        if (bullet) {
          bullet.init(
            hitboxX, hitboxY,
            0, 0, 
            this.hitboxSize, 
            this.damage,
            WHIP_COLOR,
            WHIP_PIERCE,
            WHIP_HITBOX_LIFE, 
            0, 
            side, 
            animParams,
            this.player, 
            this.drawScale 
          );
        }
      };
      
      if (this.count === 1) { 
        spawnHitbox(facingDir, 0);
      } else if (this.count === 2) { 
        spawnHitbox(facingDir, 0);
        spawnHitbox(oppositeDir, 0);
      } else if (this.count === 3) { 
        spawnHitbox(facingDir, 0);
        spawnHitbox(facingDir, 1); 
        spawnHitbox(oppositeDir, 0);
      } else if (this.count >= 4) { 
        spawnHitbox(facingDir, 0);
        spawnHitbox(facingDir, 1);
        spawnHitbox(oppositeDir, 0);
        spawnHitbox(oppositeDir, 1);
      }
      
      playSound('Whip');
    }
  }
  
  draw(ctx) {
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      timer: this.timer
    };
  }
}