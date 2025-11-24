// ==============
// EFFECTS.JS (v0.99 - FIX: Complete & Optimized)
// Lokalizacja: /js/managers/effects.js
// ==============

import { limitedShake, addBombIndicator, findFreeSpotForPickup } from '../core/utils.js';
import { devSettings } from '../services/dev.js';
import { EFFECTS_CONFIG, HAZARD_CONFIG } from '../config/gameData.js';
import { Hazard } from '../entities/hazard.js';

import { HealPickup } from '../entities/pickups/healPickup.js';
import { MagnetPickup } from '../entities/pickups/magnetPickup.js';
import { ShieldPickup } from '../entities/pickups/shieldPickup.js';
import { SpeedPickup } from '../entities/pickups/speedPickup.js';
import { BombPickup } from '../entities/pickups/bombPickup.js';
import { FreezePickup } from '../entities/pickups/freezePickup.js';
import { Chest } from '../entities/chest.js';

export const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup,
    chest: Chest
};

const MIN_SEPARATION_BUFFER = 20;

function findHazardSpawnSpot(player, camera, hazards, hazardRadius) {
    const maxAttempts = 20;
    const worldWidth = camera.worldWidth;
    const worldHeight = camera.worldHeight;
    const viewMargin = 100;
    const viewLeft = camera.offsetX - viewMargin;
    const viewRight = camera.offsetX + camera.viewWidth + viewMargin;
    const viewTop = camera.offsetY - viewMargin;
    const viewBottom = camera.offsetY + camera.viewHeight + viewMargin;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x = viewLeft + Math.random() * (viewRight - viewLeft);
        let y = viewTop + Math.random() * (viewBottom - viewTop);
        
        x = Math.max(hazardRadius, Math.min(worldWidth - hazardRadius, x));
        y = Math.max(hazardRadius, Math.min(worldHeight - hazardRadius, y));
        
        const distToPlayer = Math.hypot(x - player.x, y - player.y);
        const safePlayerDist = HAZARD_CONFIG.MIN_DIST_FROM_PLAYER + hazardRadius;
        
        if (distToPlayer < safePlayerDist) continue;
        
        let isOverlapping = false;
        for (const h of hazards) {
            const dx = x - h.x;
            const dy = y - h.y;
            const dist = Math.hypot(dx, dy);
            const minSeparation = hazardRadius + h.r + MIN_SEPARATION_BUFFER;
            if (dist < minSeparation) {
                isOverlapping = true;
                break;
            }
        }
        
        if (isOverlapping) continue;
        
        return { x, y };
    }
    return null;
}

export function spawnHazard(hazards, player, camera) {
    if (hazards.length >= HAZARD_CONFIG.MAX_HAZARDS) return;
    
    const isMega = Math.random() < HAZARD_CONFIG.MEGA_HAZARD_PROBABILITY;
    let scale = 1;
    if (isMega) {
        const minScale = HAZARD_CONFIG.MEGA_HAZARD_BASE_MULTIPLIER;
        const maxScale = HAZARD_CONFIG.MEGA_HAZARD_MAX_MULTIPLIER;
        scale = minScale + Math.random() * (maxScale - minScale);
    }
    
    const radius = HAZARD_CONFIG.SIZE * scale;
    const pos = findHazardSpawnSpot(player, camera, hazards, radius);
    
    if (!pos) return;
    
    const newHazard = new Hazard(pos.x, pos.y, isMega, scale);
    hazards.push(newHazard);
}

export function updateParticles(dt, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
    }
}

export function updateVisualEffects(dt, hitTexts_deprecated, confettis_deprecated, bombIndicators) {
    for (let i = bombIndicators.length - 1; i >= 0; i--) {
        const b = bombIndicators[i];
        b.life += dt;
        if (b.life >= b.maxLife) {
            bombIndicators.splice(i, 1);
        }
    }
}