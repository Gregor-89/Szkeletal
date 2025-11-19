// (Linia 1) [DEBUG-v0.94] js/entities/pickup.js
// ==============
// PICKUP.JS (v0.94 - Glow, Aspect Ratio, Bigger Size)
// Lokalizacja: /js/entities/pickup.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from '../core/utils.js';
import { get as getAsset } from '../services/assets.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PICKUP_CONFIG } from '../config/gameData.js';

/**
 * Mapa kolorów poświaty dla poszczególnych typów pickupów.
 */
const PICKUP_GLOWS = {
  'heal': 'rgba(244, 67, 54, 0.8)', // Czerwony
  'magnet': 'rgba(33, 150, 243, 0.8)', // Niebieski
  'shield': 'rgba(100, 181, 246, 0.8)', // Jasny niebieski
  'speed': 'rgba(255, 215, 0, 0.8)', // Złoty
  'bomb': 'rgba(255, 87, 34, 0.8)', // Pomarańczowy
  'freeze': 'rgba(0, 255, 255, 0.8)', // Cyjan
  'default': 'rgba(255, 255, 255, 0.6)'
};

/**
 * Klasa bazowa dla wszystkich pickupów (bonusów).
 */
export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 12; // ZWIĘKSZONO hitbox (było 9), aby pasował do większych grafik
    // POPRAWKA v0.65: Użyj wartości z PICKUP_CONFIG
    this.life = PICKUP_CONFIG.BASE_LIFE; // Czas życia w sekundach
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // POPRAWKA v0.68: Dodano właściwość do mechaniki Bagna
    this.inHazardDecayT = 0; // Licznik postępu zaniku w Hazardzie (0.0 do 1.0)
    
    // NOWE v0.94: Offset dla animacji pływania grafiki
    this.floatOffset = Math.random() * 100;
  }
  
  /**
   * Zwraca true, jeśli Pickup powinien zostać usunięty z powodu zaniku w Hazardzie.
   */
  isDecayed() {
    return this.inHazardDecayT >= 1.0;
  }
  
  /**
   * NOWA FUNKCJA (v0.72): Stosuje efekt pickupa na gracza/stan gry.
   * Ta metoda będzie nadpisana przez podklasy.
   * @param {object} state - Główny obiekt stanu gry (gameStateRef)
   */
  applyEffect(state) {
    // Domyślnie nic nie rób (klasa bazowa)
    console.warn(`[Pickup] Metoda applyEffect() nie została zaimplementowana dla typu: ${this.type}`);
  }
  
  /**
   * Aktualizuje stan pickupa (np. odlicza czas życia).
   * @param {number} dt - Delta time
   */
  update(dt) {
    this.life -= dt;
    // UWAGA: Logika zaniku w Hazardzie (inHazardDecayT) jest aktualizowana w collisions.js
  }
  
  /**
   * Zwraca true, jeśli pickup powinien zostać usunięty.
   * @returns {boolean}
   */
  isDead() {
    return this.life <= 0;
  }
  
  /**
   * Rysuje pickup na canvasie.
   * Zaktualizowana o obsługę grafik (v0.94).
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} pickupStyleEmoji - Czy rysować jako emoji (fallback)
   * @param {boolean} pickupShowLabels - Czy pokazywać etykiety
   */
  draw(ctx, pickupStyleEmoji, pickupShowLabels) {
    ctx.save();
    
    // Efekt migania przed zniknięciem
    if (this.life < 4) {
      ctx.globalAlpha = (Math.floor(performance.now() / 150) % 2 === 0) ? 0.3 : 1;
    }
    
    // POPRAWKA v0.68: Wizualne zanikanie (opacity)
    const decayAlpha = 1.0 - this.inHazardDecayT;
    ctx.globalAlpha *= decayAlpha; // Zastosuj zanik
    
    const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 200 + this.pulsePhase);
    
    // POPRAWKA v0.94: Logika rysowania sprite'a z Glow i Aspect Ratio
    const sprite = getAsset('pickup_' + this.type); // Np. 'pickup_heal'
    
    if (sprite) {
      // --- NOWA LOGIKA V0.94 ---
      const baseSize = 32; // ZWIĘKSZONO z 24 na 32 (Dla lepszej widoczności)
      const size = baseSize * pulseScale;
      
      // Pływanie góra-dół (animacja)
      const floatY = Math.sin((performance.now() / 500) + this.floatOffset) * 4;
      
      // Obliczanie proporcji (Aspect Ratio), aby tarcza nie była rozciągnięta
      const aspect = sprite.naturalWidth / sprite.naturalHeight;
      let drawW = size;
      let drawH = size;
      
      // Dopasowanie wymiarów w zależności od proporcji
      if (aspect > 1) {
        // Szerszy niż wyższy
        drawH = size / aspect;
      } else {
        // Wyższy niż szerszy
        drawW = size * aspect;
      }
      
      // Cień pod pickupem (na ziemi)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 10, drawW / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // EFEKT GLOW (POŚWIATA)
      const glowColor = PICKUP_GLOWS[this.type] || PICKUP_GLOWS['default'];
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15; // Mocna poświata dla lepszej widoczności
      
      // Rysowanie obrazka
      ctx.drawImage(sprite,
        this.x - drawW / 2,
        (this.y - drawH / 2) + floatY,
        drawW,
        drawH
      );
      
      // Wyłącz glow dla tekstu etykiety (jeśli będzie rysowany)
      ctx.shadowBlur = 0;
      
    } else {
      // --- STARA LOGIKA (FALLBACK - Emoji lub Kółka) ---
      const radius = this.r * pulseScale;
      if (pickupStyleEmoji) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.font = (radius * 2.2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const emoji = getPickupEmoji(this.type);
        ctx.strokeText(emoji, this.x, this.y);
        ctx.fillText(emoji, this.x, this.y);
        ctx.shadowBlur = 0;
      } else {
        const color = getPickupColor(this.type);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    if (pickupShowLabels) {
      // Etykieta też musi respektować zanikanie
      ctx.globalAlpha = (this.life < 4 ? ctx.globalAlpha : 1.0) * decayAlpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial'; // Pogrubiona czcionka dla lepszej czytelności
      ctx.textAlign = 'center';
      
      // POPRAWKA v0.63: Zastąp strokeText() cieniem dla wydajności
      ctx.shadowColor = 'rgba(0, 0, 0, 1)'; // Ciemniejszy cień
      ctx.shadowBlur = 4;
      
      const label = getPickupLabel(this.type);
      // Przesunięcie napisu w dół, jeśli rysujemy grafikę
      const yOffset = sprite ? 28 : 20;
      ctx.fillText(label, this.x, this.y + yOffset);
    }
    
    ctx.restore();
  }
}

// === KLASY SPECJALISTYCZNE (PRZENIESIONE DO /js/entities/pickups/) ===
// (HealPickup, MagnetPickup, ShieldPickup, SpeedPickup, BombPickup, FreezePickup)
// Zostały usunięte z tego pliku w poprzednich wersjach.