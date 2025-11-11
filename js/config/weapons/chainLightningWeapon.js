// ==============
// CHAINLIGHTNINGWEAPON.JS (v0.82b - FIX: Implementacja killEnemy)
// Lokalizacja: /js/config/weapons/chainLightningWeapon.js
// ==============

import { Weapon } from '../weapon.js';
import { PERK_CONFIG } from '../gameData.js';
import { playSound } from '../../services/audio.js';
// POPRAWKA v0.82b: Import killEnemy i addHitText
import { addHitText } from '../../core/utils.js';
import { killEnemy } from '../../managers/enemyManager.js';

// Kolor efektu
const LIGHTNING_COLOR = '#40C4FF';
// Maksymalny zasięg wyszukiwania kolejnego celu (w pikselach)
const MAX_CHAIN_DISTANCE = 200;

/**
 * Piorun Łańcuchowy: Broń obszarowa, przeskakująca między celami.
 */
export class ChainLightningWeapon extends Weapon {
  constructor(player) {
    super(player);
    this.timer = 0;
    
    // Cache konfiguracji
    this.lightningConfig = PERK_CONFIG.chainLightning;
    
    // Statystyki dynamiczne
    this.cooldown = 0;
    this.damage = 0;
    this.targets = 0;
    
    // Stan efektu wizualnego
    this.effectTimer = 0; // Czas (s), przez jaki piorun jest widoczny
    this.lastTargets = []; // Tablica wrogów trafionych ostatnim atakiem
    
    this.updateStats(); // Inicjalizacja statystyk
  }
  
  /**
   * Aktualizuje statystyki broni na podstawie jej poziomu i konfiguracji.
   */
  updateStats() {
    this.damage = this.lightningConfig.calculateDamage(this.level);
    this.cooldown = this.lightningConfig.calculateCooldown(this.level);
    this.targets = this.lightningConfig.calculateTargets(this.level);
    
    // Ustaw timer przy pierwszym ulepszeniu
    if (this.timer === 0) {
      this.timer = this.cooldown;
    }
  }
  
  /**
   * Główna pętla aktualizacji broni.
   */
  update(state) {
    // POPRAWKA v0.82b: Pobierz cały state, a nie tylko 'dt' i 'enemies'
    const { 
        dt, enemies, hitTextPool, hitTexts, 
        game, settings, particlePool, gemsPool, pickups, chests 
    } = state;
    
    // Odliczaj timer ataku i timer efektu wizualnego
    this.timer -= dt;
    if (this.effectTimer > 0) {
        this.effectTimer -= dt;
    }

    if (this.timer <= 0) {
      this.timer = this.cooldown;
      
      this.lastTargets = []; // Wyczyść cele dla efektu rysowania
      const excludedIds = {}; // Obiekty, które już trafił piorun
      
      let currentTarget = null;
      let currentIndex = -1; // POPRAWKA v0.82b: Przechowuj indeks
      let currentX = this.player.x;
      let currentY = this.player.y;
      
      for (let i = 0; i < this.targets; i++) {
          
          // 1. Znajdź najbliższy cel
          let closestDist = MAX_CHAIN_DISTANCE;
          let nextTarget = null;
          let nextIndex = -1; // POPRAWKA v0.82b
          
          // POPRAWKA v0.82b: Użyj pętli wstecznej, aby móc bezpiecznie usuwać
          for (let j = enemies.length - 1; j >= 0; j--) {
              const enemy = enemies[j];
              if (excludedIds[enemy.id]) continue; // Pomiń już trafionych
              
              const dist = Math.hypot(currentX - enemy.x, currentY - enemy.y);
              if (dist < closestDist) {
                  closestDist = dist;
                  nextTarget = enemy;
                  nextIndex = j; // Zapisz indeks
              }
          }
          
          if (nextTarget) {
              // 2. Znaleziono cel
              currentTarget = nextTarget;
              currentIndex = nextIndex;
              this.lastTargets.push(currentTarget);
              excludedIds[currentTarget.id] = true;
              
              // 3. Zadaj obrażenia i efekty
              currentTarget.takeDamage(this.damage);
              addHitText(hitTextPool, hitTexts, currentTarget.x, currentTarget.y, this.damage, LIGHTNING_COLOR);
              
              // 4. POPRAWKA v0.82b: Sprawdź, czy wróg zginął i usuń go
              if (currentTarget.hp <= 0) {
                  state.enemyIdCounter = killEnemy(currentIndex, currentTarget, game, settings, enemies, particlePool, gemsPool, pickups, state.enemyIdCounter, chests, false);
                  // Wróg został usunięty z tablicy 'enemies'
              }
              
              // 5. Ustaw punkt startowy dla następnej iteracji
              currentX = currentTarget.x;
              currentY = currentTarget.y;
          } else {
              // 6. Nie ma więcej celów w zasięgu
              break;
          }
      }
      
      if (this.lastTargets.length > 0) {
          // Jeśli trafiliśmy cokolwiek, włącz efekt wizualny i dźwięk
          this.effectTimer = this.lightningConfig.VISUAL_DURATION;
          playSound('ChainLightning');
      }
    }
  }
  
  /**
   * Rysuje efekt pioruna, jeśli jest aktywny.
   */
  draw(ctx) {
    if (this.effectTimer <= 0 || this.lastTargets.length === 0) {
      return; // Nic do narysowania
    }
    
    ctx.save();
    
    // Efekt zanikania
    const alpha = Math.max(0, this.effectTimer / this.lightningConfig.VISUAL_DURATION);
    ctx.globalAlpha = alpha;
    
    ctx.strokeStyle = LIGHTNING_COLOR;
    ctx.lineWidth = 3;
    ctx.shadowColor = LIGHTNING_COLOR;
    ctx.shadowBlur = 15;
    
    let startX = this.player.x;
    let startY = this.player.y;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Iteruj po celach, które *mogą już nie istnieć*, ale ich ostatnie pozycje są zapisane
    for (const target of this.lastTargets) {
        // Rysuj postrzępioną linię (piorun)
        const dx = target.x - startX;
        const dy = target.y - startY;
        const dist = Math.hypot(dx, dy);
        const segments = Math.max(2, Math.floor(dist / 20)); // Ilość segmentów pioruna
        const jitter = 10; // Jak bardzo linia "skacze"
        
        for (let i = 1; i <= segments; i++) {
            const frac = i / segments;
            let tx = startX + dx * frac;
            let ty = startY + dy * frac;
            
            // Nie dodawaj jittera do ostatniego segmentu (musi trafić w cel)
            if (i < segments) {
                tx += (Math.random() - 0.5) * jitter;
                ty += (Math.random() - 0.5) * jitter;
            }
            ctx.lineTo(tx, ty);
        }
        
        // Następna linia zacznie się od tego celu
        startX = target.x;
        startY = target.y;
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      timer: this.timer,
      effectTimer: this.effectTimer
    };
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.82b] js/config/weapons/chainLightningWeapon.js: Naprawiono błąd braku obrażeń (dodano wywołanie killEnemy).');