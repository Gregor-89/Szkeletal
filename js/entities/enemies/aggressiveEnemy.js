// ==============
// AGGRESSIVEENEMY.JS (v1.01 - Knockback Fix v0.100)
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
    
    this.visualScale = 3.0;

    this.isSignaling = false; 
    this.chargeTimer = 0.0;
    this.chargeDuration = 0.4; 
    
    this.chargeSpeedBonus = 2.0; 
    
    this.cooldownTimer = 0; 

    // ZMIANA: Zmniejszono bazową odporność na knockback (łatwiejszy do odepchnięcia)
    this.knockbackResistance = 0.4; 
  }
  
  // ZMIANA: Nadpisujemy applyKnockback, aby "zepsuć" szarżę przy trafieniu
  applyKnockback(kx, ky) {
      if (this.frozenTimer > 0) return;
      
      // Aplikujemy standardowy knockback (z uwzględnieniem resistance)
      const resist = this.knockbackResistance || 0;
      this.knockback.x = kx * (1 - resist);
      this.knockback.y = ky * (1 - resist);
      
      // Jeśli szarżuje (cooldownTimer > 0 to faza ataku po sygnalizacji)
      if (this.cooldownTimer > 0) {
          // "Zachwianie": Zmniejszamy czas trwania szarży (szybciej się skończy)
          this.cooldownTimer -= 0.15; 
          // Oraz fizycznie go cofamy od razu o mały kawałek (tzw. hard push)
          this.x += this.knockback.x * 0.1; // 10% siły jako natychmiastowe przesunięcie
          this.y += this.knockback.y * 0.1;
      }
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
        // Jeśli dostał knockback, szarża zwalnia drastycznie na chwilę
        if (Math.abs(this.knockback.x) > 50 || Math.abs(this.knockback.y) > 50) {
            speed *= 0.1; // Prawie stop przy silnym uderzeniu
        }
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
                    
                    // Podczas szarży (start cooldownTimer) zwiększamy odporność
                    this.knockbackResistance = 0.5; 
                }
            } else {
                this.cooldownTimer -= dt;
                // Reset odporności po zakończeniu szarży
                if (this.cooldownTimer <= 0) {
                    this.knockbackResistance = 0.4;
                }
            }
        } else {
            this.isSignaling = false;
            if (this.cooldownTimer > 0) {
                 this.cooldownTimer -= dt;
                 if (this.cooldownTimer <= 0) {
                    this.knockbackResistance = 0.4;
                }
            }
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
    
    // Knockback (silniejszy efekt hamowania)
    if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
        this.x += this.knockback.x * dt;
        this.y += this.knockback.y * dt;
        this.knockback.x *= 0.85; // Szybsze wygaszanie, ale większy initial impact w applyKnockback
        this.knockback.y *= 0.85;
    }
    
    // --- RĘCZNA ANIMACJA ---
    if (this.totalFrames > 1) {
        let animSpeedMult = 1.0;
        
        if (this.isSignaling) {
            animSpeedMult = 0;
        } 
        else if (this.cooldownTimer > 0) {
            animSpeedMult = 1.3; 
        } 
        else {
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