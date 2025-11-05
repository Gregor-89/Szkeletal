// ==============
// PICKUP.JS (v0.72 - Refaktoryzacja: Logika Pickupów)
// Lokalizacja: /js/entities/pickup.js
// ==============

import { getPickupEmoji, getPickupColor, getPickupLabel } from '../core/utils.js';
import { get as getAsset } from '../services/assets.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PICKUP_CONFIG } from '../config/gameData.js';

/**
 * Klasa bazowa dla wszystkich pickupów (bonusów).
 */
export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 9;
    // POPRAWKA v0.65: Użyj wartości z PICKUP_CONFIG
    this.life = PICKUP_CONFIG.BASE_LIFE; // Czas życia w sekundach
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // POPRAWKA v0.68: Dodano właściwość do mechaniki Bagna
    this.inHazardDecayT = 0; // Licznik postępu zaniku w Hazardzie (0.0 do 1.0)
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
   * Logika przeniesiona z 'draw.js'.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} pickupStyleEmoji - Czy rysować jako emoji
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
    const radius = this.r * pulseScale;
    
    // POPRAWKA v0.56: Logika rysowania sprite'a lub starego stylu
    const sprite = getAsset('pickup_' + this.type); // Np. 'pickup_heal'
    
    if (sprite) {
      // 1. Jeśli sprite istnieje, narysuj go
      const drawSize = this.r * 2.5 * pulseScale; // Tymczasowo, z pulsem
      ctx.drawImage(sprite,
        this.x - drawSize / 2,
        this.y - drawSize / 2,
        drawSize,
        drawSize
      );
      
    } else {
      // 2. Jeśli nie, użyj starej logiki (Emoji lub Kółka)
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
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      // POPRAWKA v0.63: Zastąp strokeText() cieniem dla wydajności
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      
      const label = getPickupLabel(this.type);
      ctx.fillText(label, this.x, this.y + 20);
    }
    
    ctx.restore();
  }
}

// === KLASY SPECJALISTYCZNE (PRZENIESIONE DO /js/entities/pickups/) ===
// (HealPickup, MagnetPickup, ShieldPickup, SpeedPickup, BombPickup, FreezePickup)
// Zostały usunięte z tego pliku.