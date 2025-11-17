// ==============
// CHEST.JS (v0.90 - Implementacja i18n)
// Lokalizacja: /js/entities/chest.js
// ==============

// POPRAWKA v0.63: Optymalizacja strokeText
// Lokalizacja: /js/entities/chest.js
// ==============

import { getPickupLabel } from '../core/utils.js';
// POPRAWKA v0.56: Import menedżera zasobów
import { get as getAsset } from '../services/assets.js';
// POPRAWKA v0.68: Import PLAYER_CONFIG dla rozmiaru
import { PLAYER_CONFIG } from '../config/gameData.js';

export class Chest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 12; // Promień kolizji
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.inHazardDecayT = 0; // NOWE: Licznik postępu zaniku w Hazardzie (0.0 do 1.0)
  }
  
  /**
   * Zwraca true, jeśli Skrzynia powinna zostać usunięta z powodu zaniku w Hazardzie.
   */
  isDecayed() {
    return this.inHazardDecayT >= 1.0;
  }
  
  /**
   * Aktualizuje stan skrzyni (obecnie puste).
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Na razie nic nie robi, ale jest gotowe na przyszłość
  }
  
  /**
   * Rysuje skrzynię na canvasie.
   * Logika przeniesiona z 'draw.js'.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} pickupStyleEmoji 
   * @param {boolean} pickupShowLabels 
   */
  draw(ctx, pickupStyleEmoji, pickupShowLabels) {
    ctx.save();
    
    const pulseScale = 1 + 0.1 * Math.sin(performance.now() / 200 + this.pulsePhase);
    const size = 16 * pulseScale;
    
    // Wizualne zanikanie (opacity)
    const alpha = 1.0 - this.inHazardDecayT;
    ctx.globalAlpha = alpha;
    
    // POPRAWKA v0.56: Logika rysowania sprite'a lub starego stylu
    const sprite = getAsset('chest');
    
    if (sprite) {
      // 1. Jeśli sprite istnieje, narysuj go
      const drawSize = size * 1.8; // Tymczasowo, z pulsem
      ctx.drawImage(sprite,
        this.x - drawSize / 2,
        this.y - drawSize / 2,
        drawSize,
        drawSize
      );
    } else {
      // 2. Jeśli nie, użyj starej logiki (Emoji lub Kwadrat)
      if (pickupStyleEmoji) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.font = (size * 2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('📦', this.x, this.y);
        ctx.fillText('📦', this.x, this.y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(this.x - size / 2, this.y - size / 2 + 2, size, size - 4);
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - size / 2, this.y - size / 2 + 2, size, size - 4);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD54F';
        ctx.strokeRect(this.x - size / 2, this.y - size / 2 + 2, size, size - 4);
        ctx.shadowBlur = 0;
      }
    }
    
    if (pickupShowLabels) {
      ctx.globalAlpha = 1; // Etykieta nie miga
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // POPRAWKA v0.63: Zastąp strokeText() cieniem dla wydajności
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      
      // POPRAWKA v0.90: Użyj zmiennej 'label', która jest już pobrana i przetłumaczona
      const label = getPickupLabel('chest'); // Używamy 'chest' jako tymczasowego typu
      ctx.fillText(label, this.x, this.y + 20); // Zmieniono 'Skrzynia' na label
    }
    
    ctx.restore();
  }
}