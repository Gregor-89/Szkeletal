// ==============
// AGGRESSIVEENEMY.JS (v0.93 - FIX: Wolniejsza Animacja i Szarża)
// Lokalizacja: /js/entities/enemies/aggressiveEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Agresywny (Prowokator).
 * 1. Podchodzi wolno (skrada się).
 * 2. Zatrzymuje się i MIGA NA CZERWONO (Sygnalizacja).
 * 3. Szarżuje.
 */
export class AggressiveEnemy extends Enemy {
  
  constructor(x, y, stats, hpScale) {
    super(x, y, stats, hpScale);
    
    // Skala wizualna (3.0 = ~90px)
    this.visualScale = 3.0;

    // Zmienne logiczne
    this.isSignaling = false; 
    this.chargeTimer = 0.0;
    this.chargeDuration = 0.4; 
    
    // KOREKTA PRĘDKOŚCI: Zmniejszono z 2.2 na 2.0 (jeszcze odrobinę wolniej)
    this.chargeSpeedBonus = 2.0; 
    
    this.cooldownTimer = 0; 
  }
  
  getSpeed(game, dist) {
    let speed = super.getSpeed(game, dist);
    
    // 1. FAZA SYGNALIZACJI: STOP
    if (this.isSignaling) {
        return 0;
    }
    
    // 2. FAZA SZARŻY: SZYBKO
    if (this.cooldownTimer > 0) {
        speed *= this.chargeSpeedBonus;
    } 
    // 3. FAZA NORMALNA: WOLNO (SKRADANIE)
    else {
        speed *= 0.5; 
    }
    
    return speed;
  }
  
  getOutlineColor() {
    if (this.isSignaling || this.cooldownTimer > 0) {
        return '#f44336'; 
    }
    return '#42a5f5';
  }

  /**
   * Efekt migania przed atakiem.
   */
  draw(ctx, game) {
      ctx.save();
      
      if (this.isSignaling) {
          if (Math.floor(game.time * 15) % 2 === 0) {
              ctx.filter = 'sepia(1) saturate(100) hue-rotate(-50deg)'; 
          }
      }
      
      super.draw(ctx, game);
      
      ctx.restore();
  }
  
  update(dt, player, game, state) {
    if (this.isDead) return;

    // Obsługa Timerów
    if (this.hitStun > 0) this.hitStun -= dt;
    if (this.hitFlashT > 0) this.hitFlashT -= dt;
    if (this.frozenTimer > 0) {
        this.frozenTimer -= dt;
        return;
    }

    // Logika Ruchu i Szarży
    if (this.hitStun > 0) {
        this.isSignaling = false; 
    } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // --- MASZYNA STANÓW SZARŻY ---
        
        if (dist < 220) { 
            if (!this.isSignaling && this.cooldownTimer <= 0) {
                this.isSignaling = true;
                this.chargeTimer = this.chargeDuration;
                
            } else if (this.isSignaling) {
                this.chargeTimer -= dt;
                if (this.chargeTimer <= 0) {
                    this.isSignaling = false;
                    this.cooldownTimer = 1.5; 
                }
            } else {
                this.cooldownTimer -= dt;
            }
        } else {
            this.isSignaling = false;
            if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
        }
        
        // --- FIZYKA RUCHU ---
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist); 

        if (dist > 0.1 && currentSpeed > 0) { 
            const targetAngle = Math.atan2(dy, dx);
            vx = Math.cos(targetAngle) * currentSpeed;
            vy = Math.sin(targetAngle) * currentSpeed;
            
            if (Math.abs(vx) > 0.1) {
                this.facingDir = Math.sign(vx);
            }
        }
        
        this.x += (vx + this.separationX * 1.0) * dt;
        this.y += (vy + this.separationY * 1.0) * dt;
    }
    
    // Knockback
    if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
        this.x += this.knockback.x * dt;
        this.y += this.knockback.y * dt;
        this.knockback.x *= 0.9;
        this.knockback.y *= 0.9;
    }
    
    // --- RĘCZNA ANIMACJA (KOREKTA PRĘDKOŚCI) ---
    if (this.totalFrames > 1) {
        let animSpeedMult = 1.0;
        
        if (this.isSignaling) {
            // Podczas ostrzegania (stoi) - zatrzymaj animację
            animSpeedMult = 0;
        } 
        else if (this.cooldownTimer > 0) {
            // Podczas SZARŻY (biegnie szybko) - lekko przyspiesz
            // (Było 2.5, teraz 1.3 - o połowę wolniej niż wcześniej)
            animSpeedMult = 1.3; 
        } 
        else {
            // Podczas SKRADANIA (biegnie wolno) - zwolnij
            // (Było 1.0, teraz 0.6 - pasuje do speed * 0.5)
            animSpeedMult = 0.6;
        }
        
        this.animTimer += dt * animSpeedMult;
        if (this.animTimer >= this.frameTime) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }
  }
}