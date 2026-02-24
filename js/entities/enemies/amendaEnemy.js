import { Enemy } from '../enemy.js';
import { PotatoBomb } from '../projectiles/potatoBomb.js';
import { get as getAsset } from '../../services/assets.js';
import { playSound } from '../../services/audio.js';
import { WEAPON_CONFIG } from '../../config/gameData.js';

export class AmendaEnemy extends Enemy {
    constructor(x, y, stats, hpScale) {
        super(x, y, stats, hpScale);

        this.visualScale = 2.6;

        this.walkSprite = getAsset('enemy_amenda_walk');
        this.attackSprite = getAsset('enemy_amenda_attack');
        this.sprite = this.walkSprite || getAsset('enemy_amenda');

        this.cols = 4;
        this.rows = 4;
        this.totalFrames = 16;
        this.frameTime = 0.1;

        this.isAttacking = false;
        this.rangedConfig = stats;
        this.rangedCooldown = 1.0;

        this.showHealthBar = true;
        this.mass = 3.5;
    }

    getSeparationRadius() {
        return 70;
    }

    getOutlineColor() {
        return '#E040FB'; // Purple-ish 
    }

    update(dt, player, game, state) {
        if (this.isDead) return;

        if (this.hitStun > 0) this.hitStun -= dt;
        if (this.hitFlashT > 0) this.hitFlashT -= dt;
        const freezeMult = (game.freezeT > 0 ? 0.25 : 1);

        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // --- STATE MACHINE ---

        if (this.isAttacking) {
            // ATTACK STATE (Stand still to throw bomb)
            this.animTimer += dt;
            if (this.animTimer >= this.frameTime * 1.5) { // Slightly slower animation for wind-up feeling
                this.animTimer = 0;
                this.currentFrame++;

                // Throw bomb halfway through animation
                if (this.currentFrame === 8) {
                    this.performShoot(player, game, state, dx, dy, dist);
                }

                if (this.currentFrame >= this.totalFrames) {
                    this.isAttacking = false;
                    this.rangedCooldown = this.rangedConfig.attackCooldown / freezeMult;
                    this.sprite = this.walkSprite || getAsset('enemy_amenda');
                    this.currentFrame = 0;
                }
            }
            if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);

        } else {
            // WALK STATE
            let currentSpeed = 0;

            if (this.hitStun <= 0) {
                currentSpeed = this.handleMovement(dt, dx, dy, dist, game);
            }

            this.rangedCooldown -= dt;

            if (this.rangedCooldown <= 0 && dist < this.rangedConfig.attackRange && this.hitStun <= 0) {
                this.startAttack();
            }

            this.updateAnimation(dt, currentSpeed);
        }

        if (Math.abs(this.knockback.x) > 0.1 || Math.abs(this.knockback.y) > 0.1) {
            this.x += this.knockback.x * dt * 0.3;
            this.y += this.knockback.y * dt * 0.3;
            this.knockback.x *= 0.9;
            this.knockback.y *= 0.9;
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.sprite = this.attackSprite || getAsset('enemy_amenda');
        this.currentFrame = 0;
        this.animTimer = 0;
        playSound('EliteSpawn');
    }

    performShoot(player, game, state, dx, dy, dist) {
        if (!state.eBulletsPool) return;

        // Predict where the player is going or just throw directly at them if slow
        let targetX = player.x;
        let targetY = player.y;

        const bombConfig = WEAPON_CONFIG.AMENDA_BOMB;
        const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const flightSpeed = bombConfig.SPEED * (game.freezeT > 0 ? 0.3 : 1);

        // Use PotatoBomb specifically instead of generic EnemyBullet
        const bomb = new PotatoBomb(
            this.x, this.y,
            Math.cos(targetAngle) * flightSpeed,
            Math.sin(targetAngle) * flightSpeed,
            bombConfig.SIZE,
            bombConfig.DAMAGE,
            null, // color not heavily used as it has sprite
            Infinity,
            'bomb',
            targetAngle
        );

        // The object needs to access game state properly
        bomb.init(
            this.x, this.y,
            Math.cos(targetAngle) * flightSpeed,
            Math.sin(targetAngle) * flightSpeed,
            bombConfig.SIZE,
            bombConfig.DAMAGE,
            null,
            Infinity,
            'bomb',
            targetAngle,
            state
        );

        state.eBullets.push(bomb);
        playSound('Shoot');
    }

    handleMovement(dt, dx, dy, dist, game) {
        let vx = 0, vy = 0;
        let currentSpeed = this.getSpeed(game, dist);

        let moveAngle = Math.atan2(dy, dx);
        const optimalDist = 250;

        if (dist > optimalDist) {
            vx = Math.cos(moveAngle) * currentSpeed;
            vy = Math.sin(moveAngle) * currentSpeed;
        } else if (dist < optimalDist - 50) {
            vx = -Math.cos(moveAngle) * currentSpeed * 0.6;
            vy = -Math.sin(moveAngle) * currentSpeed * 0.6;
        } else {
            const strafeAngle = moveAngle + Math.PI / 2;
            vx = Math.cos(strafeAngle) * currentSpeed * 0.7;
            vy = Math.sin(strafeAngle) * currentSpeed * 0.7;
        }

        this.x += (vx + this.separationX * 0.5) * dt;
        this.y += (vy + this.separationY * 0.5) * dt;

        if (Math.abs(dx) > 10) this.facingDir = Math.sign(dx);

        return Math.hypot(vx, vy);
    }

    takeDamage(amount, source) {
        // Bosses take scaled damage so they don't melt instantly from base flat DMG values
        const scaledAmount = amount / (this.hpScale || 1);
        return super.takeDamage(scaledAmount, source);
    }

    drawHealthBar(ctx) {
        if (!this.showHealthBar) return;
        ctx.save();
        if (this.facingDir === -1) ctx.scale(-1, 1);
        const w = 60; const h = 8; const frac = Math.max(0, this.hp / this.maxHp);
        const bx = -w / 2; const spriteH = this.size * this.visualScale; const by = -(spriteH / 2) - 15;
        ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#E040FB';
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, w, h);
        ctx.restore();
    }
}
