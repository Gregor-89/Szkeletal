// ==============
// WHIPWEAPON.JS (v0.89 - Dostosowanie offsetu do rozmiaru gracza)
// Lokalizacja: /js/config/weapons/whipWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';
// NOWY IMPORT v0.79h
import { get as getAsset } from '../../services/assets.js';


// STAŁE DLA BICZA
// POPRAWKA v0.79h: Wydłużono czas życia, aby zmieścić 6 klatek animacji
const WHIP_HITBOX_LIFE = 0.25; // Czas życia hitoxa (w sekundach) (było 0.15)
const WHIP_PIERCE = 99; // Bicz domyślnie przebija wszystko
const WHIP_COLOR = '#C8E6C9'; // Jasnozielony (używany tylko jeśli sprite zawiedzie)

// POPRAWKA v0.89c: Zwiększono offset, aby zaczynał się na krawędzi sprite'a gracza
// (Promień wizualny gracza 40px + promień hitboxa bicza 20px = 60px)
const WHIP_BASE_OFFSET = 60; // Było 40
const WHIP_SPACING = 25; // Odstęp między kolejnymi cięciami (było 50)

/**
 * WhipWeapon: Broń kierunkowa, atakująca w kierunku ruchu.
 */
export class WhipWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    
    // Cache konfiguracji
    this.whipConfig = PERK_CONFIG.whip;
    
    // Statystyki dynamiczne
    this.cooldown = 0;
    this.damage = 0;
    // POPRAWKA v0.81g: Rozdzielenie rozmiaru kolizji od rozmiaru rysowania
    this.drawScale = 0; // Skala procentowa (np. 60) do rysowania sprite'a
    this.hitboxSize = 20; // Promień (w px) do sprawdzania kolizji
    this.count = 0;
    
    // NOWE v0.79h: Pobranie sprite'a
    this.spriteSheet = getAsset('effect_whip');
    
    this.updateStats(); // Inicjalizacja statystyk
  }
  
  /**
   * Aktualizuje statystyki broni na podstawie jej poziomu i konfiguracji.
   */
  updateStats() {
    this.damage = this.whipConfig.calculateDamage(this.level);
    this.cooldown = this.whipConfig.calculateCooldown(this.level);
    // POPRAWKA v0.81g: Użyj nowych nazw funkcji i wartości z gameData.js
    this.drawScale = this.whipConfig.calculateDrawScale(this.level);
    this.hitboxSize = this.whipConfig.HITBOX_RADIUS || 20; // 20px jako fallback
    this.count = this.whipConfig.calculateCount(this.level);
    
    // Ustaw timer przy pierwszym ulepszeniu
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  /**
   * Główna pętla aktualizacji broni.
   */
  update(state) {
    const { dt, bulletsPool } = state;
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      // Wektor ataku (zawsze lewo/prawo)
      const attackX = 1;
      const attackY = 0;
      
      // NOWE v0.79h: Zdefiniuj parametry animacji
      const animParams = {
        spriteSheet: this.spriteSheet,
        frameWidth: 125, // Obliczone: 750 / 6
        frameHeight: 150, // Obliczone: 750 / 5
        frameCount: 6, // 6 klatek w rzędzie
        animRow: 0, // Użyj pierwszego rzędu
        // Czas trwania animacji = czas życia hitoxa
        animSpeed: (WHIP_HITBOX_LIFE * 1000) / 6 // np. 250ms / 6 klatek = ~41.6ms na klatkę
      };
      
      // --- LOGIKA ASYMETRYCZNA (v0.80a) ---
      
      const facingDir = this.player.facingDir; // (1 lub -1)
      const oppositeDir = -facingDir;
      
      // Funkcja pomocnicza do spawnowania hitboxa
      const spawnHitbox = (side, offsetIdx) => {
        const offsetDist = WHIP_BASE_OFFSET + (offsetIdx * WHIP_SPACING);
        // Pozycja X/Y jest obliczana względem gracza
        const hitboxX = this.player.x + (attackX * offsetDist * side);
        const hitboxY = this.player.y + (attackY * offsetDist * side);
        
        const bullet = bulletsPool.get();
        if (bullet) {
          // init(x, y, vx, vy, size, damage, color, pierce, life, bouncesLeft, curveDir, animParams, playerRef, drawScale)
          bullet.init(
            hitboxX, hitboxY,
            0, 0, // vx, vy
            this.hitboxSize, // POPRAWKA v0.81g: Przekaż rozmiar kolizji (np. 20)
            this.damage,
            WHIP_COLOR,
            WHIP_PIERCE,
            WHIP_HITBOX_LIFE, // 0.25s
            0, // bouncesLeft
            side, // curveDir (kierunek odwrócenia sprite'a)
            animParams,
            this.player, // v0.80b: Przekaż referencję gracza
            this.drawScale // POPRAWKA v0.81g: Przekaż rozmiar rysowania (np. 60)
          );
        }
      };
      
      // Zastosuj logikę poziomów (this.count = 1, 2, 3, lub 4)
      if (this.count === 1) { // Lvl 1: Tylko w kierunku patrzenia
        spawnHitbox(facingDir, 0);
      } else if (this.count === 2) { // Lvl 2: Symetrycznie (jeden z przodu, jeden z tyłu)
        spawnHitbox(facingDir, 0);
        spawnHitbox(oppositeDir, 0);
      } else if (this.count === 3) { // Lvl 3: Dwa z przodu, jeden z tyłu
        spawnHitbox(facingDir, 0);
        spawnHitbox(facingDir, 1); // Drugi z przodu
        spawnHitbox(oppositeDir, 0);
      } else if (this.count >= 4) { // Lvl 4 & 5: Dwa z przodu, dwa z tyłu
        spawnHitbox(facingDir, 0);
        spawnHitbox(facingDir, 1);
        spawnHitbox(oppositeDir, 0);
        spawnHitbox(oppositeDir, 1);
      }
      
      playSound('Whip');
    }
  }
  
  // Bicz nie rysuje nic sam z siebie (hitboxy są rysowane przez pętlę draw.js)
  draw(ctx) {
    // celowo puste
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      timer: this.timer
    };
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.81g] js/config/weapons/whipWeapon.js: Przekazano hitboxSize i drawScale do bullet.init().');