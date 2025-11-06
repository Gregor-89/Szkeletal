// ==============
// ORBITALWEAPON.JS (v0.73 - Ostateczna korekta logiki po refaktoryzacji)
// Lokalizacja: /js/config/weapons/orbitalWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { killEnemy } from '../../managers/enemyManager.js'; // Dodane do logiki kolizji (zaktualizuję update)
import { addHitText } from '../../core/utils.js'; // Dodane do logiki kolizji (zaktualizuję update)
// POPRAWKA v0.65: Zmieniono import na centralną konfigurację
import { PERK_CONFIG } from '../gameData.js'; // <--- ZMIENIONE: Poprawna ścieżka: '../gameData.js'

// STAŁE DLA TYPU ORBITALA
const ORBITAL_SIZE = 5; // Promień orbitala
const ORBITAL_COLOR = '#80DEEA'; // Kolor (Cyjan)

/**
 * OrbitalWeapon: Broń pasywna.
 */
export class OrbitalWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.items = []; // Tablica prostych obiektów {angle, ox, oy}
    this.angle = 0; // Kąt obrotu całej formacji
    this.radius = 0;
    this.damage = 0;
    this.speed = 0;
    this.collisionTimer = 0; // Timer do opóźniania kolizji (logika v0.71)
    
    this.orbitalConfig = PERK_CONFIG.orbital; // Cache dla configu
    this.updateStats(); // Uruchomienie, aby zainicjować this.items
  }
  
  // POPRAWKA v0.73: Skalowanie pobierane z PERK_CONFIG
  updateStats() {
    this.damage = this.orbitalConfig.calculateDamage(this.level);
    this.radius = this.orbitalConfig.calculateRadius(this.level);
    this.speed = this.orbitalConfig.calculateSpeed(this.level);
    
    // Ta logika jest poprawna - dodaje nowy orbital, jeśli poziom jest wyższy niż liczba itemów
    while (this.items.length < this.level) {
      this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
    }
    while (this.items.length > this.level) {
      this.items.pop();
    }
  }
  
  update(state) {
    // PRZYWRÓCONA LOGIKA Z PLIKU V0.71
    const { dt, enemies, particlePool, hitTextPool, hitTexts, game, settings, gemsPool, pickups, chests } = state;
    
    // 1. Aktualizacja Kąta i Pozycji
    this.angle += this.speed * dt;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const ang = this.angle + i * (Math.PI * 2 / this.items.length);
      it.ox = this.player.x + Math.cos(ang) * this.radius;
      it.oy = this.player.y + Math.sin(ang) * this.radius;
    }
    
    // 2. Obsługa Kolizji (tylko co 0.05s)
    this.collisionTimer -= dt;
    if (this.collisionTimer > 0) return;
    
    this.collisionTimer = 0.05;
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        // Używamy promienia orbitala do wstępnego culling
        if (Math.abs(it.ox - e.x) > e.size + ORBITAL_SIZE || Math.abs(it.oy - e.y) > e.size + ORBITAL_SIZE) {
          continue;
        }
        
        const d = Math.hypot(it.ox - e.x, it.oy - e.y);
        if (d < ORBITAL_SIZE + e.size * 0.5) { // Precyzyjna kolizja
          
          const dmg = this.damage;
          e.hp -= dmg;
          
          // Efekty wizualne
          const p = particlePool.get();
          if (p) {
            p.init(
              e.x, e.y,
              (Math.random() - 0.5) * 1 * 60, // vx (px/s)
              (Math.random() - 0.5) * 1 * 60, // vy (px/s)
              0.16, // life (s)
              '#ff0000'
            );
          }
          
          addHitText(hitTextPool, hitTexts, e.x, e.y, dmg, ORBITAL_COLOR);
          
          if (e.hp <= 0) {
            state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, true);
          }
        }
      }
    }
  }
  
  draw(ctx) {
    // Rysowanie orbitali (bez zmian)
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = ORBITAL_COLOR;
      ctx.fillStyle = ORBITAL_COLOR;
      ctx.beginPath();
      ctx.arc(it.ox, it.oy, ORBITAL_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      angle: this.angle
    };
  }
}