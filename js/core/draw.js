// ==============
// DRAW.JS (v0.71 - Refaktoryzacja Głównej Pętli Rysowania)
// Lokalizacja: /js/core/draw.js
// ==============

// (Usunięto importy 'getPickup...', ponieważ są teraz w 'state' lub 'ui')

/**
 * NOWA Funkcja Pomocnicza (v0.71): Rysuje tło (siatkę).
 */
function drawBackground(ctx, camera) {
    const tileSize = 40;
    const color1 = '#2d2d2d';
    const color2 = '#252525';
    
    // Obliczanie początkowego punktu rysowania w oparciu o offset kamery
    const startX = Math.floor(camera.offsetX / tileSize) * tileSize;
    const startY = Math.floor(camera.offsetY / tileSize) * tileSize;
    
    // Rysowanie siatki w zasięgu widoku + mały margines
    for (let x = startX; x < camera.offsetX + camera.viewWidth + tileSize; x += tileSize) {
        for (let y = startY; y < camera.offsetY + camera.viewHeight + tileSize; y += tileSize) {
            
            // Określenie koloru dla kafelka (szachownica)
            const isOddX = (x / tileSize) % 2 !== 0;
            const isOddY = (y / tileSize) % 2 !== 0;
            const color = (isOddX === isOddY) ? color1 : color2;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}

/**
 * NOWA Funkcja Pomocnicza (v0.71): Rysuje licznik FPS.
 */
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
        
        ctx.shadowBlur = 0; // Zresetuj cień
    }
}

/**
 * GŁÓWNA FUNKCJA RYSOWANIA (v0.71)
 * Przyjmuje teraz tylko 'ctx', 'state' (gameStateRef) i 'ui' (uiData).
 */
export function draw(ctx, state, ui, fps) {
    
    // --- 1. Destrukturyzacja Obiektów Stanu ---
    const { 
        canvas, game, stars, player, enemies, bullets, eBullets, 
        gems, pickups, chests, particles, hitTexts, bombIndicators, 
        hazards, camera 
    } = state;
    
    const { 
        pickupStyleEmoji, pickupShowLabels
    } = ui;
    
    // KLUCZOWA ZMIANA: Czyścimy, aby usunąć poprzednie klatki
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // --- Definicje kadrowania (Culling) ---
    const cullMargin = 50; // 50px marginesu poza ekranem
    const cullLeft = camera.offsetX - cullMargin;
    const cullRight = camera.offsetX + camera.viewWidth + cullMargin;
    const cullTop = camera.offsetY - cullMargin;
    const cullBottom = camera.offsetY + camera.viewHeight + cullMargin;

    // Rysowanie gwiazd w tle (WYŁĄCZONO W v0.67)
    
    ctx.save(); // Zapisz stan (przed ewentualnym drżeniem ekranu)

    // Efekt drżenia ekranu
    if (game.shakeT > 0 && !game.screenShakeDisabled) {
        const t = game.shakeT / 200;
        const mag = game.shakeMag * t;
        const ox = (Math.random() * 2 - 1) * mag, oy = (Math.random() * 2 - 1) * mag;
        ctx.translate(ox, oy);
        game.shakeT -= 16;
        if (game.shakeT <= 0) game.shakeMag = 0;
    }
    
    // GŁÓWNA TRANSFORMACJA KAMERY
    ctx.translate(-camera.offsetX, -camera.offsetY);

    // --- Rysowanie WZORU TŁA (NOWA FUNKCJA) ---
    drawBackground(ctx, camera);
    
    // --- Rysowanie Gwiazd ---
    for (const st of stars) {
        if (st.x < cullLeft || st.x > cullRight || st.y < cullTop || st.y > cullBottom) {
            continue;
        }
        // (Logika rysowania gwiazd celowo wyłączona)
    }
    ctx.globalAlpha = 1;

    // Efekt zamrożenia (niebieska poświata)
    if (game.freezeT > 0) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        ctx.fillRect(camera.offsetX, camera.offsetY, camera.viewWidth, camera.viewHeight);
    }
    
    // Rysowanie Hazardów
    for (const h of hazards) {
        if (h.x + h.r < cullLeft || h.x - h.r > cullRight || h.y + h.r < cullTop || h.y - h.r > cullBottom) {
            continue;
        }
        const originalX = h.x;
        const originalY = h.y;
        h.x = Math.round(h.x);
        h.y = Math.round(h.y);
        h.draw(ctx);
        h.x = originalX;
        h.y = originalY;
    }

    // Rysowanie gracza (delegowane do klasy)
    player.draw(ctx, game);

    // Rysowanie wrogów (delegowane do klas)
    for (const e of enemies) {
        if (e.x < cullLeft || e.x > cullRight || e.y < cullTop || e.y > cullBottom) {
            continue;
        }
        e.draw(ctx, game);
    }

    // Rysowanie pocisków (delegowane do klas)
    for (const b of bullets) {
        if (b.x < cullLeft || b.x > cullRight || b.y < cullTop || b.y > cullBottom) {
            continue;
        }
        b.draw(ctx);
    }

    for (const eb of eBullets) {
        if (eb.x < cullLeft || eb.x > cullRight || eb.y < cullTop || eb.y > cullBottom) {
            continue;
        }
        eb.draw(ctx);
    }

    // Rysowanie gemów (delegowane do klas)
    for (const g of gems) {
        if (g.x < cullLeft || g.x > cullRight || g.y < cullTop || g.y > cullBottom) {
            continue;
        }
        const originalX = g.x;
        const originalY = g.y;
        g.x = Math.round(g.x);
        g.y = Math.round(g.y);
        g.draw(ctx);
        g.x = originalX;
        g.y = originalY;
    }

    // Rysowanie pickupów (delegowane do klas)
    for (const p of pickups) {
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) {
            continue;
        }
        const originalX = p.x;
        const originalY = p.y;
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
        // Użyj ustawień z 'ui'
        p.draw(ctx, pickupStyleEmoji, pickupShowLabels);
        p.x = originalX;
        p.y = originalY;
    }

    // Rysowanie skrzyń (delegowane do klas)
    for (const c of chests) {
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) {
            continue;
        }
        const originalX = c.x;
        const originalY = c.y;
        c.x = Math.round(c.x);
        c.y = Math.round(c.y);
        // Użyj ustawień z 'ui'
        c.draw(ctx, pickupStyleEmoji, pickupShowLabels);
        c.x = originalX;
        c.y = originalY;
    }

    // Rysowanie cząsteczek (z puli)
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
         if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) {
            continue;
        }
        p.draw(ctx);
    }
    ctx.globalAlpha = 1;

    // Rysowanie wskaźnika bomby
    for (const b of bombIndicators) {
        if (b.x - b.maxRadius > cullRight || b.x + b.maxRadius < cullLeft || 
            b.y - b.maxRadius > cullBottom || b.y + b.maxRadius < cullTop) {
            continue;
        }
        
        const progress = b.life / b.maxLife; // 0 do 1
        const currentRadius = b.maxRadius * progress;
        const opacity = 0.9 * (1 - progress); // Zanikanie

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        const roundedBX = Math.round(b.x);
        const roundedBY = Math.round(b.y);
        ctx.arc(roundedBX, roundedBY, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
        ctx.shadowBlur = 24;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Rysowanie tekstów obrażeń (z puli)
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
            
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        if (ht.x < cullLeft || ht.x > cullRight || ht.y < cullTop || ht.y > cullBottom) {
            continue;
        }
        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); 
        ctx.fillStyle = ht.color;
        const roundedHTX = Math.round(ht.x);
        const roundedHTY = Math.round(ht.y);
        ctx.fillText(ht.text, roundedHTX, roundedHTY);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Przywróć stan sprzed transformacji kamery
    ctx.restore(); 

    // Rysowanie licznika FPS (NOWA FUNKCJA, na Canvasie)
    drawFPS(ctx, fps, ui, canvas);
}