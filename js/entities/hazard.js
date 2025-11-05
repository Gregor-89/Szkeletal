// ==============
// HAZARD.JS (v0.68 - Klasa dla Pola Zagrożenia - Acid Pool)
// Lokalizacja: /js/entities/hazard.js
// ==============

// POPRAWKA v0.68: Import nowej centralnej konfiguracji dla parametrów
import { HAZARD_CONFIG } from '../config/gameData.js';

/**
 * Klasa dla statycznego Pola Zagrożenia (np. Kwaśna Plama).
 * Jest to stały element na mapie, który zadaje obrażenia i spowalnia gracza.
 */
export class Hazard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    // POPRAWKA v0.68: Rozmiar pobierany z konfiguracji
    this.r = HAZARD_CONFIG.SIZE; // Promień kolizji i rysowania
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  /**
   * Aktualizuje stan zagrożenia (np. efekt pulsowania).
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Faza pulsowania jest używana w metodzie draw()
    this.pulsePhase += dt * 3;
    // Jeśli chcielibyśmy, żeby hazardy znikały, to tutaj byłaby logika this.life -= dt;
  }
  
  /**
   * Rysuje pole zagrożenia na canvasie.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.save();
    
    const pulseScale = 1 + 0.05 * Math.sin(this.pulsePhase);
    const radius = this.r * pulseScale;
    
    // 1. Rysowanie cienia (glow)
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(0, 255, 0, 0.4)'; // Zielony cień
    
    // 2. Rysowanie samej plamy (Acid Pool)
    ctx.fillStyle = 'rgba(0, 150, 0, 0.6)'; // Ciemnozielona plama
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 3. Wewnętrzny, jaśniejszy pierścień (efekt "gotowania")
    ctx.fillStyle = 'rgba(0, 200, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // 4. Usuwamy cień przed rysowaniem konturu
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
}