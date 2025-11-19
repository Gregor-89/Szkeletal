// ==============
// DRAW.JS (v0.91e - Sortowanie 'Y' dla perspektywy wrogów)
// Lokalizacja: /js/core/draw.js
// ==============

// NOWY IMPORT v0.78
import { drawIndicators } from '../managers/indicatorManager.js';
// NOWY IMPORT v0.89
import { get as getAsset } from '../services/assets.js';
// NOWY IMPORT v0.90
import { getLang } from '../services/i18n.js';

// Zmienna do przechowania wzoru (cache), aby nie tworzyć go co klatkę
let backgroundPattern = null;
// NOWA ZMIENNA v0.89b: Przechowuje, dla jakiej skali wzór został wygenerowany
let generatedPatternScale = 0;

/**
 * NOWA Funkcja Pomocnicza (v0.71): Rysuje tło (siatkę lub teksturę).
 * POPRAWKA v0.89b: Dodano skalowanie tekstury tła za pomocą off-screen canvas.
 */
function drawBackground(ctx, camera) {
    
    // --- TUTAJ JEST REGULATOR ROZMIARU TŁA ---
    // 0.25 = 25% oryginalnego rozmiaru (np. tekstura 512px będzie kafelkiem 128px)
    const TILE_SCALE = 0.25; 
    
    const bgTexture = getAsset('bg_grass');
    
    if (bgTexture) {
        
        // Optymalizacja: Stwórz wzór tylko raz. 
        // Jeśli skala się zmieni (np. w devtools w przyszłości), wygeneruj go ponownie.
        if (!backgroundPattern || generatedPatternScale !== TILE_SCALE) {
            try {
                // 1. Oblicz docelowy rozmiar kafelka
                const tileWidth = bgTexture.width * TILE_SCALE;
                const tileHeight = bgTexture.height * TILE_SCALE;
                
                // 2. Stwórz tymczasowe płótno (off-screen)
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = tileWidth;
                offscreenCanvas.height = tileHeight;
                const offCtx = offscreenCanvas.getContext('2d');
                
                // 3. Narysuj dużą teksturę na małym płótnie (to ją skaluje)
                // Wyłączenie wygładzania obrazu, aby zachować styl pixel art
                offCtx.imageSmoothingEnabled = false; 
                offCtx.drawImage(bgTexture, 0, 0, tileWidth, tileHeight);
                
                // 4. Stwórz wzór z małego, przeskalowanego płótna
                backgroundPattern = ctx.createPattern(offscreenCanvas, 'repeat');
                generatedPatternScale = TILE_SCALE; // Zapisz użytą skalę
                
                console.log(`[DEBUG-v0.89b] draw.js: Utworzono wzór tła (pattern) z przeskalowanej tekstury (do ${tileWidth}px).`);
            } catch (e) {
                console.error("[DEBUG-v0.89b] draw.js: Błąd krytyczny createPattern! Tekstura może być uszkodzona.", e);
                backgroundPattern = null; // Zablokuj ponowne próby
            }
        }
        
        if (backgroundPattern) {
            ctx.fillStyle = backgroundPattern;
            // Rysujemy tło na całym świecie gry
            // (Kamera zajmie się przesunięciem, my tylko wypełniamy)
            ctx.fillRect(0, 0, camera.worldWidth, camera.worldHeight);
        }
        
    } 
    
    // Fallback: Rysuj starą siatkę, jeśli tekstura zawiodła lub jej nie ma
    if (!backgroundPattern) {
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
    // POPRAWKA v0.91e: Zwiększono margines, aby uwzględnić wysokie sprite'y (np. 120px)
    const cullMargin = 150; 
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

    // --- Rysowanie wrogów (delegowane do klas) ---
    // NOWA LOGIKA v0.91e: Sortowanie wg osi Y, aby zachować perspektywę
        
    // 1. Odfiltruj wrogów, którzy są poza ekranem (culling)
    const enemiesToDraw = [];
    for (const e of enemies) {
        // Użyj this.size jako średnicy hitboxa (np. 52 lub 80)
        // Musimy użyć większego marginesu niż hitbox (np. * 1.5), ponieważ sprite jest wyższy (80px)
        const radius = (e.size / 2) * 1.5; // Użyj bufora 1.5x
        
        if (e.x + radius < cullLeft || // Całkowicie na lewo
            e.x - radius > cullRight || // Całkowicie na prawo
            e.y + radius < cullTop ||   // Całkowicie powyżej
            e.y - radius > cullBottom)  // Całkowicie poniżej
        {
            continue;
        }
        enemiesToDraw.push(e);
    }

    // 2. Posortuj widocznych wrogów na podstawie ich pozycji Y (od najdalszego do najbliższego)
    enemiesToDraw.sort((a, b) => a.y - b.y);

    // 3. Narysuj posortowaną listę
    for (const e of enemiesToDraw) {
        e.draw(ctx, game);
    }
    // --- Koniec nowej logiki rysowania wrogów (v0.91e) ---


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

    // Rysowanie wskaźnika bomby i Oblężenia
    for (const b of bombIndicators) {
        if (b.x - b.maxRadius > cullRight || b.x + b.maxRadius < cullLeft || 
            b.y - b.maxRadius > cullBottom || b.y + b.maxRadius < cullTop) {
            continue;
        }
        
        const progress = b.life / b.maxLife; // 0 do 1
        const currentRadius = b.maxRadius * progress;
        const opacity = 0.9 * (1 - progress); // Zanikanie

        // POPRAWKA v0.75: Logika dla wskaźnika Oblężenia
        if (b.isSiege) {
            // Wskaźnik Oblężenia (czerwony/fioletowy pulsujący)
            const pulse = 1 + 0.2 * Math.sin(b.life * 8);
            const r = b.maxRadius * pulse;
            const dash = [5, 3];
            
            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity * 0.9})`; // Fioletowy
            ctx.shadowColor = `rgba(255, 0, 255, ${opacity * 0.9})`;
            ctx.setLineDash(dash);

            const roundedBX = Math.round(b.x);
            const roundedBY = Math.round(b.y);
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            // Promień nie rośnie, tylko pulsuje
            ctx.arc(roundedBX, roundedBY, r, 0, Math.PI * 2); 
            ctx.stroke();
            
            // Rysowanie czasu
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillText(Math.ceil(b.maxLife - b.life), roundedBX, roundedBY + 5);
            
        } else {
            // Standardowy wskaźnik Bomby
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.shadowColor = `rgba(255, 152, 0, ${opacity * 0.7})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);

            const roundedBX = Math.round(b.x);
            const roundedBY = Math.round(b.y);

            ctx.beginPath();
            ctx.arc(roundedBX, roundedBY, currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
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

    // === RYSOWANIE HUD (NA WIERZCHU) ===

    // NOWA LOGIKA V0.86: Rysowanie ostrzeżenia o nowym wrogu
    if (game.newEnemyWarningT > 0 && game.newEnemyWarningType) {
        const warningTime = game.newEnemyWarningT;
        // ZMIANA v0.90c: Użyj i18n
        const warningText = `${getLang('ui_hud_new_enemy')}: ${game.newEnemyWarningType.toUpperCase()}!`;
        const canvasCenterX = canvas.width / 2;
        const warningY = 50; // Nowa pozycja Y (50px od góry)
        
        // Pulsowanie Alphy
        const alpha = Math.min(1, 0.5 + 0.5 * Math.sin(performance.now() / 80));
        ctx.globalAlpha = alpha;
        
        // Główny tekst (NOWY WRÓG)
        ctx.font = 'bold 24px Arial'; // Zmniejszone z 36px
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff7043'; // Pomarańczowy
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(warningText, canvasCenterX, warningY); // Rysuj na warningY
        
        // Mniejszy tekst z odliczaniem
        ctx.font = 'bold 16px Arial'; // Zmniejszone z 24px
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 4;
        // ZMIANA v0.90c: Użyj i18n
        ctx.fillText(`${getLang('ui_hud_spawn_in')}: ${warningTime.toFixed(1)}s`, canvasCenterX, warningY + 25); // 25px niżej
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    // NOWA LINIA v0.78: Rysowanie wskaźników
    drawIndicators(ctx, state);

    // Rysowanie licznika FPS (NOWA FUNKCJA, na Canvasie)
    drawFPS(ctx, fps, ui, canvas);
}