// ==============
// DRAW.JS (v1.02 - Particle Batch Rendering)
// Lokalizacja: /js/core/draw.js
// ==============

import { drawIndicators } from '../managers/indicatorManager.js';
import { get as getAsset } from '../services/assets.js';
import { getLang } from '../services/i18n.js';
import { devSettings } from '../services/dev.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';
import { ENEMY_STATS, HUNGER_CONFIG } from '../config/gameData.js'; 

let backgroundPattern = null;
let generatedPatternScale = 0;

const renderList = [];

const SHADOW_OFFSETS = {
    'aggressive': 0.24, 'ranged': 0.25, 'elite': 0.24, 'wall': 0.25,       
    'kamikaze': 0.52, 'horde': 0.49, 'player': 0.42, 'default': 0.45,
    'lumberjack': 0.12 
};

function drawBackground(ctx, camera) {
    const TILE_SCALE = 0.25; 
    const bgTexture = getAsset('bg_grass');
    
    if (bgTexture) {
        if (!backgroundPattern || generatedPatternScale !== TILE_SCALE) {
            try {
                const tileWidth = bgTexture.width * TILE_SCALE;
                const tileHeight = bgTexture.height * TILE_SCALE;
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = tileWidth; offscreenCanvas.height = tileHeight;
                const offCtx = offscreenCanvas.getContext('2d');
                offCtx.imageSmoothingEnabled = false; 
                offCtx.drawImage(bgTexture, 0, 0, tileWidth, tileHeight);
                backgroundPattern = ctx.createPattern(offscreenCanvas, 'repeat');
                generatedPatternScale = TILE_SCALE; 
            } catch (e) { backgroundPattern = null; }
        }
        if (backgroundPattern) {
            ctx.fillStyle = backgroundPattern;
            ctx.fillRect(0, 0, camera.worldWidth, camera.worldHeight);
        }
    } else {
        ctx.fillStyle = '#252525'; ctx.fillRect(0, 0, camera.worldWidth, camera.worldHeight);
    }
}

function drawShadow(ctx, x, y, size, visualScale = 1.0, enemyType = 'default') {
    ctx.save();
    
    let offsetMult = SHADOW_OFFSETS[enemyType] || SHADOW_OFFSETS['default'];
    
    if (ENEMY_STATS[enemyType] && ENEMY_STATS[enemyType].shadowOffset !== undefined) {
        offsetMult = ENEMY_STATS[enemyType].shadowOffset;
    }
    
    const offset = (size * visualScale) * offsetMult;
    ctx.translate(x, y + offset); 
    ctx.scale(1 + (visualScale - 1) * 0.5, 0.3); 
    ctx.beginPath(); ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fill();
    ctx.restore();
}

function drawEnemyHealthBar(ctx, e) {
    if ((e.type !== 'tank' && e.type !== 'elite' && e.type !== 'wall' && e.type !== 'lumberjack') || !e.showHealthBar) return;
    
    const visualScale = e.visualScale || 1.5;
    const w = 40; const h = 6; const bx = -w / 2;
    const spriteH = e.size * visualScale;
    let yOffsetMod = 0;
    if (e.type === 'elite') yOffsetMod = 38; 
    else if (e.type === 'wall') yOffsetMod = 44;
    else if (e.type === 'lumberjack') yOffsetMod = 20; 
    
    const by = -(spriteH / 2) - 8 + yOffsetMod;
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.fillStyle = '#300'; ctx.fillRect(bx, by, w, h);
    const frac = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = frac > 0.6 ? '#0f0' : (frac > 0.3 ? '#ff0' : '#f00');
    ctx.fillRect(bx, by, w * frac, h);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, w, h);
    ctx.restore();
}

function drawFPS(ctx, fps, ui, canvas) {
    if (ui.showFPS) {
        ctx.fillStyle = (fps >= 55) ? '#66bb6a' : (fps >= 40 ? '#ffca28' : '#ef5350');
        ctx.font = 'bold 16px Arial'; ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'; ctx.shadowBlur = 4;
        const fpsText = `${fps} FPS`;
        if (ui.fpsPosition === 'right') { ctx.textAlign = 'right'; ctx.fillText(fpsText, canvas.width - 10, 20); } 
        else { ctx.textAlign = 'left'; ctx.fillText(fpsText, 10, 20); }
        ctx.shadowBlur = 0; 
    }
}

function drawEnemyWarning(ctx, game, canvas) {
    if (game.newEnemyWarningT > 0) {
        ctx.save();
        const alpha = Math.min(1, game.newEnemyWarningT);
        const blink = 0.5 + 0.5 * Math.sin(performance.now() / 100);
        ctx.globalAlpha = alpha * blink;
        ctx.font = 'bold 36px "VT323", monospace'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF5252'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
        const prefix = getLang('ui_warning_new_enemy') || 'NADCHODZI';
        const text = `${prefix}: ${game.newEnemyWarningType}`;
        const x = canvas.width / 2; const y = canvas.height * 0.2; 
        ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
        ctx.restore();
    }
}

function drawHungerVignette(ctx, game, canvas) {
    if (game.hunger > 0 || game.isDying) return;

    ctx.save();
    
    const pulse = (Math.sin(game.time * HUNGER_CONFIG.PULSE_SPEED) + 1) / 2; 
    const alpha = 0.3 + (pulse * 0.2); 

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.max(canvas.width, canvas.height) * 0.8;

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    grad.addColorStop(0, 'rgba(255, 0, 0, 0)'); 
    grad.addColorStop(1, `rgba(180, 0, 0, ${alpha})`); 

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.restore();
}

export function draw(ctx, state, ui, fps) {
    const { 
        canvas, game, stars, player, enemies, bullets, eBullets, 
        gems, pickups, chests, particles, hitTexts, bombIndicators, 
        hazards, camera, obstacles 
    } = state;
    
    const { pickupStyleEmoji, pickupShowLabels } = ui;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const cullMargin = 200; 
    const cullLeft = camera.offsetX - cullMargin;
    const cullRight = camera.offsetX + camera.viewWidth + cullMargin;
    const cullTop = camera.offsetY - cullMargin;
    const cullBottom = camera.offsetY + camera.viewHeight + cullMargin;

    ctx.save(); 
    if (game.shakeT > 0 && !game.screenShakeDisabled) {
        const t = game.shakeT / 200;
        const mag = game.shakeMag * t;
        ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
        game.shakeT -= 16;
        if (game.shakeT <= 0) game.shakeMag = 0;
    }
    ctx.translate(-camera.offsetX, -camera.offsetY);

    drawBackground(ctx, camera);
    ctx.globalAlpha = 1;

    // WARSTWA 1: PODŁOGA
    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.type === 'water' || obs.isRuined) {
                const r = obs.size;
                if (obs.x + r < cullLeft || obs.x - r > cullRight || obs.y + r < cullTop || obs.y - r > cullBottom) continue;
                obs.update(state.dt || 0.016, player); 
                obs.draw(ctx, player, game.time);
            }
        }
    }

    if (game.freezeT > 0) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        ctx.fillRect(camera.offsetX, camera.offsetY, camera.viewWidth, camera.viewHeight);
    }
    
    for (const h of hazards) {
        if (h.x + h.r < cullLeft || h.x - h.r > cullRight || h.y + h.r < cullTop || h.y - h.r > cullBottom) continue;
        h.draw(ctx);
    }

    // WARSTWA 2: CIENIE
    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.type === 'water' || obs.isRuined || !obs.hasShadow) continue;
            const r = obs.size; 
            if (obs.x + r < cullLeft || obs.x - r > cullRight || obs.y + r < cullTop || obs.y - r > cullBottom) continue;
            if (obs.drawShadow) obs.drawShadow(ctx);
        }
    }

    // WARSTWA 3: OBIEKTY SORTOWANE Y
    renderList.length = 0;
    if (!player.isDead) renderList.push(player);

    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const radius = (e.size / 2) * 1.5; 
        if (e.x + radius < cullLeft || e.x - radius > cullRight || e.y + radius < cullTop || e.y - radius > cullBottom) continue;
        renderList.push(e);
    }
    
    if (obstacles) {
        for (const obs of obstacles) {
            if (obs.type === 'water' || obs.isRuined) continue;
            const r = obs.size; 
            if (obs.x + r < cullLeft || obs.x - r > cullRight || obs.y + r < cullTop || obs.y - r > cullBottom) continue;
            
            obs.update(state.dt || 0.016, player);
            renderList.push(obs);
        }
    }
    
    for (const g of gems) {
        if (g.x < cullLeft || g.x > cullRight || g.y < cullTop || g.y > cullBottom) continue;
        g._renderType = 'gem'; renderList.push(g);
    }
    for (const p of pickups) {
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        p._renderType = 'pickup'; renderList.push(p);
    }
    for (const c of chests) {
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) continue;
        c._renderType = 'chest'; renderList.push(c);
    }

    renderList.sort((a, b) => a.y - b.y);

    for (let i = 0; i < renderList.length; i++) {
        const obj = renderList[i];
        
        if (obj.type === 'player') {
            drawShadow(ctx, obj.x, obj.y, obj.size, 1.0, 'player');
            obj.draw(ctx, game);
        } else if (obj.stats) { 
            if (!obj.isDead) {
                // ZMIANA: Sprawdzamy, czy cień nie jest wyłączony w statystykach (np. dla SnakeEater)
                if (obj.stats.hasShadow !== false) {
                    drawShadow(ctx, obj.x, obj.y, obj.size, obj.visualScale || 1.0, obj.type);
                }
                obj.draw(ctx, game);
                drawEnemyHealthBar(ctx, obj);
            }
        } else if (obj.draw && !obj._renderType) { 
             obj.draw(ctx, player, game.time);
        } else if (obj._renderType === 'gem') {
             if (obj.active) drawShadow(ctx, obj.x, obj.y, 10, 1.0, 'default');
             obj.draw(ctx);
        } else if (obj._renderType === 'pickup' || obj._renderType === 'chest') {
             drawShadow(ctx, obj.x, obj.y, 20, 1.0, 'default');
             obj.draw(ctx, pickupStyleEmoji, pickupShowLabels);
        }
    }

    if (player.weapons && !player.isDead) {
        for (const w of player.weapons) {
            if (w instanceof OrbitalWeapon && w.draw) w.draw(ctx);
        }
    }

    for (const b of bullets) {
        if (b.x < cullLeft || b.x > cullRight || b.y < cullTop || b.y > cullBottom) continue;
        b.draw(ctx);
    }
    for (const eb of eBullets) {
        if (eb.x < cullLeft || eb.x > cullRight || eb.y < cullTop || eb.y > cullBottom) continue;
        eb.draw(ctx);
    }
    
    // --- PARTICLE BATCH RENDERING (OPTYMALIZACJA) ---
    const batches = {}; // Grupy dla prostych cząsteczek

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        
        if (p.rotSpeed !== 0) {
            // Złożone cząsteczki (obrót) - rysujemy natychmiast (brak batchingu)
            ctx.save();
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        } else {
            // Proste cząsteczki - dodajemy do grupy
            // Kwantyzacja przezroczystości do 0.1, aby grupować podobne
            let alpha = Math.floor((p.life / p.maxLife) * 10) / 10;
            if (alpha <= 0) continue; 
            
            // Klucz grupy: kolor_alpha (np. "#ff0000_0.8")
            const key = p.color + '_' + alpha;
            
            if (!batches[key]) batches[key] = [];
            batches[key].push(p);
        }
    }

    // Rysowanie grup
    for (const key in batches) {
        const list = batches[key];
        if (list.length === 0) continue;
        
        const lastUnderscore = key.lastIndexOf('_');
        const color = key.substring(0, lastUnderscore);
        const alpha = parseFloat(key.substring(lastUnderscore + 1));
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        
        for (const p of list) {
            ctx.rect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
        
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    for (const b of bombIndicators) {
        if (b.x - b.maxRadius > cullRight || b.x + b.maxRadius < cullLeft || 
            b.y - b.maxRadius > cullBottom || b.y + b.maxRadius < cullTop) continue;
        
        const progress = b.life / b.maxLife; 
        
        if (b.type === 'shockwave') {
            const currentRadius = b.maxRadius * progress;
            const width = 20 * (1 - progress); 
            const alpha = 1 - progress; 
            ctx.save(); ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), currentRadius, 0, Math.PI * 2);
            if (b.isWallNuke) { ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`; ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.1})`; } 
            else { ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`; ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.1})`; }
            ctx.lineWidth = width; ctx.stroke(); ctx.fill(); ctx.restore();
            continue; 
        }

        const currentRadius = b.maxRadius * progress;
        const opacity = 0.9 * (1 - progress); 

        if (b.isSiege) {
            const pulse = 1 + 0.2 * Math.sin(b.life * 8);
            const r = b.maxRadius * pulse;
            ctx.lineWidth = 5; 
            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity})`; ctx.shadowColor = `rgba(255, 0, 255, 1.0)`; ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(255, 0, 255, ${0.15 * opacity})`; ctx.setLineDash([5, 3]);
            ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), r, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
            ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.shadowBlur = 4; ctx.shadowColor = '#000';
            ctx.fillText(Math.ceil(b.maxLife - b.life), Math.round(b.x), Math.round(b.y) + 8);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`; ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
            ctx.lineWidth = 3; ctx.setLineDash([10, 5]);
            ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), currentRadius, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    if (devSettings.debugHitboxes) {
        ctx.save(); ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FF00'; ctx.beginPath(); ctx.arc(player.x, player.y, player.size * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#FF0000'; for (const e of enemies) { ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = '#FFFF00'; for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.stroke(); }
        if (player.weapons) {
            player.weapons.forEach(w => { if (w instanceof OrbitalWeapon && w.items) { ctx.strokeStyle = '#00FFFF'; w.items.forEach(it => { ctx.beginPath(); ctx.arc(it.ox, it.oy, 15, 0, Math.PI * 2); ctx.stroke(); }); } });
        }
        if (obstacles) {
            ctx.strokeStyle = '#0000FF'; for (const o of obstacles) { if (o.isSolid) { ctx.beginPath(); ctx.arc(o.x, o.y, o.hitboxRadius || o.size/2, 0, Math.PI * 2); ctx.stroke(); } }
        }
        ctx.restore();
    }

    ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'; ctx.shadowBlur = 4;
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (ht.x < cullLeft || ht.x > cullRight || ht.y < cullTop || ht.y > cullBottom) continue;
        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); ctx.fillStyle = ht.color; ctx.fillText(ht.text, Math.round(ht.x), Math.round(ht.y) - 30);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    ctx.restore(); 

    // FAZA 2: UI
    if (player.isDead) {
        const progress = 1 - (player.deathTimer / player.deathDuration);
        const bloodAlpha = Math.min(0.8, progress * 1.5); 
        ctx.save();
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.2, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
        grad.addColorStop(0, `rgba(180, 0, 0, ${bloodAlpha * 0.6})`); grad.addColorStop(1, `rgba(100, 0, 0, ${bloodAlpha})`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (progress > 0.5) { ctx.fillStyle = `rgba(0, 0, 0, ${(progress - 0.5) * 2})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.restore();
    }

    drawHungerVignette(ctx, game, canvas);

    drawEnemyWarning(ctx, game, canvas);
    drawIndicators(ctx, state);
    drawFPS(ctx, fps, ui, canvas);
}