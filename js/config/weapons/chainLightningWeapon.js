// ==============
// CHAINLIGHTNINGWEAPON.JS (v0.99 - Sound Fix)
// Lokalizacja: /js/config/weapons/chainLightningWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { playSound } from '../../services/audio.js';
import { PERK_CONFIG } from '../gameData.js';
import { addHitText } from '../../core/utils.js';
import { killEnemy } from '../../managers/enemyManager.js';

export class ChainLightningWeapon extends Weapon {
    constructor(player) {
        super(player);
        this.level = 1;
        this.damage = PERK_CONFIG.chainLightning.calculateDamage(this.level);
        this.cooldownTimer = 0;
        this.cooldownMax = PERK_CONFIG.chainLightning.calculateCooldown(this.level);
        this.maxTargets = PERK_CONFIG.chainLightning.calculateTargets(this.level);
        
        this.range = 320; 
        
        this.activeBolts = []; 
    }

    upgrade(perk) {
        if (this.level >= perk.max) return;
        this.level++;
        this.damage = PERK_CONFIG.chainLightning.calculateDamage(this.level);
        this.cooldownMax = PERK_CONFIG.chainLightning.calculateCooldown(this.level);
        this.maxTargets = PERK_CONFIG.chainLightning.calculateTargets(this.level);
    }

    update(state) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= state.dt;
        } else {
            this.attack(state);
            this.cooldownTimer = this.cooldownMax;
        }

        for (let i = this.activeBolts.length - 1; i >= 0; i--) {
            this.activeBolts[i].life -= state.dt;
            if (this.activeBolts[i].life <= 0) {
                this.activeBolts.splice(i, 1);
            }
        }
    }

    attack(state) {
        const { player, enemies, hitTextPool, hitTexts, particlePool } = state;
        
        let initialTarget = null;
        let minDist = this.range;

        for (const e of enemies) {
            if (e.dying) continue;
            const dist = Math.hypot(e.x - player.x, e.y - player.y);
            if (dist < minDist) {
                minDist = dist;
                initialTarget = e;
            }
        }

        if (!initialTarget) return; 

        // FIX: Poprawiona nazwa dźwięku (zgodna z audio.js)
        playSound('ChainLightning');
        
        const hitEnemies = [initialTarget];
        let currentTarget = initialTarget;
        
        for (let i = 0; i < this.maxTargets - 1; i++) {
            let nextTarget = null;
            let nextMinDist = this.range * 0.8; 

            for (const e of enemies) {
                if (e.dying || hitEnemies.includes(e)) continue;
                const dist = Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y);
                if (dist < nextMinDist) {
                    nextMinDist = dist;
                    nextTarget = e;
                }
            }

            if (nextTarget) {
                hitEnemies.push(nextTarget);
                currentTarget = nextTarget;
            } else {
                break; 
            }
        }

        let prevX = player.x;
        let prevY = player.y - 20; 

        for (const e of hitEnemies) {
            const isDead = e.takeDamage(this.damage, 'lightning');
            
            addHitText(hitTextPool, hitTexts, e.x, e.y - 40, this.damage, '#FFEB3B'); 
            
            this.activeBolts.push({
                x1: prevX, y1: prevY,
                x2: e.x, y2: e.y,
                life: PERK_CONFIG.chainLightning.VISUAL_DURATION || 0.25
            });

            if (isDead) {
                const idx = enemies.indexOf(e);
                if (idx !== -1) {
                    state.enemyIdCounter = killEnemy(idx, e, state.game, state.settings, enemies, particlePool, state.gemsPool, state.pickups, state.enemyIdCounter, state.chests);
                }
            }

            prevX = e.x;
            prevY = e.y;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const bolt of this.activeBolts) {
            const alpha = bolt.life / 0.25;
            ctx.globalAlpha = alpha;
            
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFEB3B';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(bolt.x1, bolt.y1);
            
            const dx = bolt.x2 - bolt.x1;
            const dy = bolt.y2 - bolt.y1;
            const dist = Math.hypot(dx, dy);
            
            const segments = Math.max(2, Math.floor(dist / 20));
            const jitter = 10; 
            
            for (let i = 1; i <= segments; i++) {
                const frac = i / segments;
                let tx = bolt.x1 + dx * frac;
                let ty = bolt.y1 + dy * frac;
                
                if (i < segments) {
                    tx += (Math.random() - 0.5) * jitter;
                    ty += (Math.random() - 0.5) * jitter;
                }
                ctx.lineTo(tx, ty);
            }
            
            ctx.stroke();
        }
        
        ctx.restore();
    }
}