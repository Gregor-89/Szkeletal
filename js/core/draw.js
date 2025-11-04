// ==============
// DRAW.JS (v0.62 - Viewport Culling i Pula Obiektów)
// Lokalizacja: /js/core/draw.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from './utils.js';

// POPRAWKA v0.62: 'trails' i 'confettis' są teraz częścią 'particles'
export function draw(ctx, canvas, game, stars, trails_deprecated, player, enemies, bullets, eBullets, gems, pickups, chests, particles, hitTexts, bombIndicators, confettis_deprecated, pickupStyleEmoji, pickupShowLabels, fps, showFPS) {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Wyczyść canvas

    // --- Definicje kadrowania (Culling) ---
    const cullMargin = 50; // 50px marginesu poza ekranem
    const cullLeft = -cullMargin;
    const cullRight = canvas.width + cullMargin;
    const cullTop = -cullMargin;
    const cullBottom = canvas.height + cullMargin;

    // Rysowanie gwiazd w tle
    for (const st of stars) {
        const alpha = 0.3 + 0.4 * Math.sin((st.t || 0) * 2 + st.phase);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(st.x, st.y, st.size, st.size);
    }
    ctx.globalAlpha = 1;

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

    // Efekt zamrożenia (niebieska poświata)
    if (game.freezeT > 0) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // POPRAWKA v0.62: Usunięto pętlę 'trails'. Jest teraz w 'particles'.

    // Rysowanie gracza (delegowane do klasy)
    player.draw(ctx, game);

    // Rysowanie wrogów (delegowane do klas)
    for (const e of enemies) {
        // POPRAWKA v0.62: Viewport Culling
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
        g.draw(ctx);
    }

    // Rysowanie pickupów (delegowane do klas)
    for (const p of pickups) {
        if (p.x < cullLeft || p.x > cullRight || p.y < cullTop || p.y > cullBottom) {
            continue;
        }
        p.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }

    // Rysowanie skrzyń (delegowane do klas)
    for (const c of chests) {
        if (c.x < cullLeft || c.x > cullRight || c.y < cullTop || c.y > cullBottom) {
            continue;
        }
        c.draw(ctx, pickupStyleEmoji, pickupShowLabels);
    }

    // POPRAWKA v0.62: Rysowanie cząsteczek (z puli)
    // Ta pętla rysuje teraz ślady, konfetti i efekty trafień
    for (let i = particles.length - 1; i >= 0; i--) {
        // Delegujemy rysowanie do samej cząsteczki
        particles[i].draw(ctx);
    }
    ctx.globalAlpha = 1; // Zresetuj alfę po cząsteczkach

    // Rysowanie wskaźnika bomby
    for (const b of bombIndicators) {
        const progress = b.life / b.maxLife; // 0 do 1
        const currentRadius = b.maxRadius * progress;
        const opacity = 0.9 * (1 - progress); // Zanikanie

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
        ctx.shadowBlur = 24;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // POPRAWKA v0.62: Rysowanie tekstów obrażeń (z puli)
    for (let i = hitTexts.length - 1; i >= 0; i--) {
        const ht = hitTexts[i];
        // POPRAWKA v0.62e: Użyj maxLife (w sekundach) zamiast 40 (klatek)
        ctx.globalAlpha = Math.max(0, ht.life / ht.maxLife); 
        ctx.fillStyle = ht.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(ht.text, ht.x, ht.y);
        ctx.fillText(ht.text, ht.x, ht.y);
    }
    ctx.globalAlpha = 1; // Zresetuj alfę po tekstach

    // POPRAWKA v0.62: Usunięto pętlę 'confettis'. Jest teraz w 'particles'.
    
    // Rysowanie licznika FPS
    if (showFPS) {
        ctx.fillStyle = (fps >= 55) ? '#66bb6a' : (fps >= 40 ? '#ffca28' : '#ef5350');
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const fpsText = `${fps} FPS`;
        ctx.strokeText(fpsText, 10, 20);
        ctx.fillText(fpsText, 10, 20);
    }

    ctx.restore(); // Przywróć stan sprzed drżenia ekranu
}