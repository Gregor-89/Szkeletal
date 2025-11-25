// ==============
// DRAW.JS (v0.94f - FIX: Shadows & HitText)
// Lokalizacja: /js/core/draw.js
// ==============

import { drawIndicators } from '../managers/indicatorManager.js';
import { get as getAsset } from '../services/assets.js';
import { getLang } from '../services/i18n.js';
import { devSettings } from '../services/dev.js';

let backgroundPattern = null;
let generatedPatternScale = 0;

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
        // Fallback grid
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

// FIX: Funkcja rysująca cień
function drawShadow(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y + size * 0.4); // Cień pod nogami
    ctx.scale(1, 0.3); // Spłaszczone koło (elipsa)
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
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
        h.draw(ctx); // Hazardy rysują się same (pamiętaj, że mają własny translate w draw)
    }

    // FIX: Rysowanie cieni (Gracz)
    drawShadow(ctx, player.x, player.y, player.size);
    player.draw(ctx, game);

    const enemiesToDraw = [];
    for (const e of enemies) {
        const radius = (e.size / 2) * 1.5; 
        if (e.x + radius < cullLeft || e.x - radius > cullRight || e.y + radius < cullTop || e.y - radius > cullBottom) continue;
        enemiesToDraw.push(e);
    }
    enemiesToDraw.sort((a, b) => a.y - b.y);

    for (const e of enemiesToDraw) {
        // FIX: Rysowanie cieni (Wrogowie)
        if (!e.isDead) drawShadow(ctx, e.x, e.y, e.size);
        e.draw(ctx, game);
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
        // FIX: Cień gema (opcjonalne, ale ładne)
        if (g.active) drawShadow(ctx, g.x, g.y, 10);
        g.draw(ctx);
    }

    for (const p of pickups) {
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        drawShadow(ctx, p.x, p.y, 20);
        p.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }

    for (const c of chests) {
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) continue;
        drawShadow(ctx, c.x, c.y, 30);
        c.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
         if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) continue;
        p.draw(ctx);
    }
    ctx.globalAlpha = 1;

    // Bomb Indicators (Siege/Nuke)
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
            
            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity * 0.9})`; 
            ctx.shadowColor = `rgba(255, 0, 255, ${opacity * 0.9})`;
            ctx.setLineDash(dash);
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(Math.round(b.x), Math.round(b.y), r, 0, Math.PI * 2); 
            ctx.stroke();
            
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillText(Math.ceil(b.maxLife - b.life), Math.round(b.x), Math.round(b.y) + 5);
            
        } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(Math.round(b.x), Math.round(b.y), currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
    }

    // Hitboxes Debug
    if (devSettings.debugHitboxes) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FF00';
        ctx.beginPath(); ctx.arc(player.x, player.y, player.size * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#FF0000';
        for (const e of enemies) {
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }

    // Hit Texts
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
            
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (ht.x < cullLeft || ht.x > cullRight || ht.y < cullTop || ht.y > cullBottom) continue;
        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); 
        ctx.fillStyle = ht.color;
        // FIX: Podniesienie tekstu o 30px
        ctx.fillText(ht.text, Math.round(ht.x), Math.round(ht.y) - 30);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.restore(); 

    // HUD Elements (Warnings)
    if (game.newEnemyWarningT > 0 && game.newEnemyWarningType) {
        const warningText = `${getLang('ui_hud_new_enemy')}: ${game.newEnemyWarningType}`;
        const canvasCenterX = canvas.width / 2;
        const warningY = 50; 
        const alpha = Math.min(1, 0.5 + 0.5 * Math.sin(performance.now() / 80));
        
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 24px Arial'; 
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff7043'; 
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(warningText, canvasCenterX, warningY); 
        ctx.font = 'bold 16px Arial'; 
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 4;
        ctx.fillText(`${getLang('ui_hud_spawn_in')}: ${game.newEnemyWarningT.toFixed(1)}s`, canvasCenterX, warningY + 25); 
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawIndicators(ctx, state);
    drawFPS(ctx, fps, ui, canvas);
}