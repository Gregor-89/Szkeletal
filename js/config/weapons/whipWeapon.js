// ==============
// WHIPWEAPON.JS (v1.12 - Strike ID Generation)
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
    
    this.pendingRearAttack = false;
    this.rearTimer = 0;
    
    // ID uderzenia używane do kontroli kolizji
    this.currentStrikeId = null;
    this.rearStrikeId = null;
    
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
    
    if (this.pendingRearAttack) {
      this.rearTimer -= dt;
      if (this.rearTimer <= 0) {
        this.pendingRearAttack = false;
        const dir = this.player.facingDir || 1;
        const oppositeDir = -dir;
        // Atak tylny używa swojego strikeId
        this.fireWhipBatch(bulletsPool, oppositeDir, false, this.rearStrikeId);
        playSound('Whip');
      }
    }
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      // FIX Ad 7: Generujemy unikalne ID dla tego konkretnego uderzenia
      this.currentStrikeId = "whip_" + Date.now() + "_" + Math.random();
      
      const dir = this.player.facingDir || 1;
      this.fireWhipBatch(bulletsPool, dir, true, this.currentStrikeId);
      
      playSound('Whip');
      
      if (this.count >= 2) {
        this.pendingRearAttack = true;
        this.rearTimer = 0.2;
        // Generujemy osobne ID dla ataku z tyłu, by mógł trafić te same obiekty co front
        this.rearStrikeId = "whip_rear_" + Date.now() + "_" + Math.random();
      }
    }
  }
  
  fireWhipBatch(bulletsPool, side, isFront, strikeId) {
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
        // Przekazujemy strikeId jako parametr 'userData' lub rozszerzamy init
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
        // FIX: Dodajemy strikeId bezpośrednio do obiektu pocisku
        bullet.strikeId = strikeId;
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