// ==============
// DRAW.JS (v0.67 - Ostateczne Usunięcie Logu)
// Lokalizacja: /js/core/draw.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from './utils.js';

// POPRAWKA v0.63c: Dodano 'fpsPosition' jako ostatni argument
// POPRAWKA v0.66: Dodano argument 'camera'
export function draw(ctx, canvas, game, stars, trails_deprecated, player, enemies, bullets, eBullets, gems, pickups, chests, particles, hitTexts, bombIndicators, confettis_deprecated, pickupStyleEmoji, pickupShowLabels, fps, showFPS, fpsPosition, camera) {
    
    // KLUCZOWA ZMIANA: Czyścimy, aby usunąć poprzednie klatki
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // --- Definicje kadrowania (Culling) ---
    // POPRAWKA v0.66: Użyj przesunięcia kamery, aby określić granice widoczności
    const cullMargin = 50; // 50px marginesu poza ekranem
    const cullLeft = camera.offsetX - cullMargin;
    const cullRight = camera.offsetX + camera.viewWidth + cullMargin;
    const cullTop = camera.offsetY - cullMargin;
    const cullBottom = camera.offsetY + camera.viewHeight + cullMargin;

    // Rysowanie gwiazd w tle
    /* POPRAWKA V0.66/0.67: WYŁĄCZONO RYSOWANIE GWIAZD (STARS) */
    /*
    for (const st of stars) {
        // POPRAWKA v0.66: Culling dla gwiazd (może ich być bardzo dużo)
        if (st.x < cullLeft || st.x > cullRight || st.y < cullTop || st.y > cullBottom) {
            continue;
        }
        const alpha = 0.3 + 0.4 * Math.sin((st.t || 0) * 2 + st.phase);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(st.x, st.y, st.size, st.size);
    }
    ctx.globalAlpha = 1;
    */
    
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
    
    // POPRAWKA v0.66: GŁÓWNA TRANSFORMACJA KAMERY
    // KLUCZOWY FIX: Zaokrąglenie Kamery jest już wykonane w gameLogic.js! Używamy camera.offsetX/Y.
    ctx.translate(-camera.offsetX, -camera.offsetY);
    // Log diagnostyczny (USUNIĘTY)

    // --- Rysowanie WZORU TŁA (MIGRACJA Z CSS DO CANVAS) ---
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
    // ----------------------------------------------------


    // --- Rysowanie Gwiazd ---
    for (const st of stars) {
        // POPRAWKA v0.66: Culling dla gwiazd (może ich być bardzo dużo)
        if (st.x < cullLeft || st.x > cullRight || st.y < cullTop || st.y > cullBottom) {
            continue;
        }
        /* WYŁĄCZONO RYSOWANIE GWIAZD (Pozostały tylko tło i obiekty)
        const alpha = 0.3 + 0.4 * Math.sin((st.t || 0) * 2 + st.phase);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(st.x, st.y, st.size, st.size);
        */
    }
    ctx.globalAlpha = 1;

    // Efekt zamrożenia (niebieska poświata)
    // POPRAWKA v0.66: Rysujemy efekt mrozu w świecie, a nie na ekranie.
    if (game.freezeT > 0) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        // Rysujemy na rozmiar widoku kamery
        ctx.fillRect(camera.offsetX, camera.offsetY, camera.viewWidth, camera.viewHeight);
    }

    // POPRAWKA v0.62: Usunięto pętlę 'trails'. Jest teraz w 'particles'.

    // Rysowanie gracza (delegowane do klasy)
    // Gracz jest nadal rysowany z ułamkowymi współrzędnymi dla płynnego ruchu
    player.draw(ctx, game);

    // Rysowanie wrogów (delegowane do klas)
    for (const e of enemies) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (e.x < cullLeft || e.x > cullRight || e.y < cullTop || e.y > cullBottom) {
            continue;
        }
        e.draw(ctx, game);
    }

    // Rysowanie pocisków (delegowane do klas)
    for (const b of bullets) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (b.x < cullLeft || b.x > cullRight || b.y < cullTop || b.y > cullBottom) {
            continue;
        }
        b.draw(ctx);
    }

    for (const eb of eBullets) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (eb.x < cullLeft || eb.x > cullRight || eb.y < cullTop || eb.y > cullBottom) {
            continue;
        }
        eb.draw(ctx);
    }

    // Rysowanie gemów (delegowane do klas)
    for (const g of gems) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (g.x < cullLeft || g.x > cullRight || g.y < cullTop || g.y > cullBottom) {
            continue;
        }
        // KLUCZOWY FIX: UPRASZCZA
        const originalX = g.x;
        const originalY = g.y;
        
        // Zastosowanie zaokrąglenia pozycji Gema
        g.x = Math.round(g.x);
        g.y = Math.round(g.y);
        
        g.draw(ctx);

        // Przywrócenie pierwotnej pozycji world (z ułamkami)
        g.x = originalX;
        g.y = originalY;
    }

    // Rysowanie pickupów (delegowane do klas)
    for (const p of pickups) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) {
            continue;
        }
        // KLUCZOWY FIX: UPRASZCZA
        const originalX = p.x;
        const originalY = p.y;
        
        // Zastosowanie zaokrąglenia pozycji Pickupa
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);

        p.draw(ctx, pickupStyleEmoji, pickupShowLabels);

        // Przywrócenie pierwotnej pozycji world (z ułamkami)
        p.x = originalX;
        p.y = originalY;
    }

    // Rysowanie skrzyń (delegowane do klas)
    for (const c of chests) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) {
            continue;
        }
        // KLUCZOWY FIX: UPRASZCZA
        const originalX = c.x;
        const originalY = c.y;
        
        // Zastosowanie zaokrąglenia pozycji Skrzyni
        c.x = Math.round(c.x);
        c.y = Math.round(c.y);

        c.draw(ctx, pickupStyleEmoji, pickupShowLabels);

        // Przywrócenie pierwotnej pozycji world (z ułamkami)
        c.x = originalX;
        c.y = originalY;
    }

    // POPRAWKA v0.62: Rysowanie cząsteczek (z puli)
    // Cząsteczki są szybkie, ale ich dryf jest mniej widoczny niż dryf stacjonarnych obiektów.
    for (let i = particles.length - 1; i >= 0; i--) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        const p = particles[i];
         if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) {
            continue;
        }
        // Delegujemy rysowanie do samej cząsteczki
        p.draw(ctx);
    }
    ctx.globalAlpha = 1; // Zresetuj alfę po cząsteczkach

    // Rysowanie wskaźnika bomby
    for (const b of bombIndicators) {
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
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
        // KLUCZOWY FIX: Zaokrąglenie pozycji rysowania dla wskaźników
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

    // POPRAWKA v0.62: Rysowanie tekstów obrażeń (z puli)
    
    // POPRAWKA v0.63b: Przeniesiono ustawienia fontu POZA pętlę!
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
            
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        // POPRAWKA v0.66: Culling w oparciu o granice kamery
        if (ht.x < cullLeft || ht.x > cullRight || ht.y < cullTop || ht.y > cullBottom) {
            continue;
        }

        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); 
        ctx.fillStyle = ht.color;
        
        // KLUCZOWY FIX: Zaokrąglenie pozycji rysowania dla tekstów
        const roundedHTX = Math.round(ht.x);
        const roundedHTY = Math.round(ht.y);
        
        ctx.fillText(ht.text, roundedHTX, roundedHTY);
    }
    // POPRAWKA v0.63: Zresetuj alfę i cień po pętli
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // POPRAWKA v0.66: Przywróć stan sprzed transformacji kamery, aby FPS był na ekranie
    ctx.restore(); 

    // Rysowanie licznika FPS (jest rysowany po restore, więc na Canvasie)
    if (showFPS) {
        ctx.fillStyle = (fps >= 55) ? '#66bb6a' : (fps >= 40 ? '#ffca28' : '#ef5350');
        ctx.font = 'bold 16px Arial';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        
        const fpsText = `${fps} FPS`;

        if (fpsPosition === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(fpsText, canvas.width - 10, 20);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(fpsText, 10, 20);
        }
        
        ctx.shadowBlur = 0; // Zresetuj cień
    }
}