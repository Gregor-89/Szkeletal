// ==============
// WHIPWEAPON.JS (v0.98d - Async Sound Fix)
// Lokalizacja: /js/config/weapons/whipWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';
import { get as getAsset } from '../../services/assets.js';

const WHIP_HITBOX_LIFE = 0.25;
const WHIP_PIERCE = 99;
const WHIP_COLOR = '#C8E6C9';

const WHIP_BASE_OFFSET = 70;
const WHIP_SPACING = 50;

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
    
    // Zmienne do obsługi opóźnienia ataku z tyłu
    this.pendingRearAttack = false;
    this.rearTimer = 0;
    
    this.updateStats();
  }
  
  updateStats() {
    this.damage = this.whipConfig.calculateDamage(this.level);
    this.cooldown = this.whipConfig.calculateCooldown(this.level);
    this.drawScale = this.whipConfig.calculateDrawScale(this.level);
    this.hitboxSize = (this.whipConfig.HITBOX_RADIUS || 30) * 1.1;
    this.count = this.whipConfig.calculateCount(this.level);
    
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  update(state) {
    const { dt, bulletsPool } = state;
    
    // 1. Obsługa opóźnionego ataku w tył
    if (this.pendingRearAttack) {
      this.rearTimer -= dt;
      if (this.rearTimer <= 0) {
        this.pendingRearAttack = false;
        // Wykonaj atak w tył
        const dir = this.player.facingDir || 1;
        const oppositeDir = -dir;
        this.fireWhipBatch(bulletsPool, oppositeDir, false);
        
        // FIX: Odtwórz dźwięk również dla ataku tylnego
        playSound('Whip');
      }
    }
    
    // 2. Główny timer ataku
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      const dir = this.player.facingDir || 1;
      
      // Krok A: Atak PRZODEM (natychmiast)
      this.fireWhipBatch(bulletsPool, dir, true);
      
      playSound('Whip'); // Dźwięk pierwszego uderzenia
      
      // Krok B: Zaplanuj atak TYŁEM
      if (this.count >= 2) {
        this.pendingRearAttack = true;
        this.rearTimer = 0.2; // 200ms opóźnienia
      }
    }
  }
  
  fireWhipBatch(bulletsPool, side, isFront) {
    const animParams = {
      spriteSheet: this.spriteSheet || getAsset('effect_whip'),
      frameWidth: 125,
      frameHeight: 150,
      frameCount: 6,
      animRow: 0,
      animSpeed: (WHIP_HITBOX_LIFE * 1000) / 6
    };
    
    const spawnHitbox = (sideDir, offsetIdx, isPointBlank = false) => {
      let hitboxX, hitboxY;
      let currentDrawScale = this.drawScale;
      
      if (isPointBlank) {
        hitboxX = this.player.x;
        hitboxY = this.player.y;
        currentDrawScale = 0;
      } else {
        const offsetDist = WHIP_BASE_OFFSET + (offsetIdx * WHIP_SPACING);
        hitboxX = this.player.x + (1 * offsetDist * sideDir);
        hitboxY = this.player.y;
      }
      
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
          sideDir,
          currentDrawScale > 0 ? animParams : null,
          this.player,
          currentDrawScale
        );
      }
    };
    
    if (isFront) {
      spawnHitbox(side, 0, true);
    }
    
    if (isFront) {
      if (this.count >= 1) spawnHitbox(side, 0);
      if (this.count >= 3) spawnHitbox(side, 1);
    } else {
      if (this.count >= 2) spawnHitbox(side, 0);
      if (this.count >= 4) spawnHitbox(side, 1);
    }
  }
  
  draw(ctx) {}
  
  toJSON() {
    return {
      ...super.toJSON(),
      timer: this.timer
    };
  }
}