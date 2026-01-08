// ==============
// ORBITALWEAPON.JS (v0.99 - Per-Entity Strike Fix)
// Lokalizacja: /js/config/weapons/orbitalWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { get as getAsset } from '../../services/assets.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';

const ORBITAL_BASE_SIZE = 15;
const ORBITAL_COLOR = '#80DEEA';
const ORBITAL_GLOW_COLOR = 'rgba(255, 215, 0, 0.9)';

export class OrbitalWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.items = [];
    this.angle = 0;
    this.radius = 0;
    this.damage = 0;
    this.speed = 0;

    // FIX Ad 6: System StrikeID dla synchronizacji z collisions.js.
    // Pozwala na limitowanie hitów per-przeciwnik (1 na sekundę).
    this.currentStrikeId = "orbital_init";
    this.strikeUpdateTimer = 0;

    this.orbitalConfig = PERK_CONFIG.orbital;
    this.sprite = getAsset('weapon_orbital_potato');

    this.updateStats();
  }

  updateStats() {
    this.damage = this.orbitalConfig.calculateDamage(this.level);
    this.radius = this.orbitalConfig.calculateRadius(this.level);
    this.speed = this.orbitalConfig.calculateSpeed(this.level);

    // Utrzymujemy liczbę obiektów zgodnie z poziomem perka
    while (this.items.length < (1 + Math.floor(this.level / 2))) {
      this.items.push({ angle: Math.random() * Math.PI * 2, ox: 0, oy: 0, flashT: 0 });
    }
    while (this.items.length > (1 + Math.floor(this.level / 2))) {
      this.items.pop();
    }
  }

  update(state) {
    const { dt, game } = state;

    // 1. Aktualizacja Kąta i Pozycji (ox, oy są odczytywane przez pętlę w collisions.js)
    this.angle += this.speed * dt;

    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const ang = this.angle + i * (Math.PI * 2 / this.items.length);
      it.ox = this.player.x + Math.cos(ang) * this.radius;
      it.oy = this.player.y + Math.sin(ang) * this.radius;
      if (it.flashT > 0) it.flashT -= dt;
    }

    // 2. Zarządzanie StrikeID - odświeżanie identyfikatora impulsu co 1.0s.
    // Dzięki temu system kolizji wie, że może zadać obrażenia temu samemu wrogowi ponownie.
    this.strikeUpdateTimer += dt;
    if (this.strikeUpdateTimer >= 1.0) {
      this.strikeUpdateTimer = 0;
      this.currentStrikeId = "orbital_puls_" + game.time.toFixed(1) + "_" + Math.random();
    }

    // LOGIKA KOLIZJI: Przeniesiona do js/managers/collisions.js (sekcja Ataki Obszarowe),
    // aby umożliwić niezależne sprawdzanie StrikeID dla każdego przeciwnika z osobna.
  }

  onItemHit(item) {
    if (item) item.flashT = 0.15;
  }

  draw(ctx) {
    if (!this.sprite) {
      for (const it of this.items) {
        ctx.save();
        ctx.fillStyle = ORBITAL_COLOR;
        ctx.beginPath();
        ctx.arc(it.ox, it.oy, ORBITAL_BASE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    const drawSize = ORBITAL_BASE_SIZE * 2;

    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      ctx.save();

      const glowPulse = 5 + 3 * Math.sin(performance.now() / 150 + i);
      ctx.shadowBlur = it.flashT > 0 ? 20 : glowPulse;
      ctx.shadowColor = it.flashT > 0 ? '#FFF' : ORBITAL_GLOW_COLOR;

      ctx.translate(it.ox, it.oy);
      const rotationAngle = this.angle + i * (Math.PI * 2 / this.items.length);
      ctx.rotate(rotationAngle);

      // FIX Ad 1: Poprawny efekt Flash - używamy filtru CSS canvasa jak w Enemy.js (brightness 5)
      if (it.flashT > 0) {
        ctx.filter = 'grayscale(1) brightness(5)';
      }

      ctx.drawImage(this.sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

      ctx.filter = 'none'; // Reset filtru
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