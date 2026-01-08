// ==============
// SHIELDPICKUP.JS (v0.72 - Refaktoryzacja Logiki Pickupów)
// Lokalizacja: /js/entities/pickups/shieldPickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
import { PICKUP_CONFIG } from '../../config/gameData.js';
import { playSound } from '../../services/audio.js';

/**
 * Pickup Tarcza.
 */
export class ShieldPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'shield');
  }
  
  /**
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt Tarczy.
   */
  applyEffect(state) {
    const { game } = state;
    
    // Logika przeniesiona z collisions.js
    game.shield = true;
    game.shieldT = PICKUP_CONFIG.SHIELD_DURATION;
    playSound('ShieldPickup');
  }
}