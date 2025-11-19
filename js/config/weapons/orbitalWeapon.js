// ==============
// ORBITALWEAPON.JS (v0.91AA - Implementacja sprite'a Ziemniaczka i poświaty)
// Lokalizacja: /js/config/weapons/orbitalWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { killEnemy } from '../../managers/enemyManager.js';
import { addHitText } from '../../core/utils.js';
// NOWY IMPORT v0.91AA
import { get as getAsset } from '../../services/assets.js';
// POPRAWKA v0.65: Zmieniono import na centralną konfigurację
import { PERK_CONFIG } from '../gameData.js';

// STAŁE DLA TYPU ORBITALA
const ORBITAL_BASE_SIZE = 15; // Wizualny rozmiar (np. 15px promienia)
const ORBITAL_COLOR = '#80DEEA';
const ORBITAL_GLOW_COLOR = 'rgba(255, 215, 0, 0.9)'; // Złoty kolor poświaty

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
    this.collisionTimer = 0;
    
    this.orbitalConfig = PERK_CONFIG.orbital; // Cache dla configu
    
    // NOWA LINIA v0.91AA: Pobranie sprite'a
    this.sprite = getAsset('weapon_orbital_potato');
    
    this.updateStats(); // Uruchomienie, aby zainicjować this.items
  }
  
  // POPRAWKA v0.73: Skalowanie pobierane z PERK_CONFIG
  updateStats() {
    this.damage = this.orbitalConfig.calculateDamage(this.level);
    this.radius = this.orbitalConfig.calculateRadius(this.level); // Używa formuły zwiększonej o 50%
    this.speed = this.orbitalConfig.calculateSpeed(this.level);
    
    // Ta logika jest poprawna - dodaje nowy orbital
    while (this.items.length < this.level) {
      // Nadanie orbitalowi losowego kąta (dla asynchronicznego wyglądu)
      this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
    }
    while (this.items.length > this.level) {
      this.items.pop();
    }
  }
  
  update(state) {
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
        if (Math.abs(it.ox - e.x) > e.size + ORBITAL_BASE_SIZE || Math.abs(it.oy - e.y) > e.size + ORBITAL_BASE_SIZE) {
          continue;
        }
        
        const d = Math.hypot(it.ox - e.x, it.oy - e.y);
        if (d < ORBITAL_BASE_SIZE + e.size * 0.5) { // Precyzyjna kolizja
          
          const dmg = this.damage;
          e.takeDamage(dmg); // Używamy takeDamage() dla poprawnego mrugania
          
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
            state.enemyIdCounter = killEnemy(j, e, game, settings, enemies, particlePool, gemsPool, pickups, chests, true);
          }
        }
      }
    }
  }
  
  /**
   * ZMIANA v0.91AA: Rysuje sprite Orbitalnego Ziemniaczka z poświatą.
   */
  draw(ctx) {
    if (!this.sprite) {
      // Fallback na stare kółko, jeśli sprite nie załadowany
      for (const it of this.items) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = ORBITAL_COLOR;
        ctx.fillStyle = ORBITAL_COLOR;
        ctx.beginPath();
        ctx.arc(it.ox, it.oy, ORBITAL_BASE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    
    const drawSize = ORBITAL_BASE_SIZE * 2; // Np. 30px średnicy
    
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      
      ctx.save();
      
      // 1. Złota, mieniąca się poświata (shimmering glow)
      // Pulsowanie jasności cienia
      const glowPulse = 5 + 3 * Math.sin(performance.now() / 150 + it.angle);
      ctx.shadowBlur = glowPulse;
      ctx.shadowColor = ORBITAL_GLOW_COLOR;
      
      // 2. Transformacja i rysowanie
      ctx.translate(it.ox, it.oy);
      
      // Rotacja sprite'a (używamy kąta orbitala)
      const rotationAngle = this.angle + i * (Math.PI * 2 / this.items.length) + (it.angle * 0.1);
      ctx.rotate(rotationAngle);
      
      ctx.imageSmoothingEnabled = false; // Pixel art
      
      ctx.drawImage(this.sprite,
        -drawSize / 2, // x
        -drawSize / 2, // y
        drawSize,
        drawSize
      );
      
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