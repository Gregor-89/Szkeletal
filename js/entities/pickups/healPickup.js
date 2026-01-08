// ==============
// HEALPICKUP.JS (v0.72b - Full Heal Fix)
// Lokalizacja: /js/entities/pickups/healPickup.js
// ==============

import { Pickup } from '../pickup.js';
import { PLAYER_CONFIG } from '../../config/gameData.js';
import { addHitText } from '../../core/utils.js';
import { playSound } from '../../services/audio.js';

/**
 * Pickup Leczący.
 */
export class HealPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'heal');
  }
  
  /**
   * (v0.72b) Zmodyfikowano, aby zawsze odzyskiwać 100% życia.
   */
  applyEffect(state) {
    const { game, player, hitTextPool, hitTexts } = state;
    
    // Obliczanie brakującego zdrowia do pełnego wyleczenia
    const missingHp = game.maxHealth - game.health;
    
    if (missingHp > 0) {
      game.health = game.maxHealth;
      addHitText(hitTextPool, hitTexts, player.x, player.y - 16, -missingHp, '#4caf50', '+MAX HP');
    } else {
      // Jeśli życie jest pełne, nadal pokazujemy tekst dla potwierdzenia
      addHitText(hitTextPool, hitTexts, player.x, player.y - 16, 0, '#4caf50', 'FULL HP');
    }
    
    playSound('HealPickup');
  }
}