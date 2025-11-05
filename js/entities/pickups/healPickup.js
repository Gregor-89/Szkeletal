// ==============
// HEALPICKUP.JS (v0.72 - Refaktoryzacja Logiki Pickupów)
// Lokalizacja: /js/entities/pickups/healPickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
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
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt leczenia.
   */
  applyEffect(state) {
    const { game, player, hitTextPool, hitTexts } = state;
    
    // Logika przeniesiona z collisions.js
    const healAmount = PLAYER_CONFIG.HEAL_AMOUNT;
    game.health = Math.min(game.maxHealth, game.health + healAmount);
    
    addHitText(hitTextPool, hitTexts, player.x, player.y - 16, -healAmount, '#4caf50', '+HP');
    playSound('HealPickup');
  }
}