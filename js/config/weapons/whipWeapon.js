// ==============
// WHIPWEAPON.JS (v0.95 - FIX: Correct Levels & Invisible Point-Blank)
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
    this.count = 0; // To teraz będzie "poziom logiki" (ilość ataków)
    
    this.spriteSheet = getAsset('effect_whip');
    
    this.updateStats(); 
  }
  
  updateStats() {
    this.damage = this.whipConfig.calculateDamage(this.level);
    this.cooldown = this.whipConfig.calculateCooldown(this.level);
    this.drawScale = this.whipConfig.calculateDrawScale(this.level);
    this.hitboxSize = (this.whipConfig.HITBOX_RADIUS || 30) * 1.1; 
    
    // count jest używany do określenia schematu ataku (zgodnie z opisem usera)
    // Lvl 1 -> count 1
    // Lvl 2 -> count 2
    // Lvl 3 -> count 3
    // Lvl 4+ -> count 4
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
      
      // Funkcja spawnuje hitbox
      // isPointBlank = true -> hitbox na graczu, NIEWIDZIALNY
      const spawnHitbox = (side, offsetIdx, isPointBlank = false) => {
        let hitboxX, hitboxY;
        let currentDrawScale = this.drawScale;

        if (isPointBlank) {
            hitboxX = this.player.x;
            hitboxY = this.player.y;
            currentDrawScale = 0; // FIX: Niewidzialny (skala 0)
        } else {
            const offsetDist = WHIP_BASE_OFFSET + (offsetIdx * WHIP_SPACING);
            hitboxX = this.player.x + (attackX * offsetDist * side);
            hitboxY = this.player.y + (attackY * offsetDist * side);
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
            side, 
            // Jeśli skala > 0 to dajemy animację, jeśli 0 (point blank) to null (brak rysowania)
            currentDrawScale > 0 ? animParams : null,
            this.player, 
            currentDrawScale 
          );
        }
      };
      
      // 1. ZAWSZE spawnuj niewidzialny hitbox na graczu (ochrona przed "wejściem w ciało")
      spawnHitbox(facingDir, 0, true);

      // 2. Logika poziomów (wizualne bicze)
      // Lvl 1: 1 przód
      if (this.count >= 1) { 
        spawnHitbox(facingDir, 0);
      } 
      
      // Lvl 2: 1 przód + 1 tył
      if (this.count >= 2) { 
        spawnHitbox(oppositeDir, 0);
      } 
      
      // Lvl 3: 2 przód + 1 tył
      if (this.count >= 3) { 
        spawnHitbox(facingDir, 1); // Drugi z przodu
      } 
      
      // Lvl 4+: 2 przód + 2 tył
      if (this.count >= 4) { 
        spawnHitbox(oppositeDir, 1); // Drugi z tyłu
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