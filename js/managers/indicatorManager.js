// ==============
// INDICATORMANAGER.JS (v0.78 - Nowy plik)
// Lokalizacja: /js/managers/indicatorManager.js
// ==============

// Import kolorów dla pickupów
import { getPickupColor } from '../core/utils.js';

// --- Konfiguracja ---
const UPDATE_INTERVAL = 0.25; // (4 razy na sekundę) Czas w sekundach, co jaki aktualizujemy listę wskaźników
const SCREEN_MARGIN = 20; // (w px) Jak daleko od krawędzi ekranu rysować wskaźniki

// --- Stan wewnętrzny (Cache) ---
let updateTimer = 0;
let activeIndicators = []; // Przechowuje obiekty { x, y, color, size }

/**
 * Sprawdza, czy obiekt znajduje się poza ekranem (z marginesem).
 */
function isOffScreen(obj, camera) {
  const margin = 50; // Zwiększony margines, aby wskaźnik nie pojawiał się natychmiast
  const viewLeft = camera.offsetX - margin;
  const viewRight = camera.offsetX + camera.viewWidth + margin;
  const viewTop = camera.offsetY - margin;
  const viewBottom = camera.offsetY + camera.viewHeight + margin;
  
  return (
    obj.x < viewLeft ||
    obj.x > viewRight ||
    obj.y < viewTop ||
    obj.y > viewBottom
  );
}

/**
 * Aktualizuje listę aktywnych wskaźników (wywoływane rzadko, dla wydajności).
 */
export function updateIndicators(state, dt) {
  // 1. Zastosuj Throttling (ogranicznik)
  updateTimer -= dt;
  if (updateTimer > 0) {
    return; // Pomiń aktualizację w tej klatce
  }
  updateTimer = UPDATE_INTERVAL;
  
  // 2. Wyczyść stary cache i pobierz potrzebne dane
  activeIndicators = [];
  const { player, enemies, pickups, chests, camera } = state;
  
  if (!player || !camera) return;
  
  // 3. Iteruj po obiektach o wysokim priorytecie
  
  // A. Skrzynie (Chests)
  for (const chest of chests) {
    if (isOffScreen(chest, camera)) {
      activeIndicators.push({
        x: chest.x,
        y: chest.y,
        color: '#FFD700', // Złoty
        size: 10
      });
    }
  }
  
  // B. Pickupy (Bonusy)
  for (const pickup of pickups) {
    if (isOffScreen(pickup, camera)) {
      activeIndicators.push({
        x: pickup.x,
        y: pickup.y,
        color: getPickupColor(pickup.type) || '#FFFFFF',
        size: 8
      });
    }
  }
  
  // C. Wrogowie (Tylko Elita)
  for (const enemy of enemies) {
    if (enemy.type !== 'elite') {
      continue; // Pomiń wszystkich poza Elitą
    }
    
    if (isOffScreen(enemy, camera)) {
      activeIndicators.push({
        x: enemy.x,
        y: enemy.y,
        color: '#e91e63', // Różowy (kolor Elity)
        size: 8
      });
    }
  }
}

/**
 * Rysuje wskaźniki na HUD (wywoływane co klatkę).
 * Ta funkcja musi być wywołana PO ctx.restore() w draw.js.
 */
export function drawIndicators(ctx, state) {
  if (!activeIndicators.length) {
    return;
  }
  
  const { canvas, player, camera } = state;
  
  // Granice rysowania na ekranie (HUD)
  const screenLeft = SCREEN_MARGIN;
  const screenRight = canvas.width - SCREEN_MARGIN;
  const screenTop = SCREEN_MARGIN;
  const screenBottom = canvas.height - SCREEN_MARGIN;
  
  // Środek ekranu (nasz punkt odniesienia)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  
  for (const indicator of activeIndicators) {
    // Oblicz pozycję celu w przestrzeni ekranu
    const targetScreenX = indicator.x - camera.offsetX;
    const targetScreenY = indicator.y - camera.offsetY;
    
    // Oblicz wektor od środka ekranu do celu
    const dx = targetScreenX - centerX;
    const dy = targetScreenY - centerY;
    const angle = Math.atan2(dy, dx);
    
    // Znajdź punkt na krawędzi ekranu
    // (Uproszczona, ale wystarczająco szybka matematyka "clippingu")
    const H = canvas.height / 2 - SCREEN_MARGIN;
    const W = canvas.width / 2 - SCREEN_MARGIN;
    
    // Sprawdź, z którą krawędzią (pionową czy poziomą) przetnie się wektor
    let finalX, finalY;
    if (Math.abs(dy / dx) < H / W) {
      // Przecięcie z krawędzią lewą lub prawą
      if (dx > 0) {
        finalX = screenRight;
        finalY = centerY + (W * dy / dx);
      } else {
        finalX = screenLeft;
        finalY = centerY - (W * dy / dx);
      }
    } else {
      // Przecięcie z krawędzią górną lub dolną
      if (dy > 0) {
        finalX = centerX + (H * dx / dy);
        finalY = screenBottom;
      } else {
        finalX = centerX - (H * dx / dy);
        finalY = screenTop;
      }
    }
    
    // Narysuj wskaźnik (trójkąt)
    ctx.fillStyle = indicator.color;
    
    ctx.save();
    ctx.translate(finalX, finalY);
    ctx.rotate(angle); // Obróć wskaźnik w kierunku celu
    
    const size = indicator.size;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 1.5, -size * 0.8);
    ctx.lineTo(-size * 1.5, size * 0.8);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  ctx.restore();
}