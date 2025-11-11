// ==============
// WHIPWEAPON.JS (v0.79L - Balans Bicza v3 - Zmniejszenie zasięgu)
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
// POPRAWKA v0.79L: Zmniejszenie zasięgu o 50% (powrót do v0.79c)
const WHIP_BASE_OFFSET = 40; // Jak daleko od gracza (było 80)
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
    // 'this.size' z configu (60+) będzie teraz używane jako *skalowanie* sprite'a
    this.size = 0;
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
    this.size = this.whipConfig.calculateSize(this.level);
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
      
      for (let i = 0; i < this.count; i++) {
        // Strona: 1 (prawo), -1 (lewo)
        const side = (i % 2 === 0) ? 1 : -1;
        // Odległość od gracza (np. i=0,1 -> 40px; i=2,3 -> 65px)
        const offsetDist = WHIP_BASE_OFFSET + (Math.floor(i / 2) * WHIP_SPACING);
        
        const hitboxX = this.player.x + (attackX * offsetDist * side);
        const hitboxY = this.player.y + (attackY * offsetDist * side);
        
        const bullet = bulletsPool.get();
        if (bullet) {
          // POPRAWKA v0.79h: Dodano 'animParams' jako ostatni argument
          // init(x, y, vx, vy, size, damage, color, pierce, life, bouncesLeft, curveDir, animParams)
          bullet.init(
            hitboxX,
            hitboxY,
            0, // vx
            0, // vy
            // 'this.size' (np. 60) jest teraz używane jako SKALOWANIE (w % rozmiaru bazowego 125px)
            // (60 / 100 = 0.6) -> 0.6 * 125px = 75px szerokości rysunku
            this.size,
            this.damage,
            WHIP_COLOR,
            WHIP_PIERCE,
            WHIP_HITBOX_LIFE, // 0.25s
            0, // bouncesLeft
            side, // curveDir (np. 1 lub -1)
            animParams // Parametry animacji
          );
        }
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