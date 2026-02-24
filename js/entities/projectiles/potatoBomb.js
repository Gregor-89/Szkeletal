import { EnemyBullet } from '../bullet.js';
import { EFFECTS_CONFIG, WEAPON_CONFIG } from '../../config/gameData.js';
import { addBombIndicator, addHitText, limitedShake } from '../../core/utils.js';
import { get as getAsset } from '../../services/assets.js';
import { playSound } from '../../services/audio.js';
import { devSettings } from '../../services/dev.js';

export class PotatoBomb extends EnemyBullet {
    constructor(x, y, vx, vy, size, damage, color, life, type, rotation) {
        super(x, y, vx, vy, size, damage, color, life, type, rotation);
        this.baseZ = 40; // Starting height
        this.z = this.baseZ;
        this.vz = 80;   // Upward arc velocity
        this.gravity = 150;
        this.hasLanded = false;

        const bombConfig = WEAPON_CONFIG.AMENDA_BOMB;
        this.fuseTimer = bombConfig.FUSE_TIME;
        this.explosionRadius = bombConfig.RADIUS;
        this.explosionDamage = bombConfig.DAMAGE;

        this.sprite = getAsset('projectile_potato_bomb');
        this.width = bombConfig.SPRITE_WIDTH || 32;
        this.height = bombConfig.SPRITE_HEIGHT || 32;
        this.scale = 1.0;

        // We need the state reference to spawn the indicator on land
        this.gameStateRef = null;
    }

    init(x, y, vx, vy, size, damage, color, life, type, rotation, gameStateRef) {
        super.init(x, y, vx, vy, size, damage, color, life, type, rotation);
        this.gameStateRef = gameStateRef;
        this.hasLanded = false;
        this.z = 40;
        this.vz = 80;

        const bombConfig = WEAPON_CONFIG.AMENDA_BOMB;
        this.fuseTimer = bombConfig.FUSE_TIME;
        this.explosionRadius = bombConfig.RADIUS;
        this.explosionDamage = bombConfig.DAMAGE;

        this.sprite = getAsset('projectile_potato_bomb') || getAsset('pickup_bomb');
        this.width = bombConfig.SPRITE_WIDTH || 32;
        this.height = bombConfig.SPRITE_HEIGHT || 32;
    }

    update(dt) {
        if (!this.active) return;

        if (!this.hasLanded) {
            // Arc logic
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            this.z += this.vz * dt;
            this.vz -= this.gravity * dt;

            this.rotation += 5 * dt;

            // Touchdown
            if (this.z <= 0) {
                this.z = 0;
                this.hasLanded = true;

                // Spawn warning indicator
                if (this.gameStateRef && this.gameStateRef.bombIndicators) {
                    addBombIndicator(this.gameStateRef.bombIndicators, this.x, this.y, this.explosionRadius, this.fuseTimer);
                }
            }
        } else {
            // Fuse ticking
            this.fuseTimer -= dt;

            // Pulse effect before explosion
            this.scale = 1.0 + 0.2 * Math.sin(this.fuseTimer * 15);

            if (this.fuseTimer <= 0) {
                this.explode();
            }
        }
    }

    explode() {
        if (!this.gameStateRef) {
            this.release();
            return;
        }

        const state = this.gameStateRef;
        const player = state.player;

        // 1. Damage Player
        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if (distToPlayer <= this.explosionRadius) {
            const isInvulnerable = state.game.shield || devSettings.godMode;
            if (!isInvulnerable) {
                state.game.health -= this.explosionDamage;
                state.game.playerHitFlashT = 0.15;
                addHitText(state.hitTextPool, state.hitTexts, player.x, player.y - 20, this.explosionDamage, '#FF0000');
                playSound('PlayerHurt');
            }
        }

        // 2. Destroy Pickups and Gems
        const rSq = this.explosionRadius * this.explosionRadius;

        for (let i = state.pickups.length - 1; i >= 0; i--) {
            const p = state.pickups[i];
            const dx = this.x - p.x;
            const dy = this.y - p.y;
            if (dx * dx + dy * dy <= rSq) {
                state.pickups.splice(i, 1);
            }
        }

        for (let i = state.gems.length - 1; i >= 0; i--) {
            const g = state.gems[i];
            const dx = this.x - g.x;
            const dy = this.y - g.y;
            if (dx * dx + dy * dy <= rSq) {
                state.gems.splice(i, 1);
            }
        }

        // 3. Visuals using areaNuke (modified to not deal damage to enemies if we pass specific flags or handle it locally)
        playSound('Explosion');
        limitedShake(state.game, state.settings, 12, 200);

        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const p = state.particlePool.get();
            if (p) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (this.explosionRadius * 0.2);
                p.init(
                    this.x + Math.cos(angle) * dist,
                    this.y + Math.sin(angle) * dist,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    0.6,
                    '#D50000', // Red explosion
                    0, 0.95, 5
                );
            }
        }

        state.bombIndicators.push({
            type: 'shockwave',
            x: this.x,
            y: this.y,
            currentRadius: 10,
            maxRadius: this.explosionRadius,
            speed: this.explosionRadius * 4.0,
            isWallNuke: false,
            onlyXP: false,
            damage: 0, // IMPORTANT: Prevent collisions.js from adding enemy/hut damage
            hitEnemies: [], // Used to prevent multi-hit if we had enemies, here it's dummy
            life: 0,
            maxLife: 0.25
        });

        this.release();
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y - this.z);
        ctx.rotate(this.rotation);

        if (this.sprite) {
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#8D6E63'; // Brown placeholder
            ctx.beginPath();
            ctx.arc(0, 0, this.size * this.scale, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw shadow
        if (this.z > 0) {
            ctx.save();
            ctx.translate(this.x, this.y + 10);
            ctx.scale(1, 0.3);
            ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.4 - this.z / 200)})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
