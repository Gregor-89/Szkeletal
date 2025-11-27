// ==============
// DRAW.JS (v0.96 - OPTIMIZED: Static Render List)
// Lokalizacja: /js/core/draw.js
// ==============

import { drawIndicators } from '../managers/indicatorManager.js';
import { get as getAsset } from '../services/assets.js';
import { getLang } from '../services/i18n.js';
import { devSettings } from '../services/dev.js';
import { OrbitalWeapon } from '../config/weapons/orbitalWeapon.js';

let backgroundPattern = null;
let generatedPatternScale = 0;

// OPTYMALIZACJA v0.96: Statyczna lista renderowania, aby uniknąć alokacji pamięci w każdej klatce
const renderList = [];

const SHADOW_OFFSETS = {
    'aggressive': 0.24, 
    'ranged': 0.25,
    'elite': 0.24,
    'wall': 0.25,       
    'kamikaze': 0.52,   
    'horde': 0.49,      
    'player': 0.42,     
    'default': 0.45     
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
                offscreenCanvas.width = tileWidth;
                offscreenCanvas.height = tileHeight;
                const offCtx = offscreenCanvas.getContext('2d');
                offCtx.imageSmoothingEnabled = false; 
                offCtx.drawImage(bgTexture, 0, 0, tileWidth, tileHeight);
                backgroundPattern = ctx.createPattern(offscreenCanvas, 'repeat');
                generatedPatternScale = TILE_SCALE; 
            } catch (e) {
                backgroundPattern = null; 
            }
        }
        if (backgroundPattern) {
            ctx.fillStyle = backgroundPattern;
            ctx.fillRect(0, 0, camera.worldWidth, camera.worldHeight);
        }
    } else {
        const tileSize = 40;
        const startX = Math.floor(camera.offsetX / tileSize) * tileSize;
        const startY = Math.floor(camera.offsetY / tileSize) * tileSize;
        for (let x = startX; x < camera.offsetX + camera.viewWidth + tileSize; x += tileSize) {
            for (let y = startY; y < camera.offsetY + camera.viewHeight + tileSize; y += tileSize) {
                const isOddX = (x / tileSize) % 2 !== 0;
                const isOddY = (y / tileSize) % 2 !== 0;
                ctx.fillStyle = (isOddX === isOddY) ? '#2d2d2d' : '#252525';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }
}

function drawShadow(ctx, x, y, size, visualScale = 1.0, enemyType = 'default') {
    ctx.save();
    const offsetMult = SHADOW_OFFSETS[enemyType] || SHADOW_OFFSETS['default'];
    const offset = (size * visualScale) * offsetMult;
    ctx.translate(x, y + offset); 
    ctx.scale(1 + (visualScale - 1) * 0.5, 0.3); 
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.restore();
}

function drawEnemyHealthBar(ctx, e) {
    if ((e.type !== 'tank' && e.type !== 'elite' && e.type !== 'wall') || !e.showHealthBar) return;

    const visualScale = e.visualScale || 1.5;
    const w = 40; 
    const h = 6;
    
    const bx = -w / 2;
    const spriteH = e.size * visualScale;
    
    let yOffsetMod = 0;
    if (e.type === 'elite') {
        yOffsetMod = 38; 
    } else if (e.type === 'wall') {
        yOffsetMod = 44; 
    }

    const by = -(spriteH / 2) - 8 + yOffsetMod;
    
    ctx.save();
    ctx.translate(e.x, e.y);
    
    ctx.fillStyle = '#300';
    ctx.fillRect(bx, by, w, h);
    
    const frac = Math.max(0, e.hp / e.maxHp);
    let hpColor;
    if (frac > 0.6) hpColor = '#0f0';
    else if (frac > 0.3) hpColor = '#ff0';
    else hpColor = '#f00';
    
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, w * frac, h);
    
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, w, h);
    
    ctx.restore();
}

function drawFPS(ctx, fps, ui, canvas) {
    if (ui.showFPS) {
        ctx.fillStyle = (fps >= 55) ? '#66bb6a' : (fps >= 40 ? '#ffca28' : '#ef5350');
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        const fpsText = `${fps} FPS`;
        if (ui.fpsPosition === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(fpsText, canvas.width - 10, 20);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(fpsText, 10, 20);
        }
        ctx.shadowBlur = 0; 
    }
}

export function draw(ctx, state, ui, fps) {
    const { 
        canvas, game, stars, player, enemies, bullets, eBullets, 
        gems, pickups, chests, particles, hitTexts, bombIndicators, 
        hazards, camera 
    } = state;
    
    const { pickupStyleEmoji, pickupShowLabels } = ui;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const cullMargin = 150; 
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

    if (game.freezeT > 0) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        ctx.fillRect(camera.offsetX, camera.offsetY, camera.viewWidth, camera.viewHeight);
    }
    
    for (const h of hazards) {
        if (h.x + h.r < cullLeft || h.x - h.r > cullRight || h.y + h.r < cullTop || h.y - h.r > cullBottom) continue;
        h.draw(ctx);
    }

    // --- FIX: Z-INDEX SORTING (Optimized for v0.96) ---
    // Czyścimy listę bez tworzenia nowej tablicy
    renderList.length = 0;

    // 1. Dodaj Gracza
    renderList.push(player);

    // 2. Dodaj Wrogów (z Cullingiem)
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const radius = (e.size / 2) * 1.5; 
        if (e.x + radius < cullLeft || e.x - radius > cullRight || e.y + radius < cullTop || e.y - radius > cullBottom) continue;
        renderList.push(e);
    }

    // 3. Sortuj po osi Y (im wyższe Y = niżej na ekranie = bliżej kamery = rysowane później)
    renderList.sort((a, b) => a.y - b.y);

    // 4. Rysuj posortowane obiekty (bez wrapperów)
    for (let i = 0; i < renderList.length; i++) {
        const obj = renderList[i];
        
        if (obj.type === 'player') {
            drawShadow(ctx, obj.x, obj.y, obj.size, 1.0, 'player');
            obj.draw(ctx, game);
        } else {
            // Enemy
            if (!obj.isDead) {
                drawShadow(ctx, obj.x, obj.y, obj.size, obj.visualScale || 1.0, obj.type);
                obj.draw(ctx, game);
                drawEnemyHealthBar(ctx, obj);
            }
        }
    }
    // -----------------------------------------------

    if (player.weapons) {
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
    for (const g of gems) {
        if (g.x < cullLeft || g.x > cullRight || g.y < cullTop || g.y > cullBottom) continue;
        if (g.active) drawShadow(ctx, g.x, g.y, 10, 1.0, 'default');
        g.draw(ctx);
    }
    for (const p of pickups) {
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        drawShadow(ctx, p.x, p.y, 20, 1.0, 'default');
        p.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }
    for (const c of chests) {
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) continue;
        drawShadow(ctx, c.x, c.y, 30, 1.0, 'default');
        c.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        p.draw(ctx);
    }

    ctx.globalAlpha = 1;

    for (const b of bombIndicators) {
        if (b.x - b.maxRadius > cullRight || b.x + b.maxRadius < cullLeft || 
            b.y - b.maxRadius > cullBottom || b.y + b.maxRadius < cullTop) continue;
        
        const progress = b.life / b.maxLife; 
        const currentRadius = b.maxRadius * progress;
        const opacity = 0.9 * (1 - progress); 

        if (b.isSiege) {
            const pulse = 1 + 0.2 * Math.sin(b.life * 8);
            const r = b.maxRadius * pulse;
            const dash = [5, 3];
            
            ctx.lineWidth = 5; 
            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity})`; 
            ctx.shadowColor = `rgba(255, 0, 255, 1.0)`;
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(255, 0, 255, ${0.15 * opacity})`;
            
            ctx.setLineDash(dash);
            ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), r, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
            
            ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.shadowBlur = 4; ctx.shadowColor = '#000';
            ctx.fillText(Math.ceil(b.maxLife - b.life), Math.round(b.x), Math.round(b.y) + 8);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), currentRadius, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    if (devSettings.debugHitboxes) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FF00'; ctx.beginPath(); ctx.arc(player.x, player.y, player.size * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#FF0000'; for (const e of enemies) { ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = '#FFFF00'; for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.stroke(); }
        if (player.weapons) {
            player.weapons.forEach(w => {
                if (w instanceof OrbitalWeapon && w.items) {
                    ctx.strokeStyle = '#00FFFF'; w.items.forEach(it => { ctx.beginPath(); ctx.arc(it.ox, it.oy, 15, 0, Math.PI * 2); ctx.stroke(); });
                }
            });
        }
        ctx.restore();
    }

    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
            
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (ht.x < cullLeft || ht.x > cullRight || ht.y < cullTop || ht.y > cullBottom) continue;
        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); 
        ctx.fillStyle = ht.color;
        ctx.fillText(ht.text, Math.round(ht.x), Math.round(ht.y) - 30);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.restore(); 

    if (game.newEnemyWarningT > 0 && game.newEnemyWarningType) {
        const warningText = `${getLang('ui_hud_new_enemy')}: ${game.newEnemyWarningType}`;
        const canvasCenterX = canvas.width / 2;
        const warningY = 50; 
        const alpha = Math.min(1, 0.5 + 0.5 * Math.sin(performance.now() / 80));
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff7043'; 
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'; ctx.shadowBlur = 8;
        ctx.fillText(warningText, canvasCenterX, warningY); 
        ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#fff'; ctx.shadowBlur = 4;
        ctx.fillText(`${getLang('ui_hud_spawn_in')}: ${game.newEnemyWarningT.toFixed(1)}s`, canvasCenterX, warningY + 25); 
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    drawIndicators(ctx, state);
    drawFPS(ctx, fps, ui, canvas);

    ctx.restore(); 
}