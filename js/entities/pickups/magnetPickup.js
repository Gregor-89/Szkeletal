// ==============
// MAGNETPICKUP.JS (v0.72 - Refaktoryzacja Logiki Pickupów)
// Lokalizacja: /js/entities/pickups/magnetPickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
import { PICKUP_CONFIG } from '../../config/gameData.js';
import { playSound } from '../../services/audio.js';

/**
 * Pickup Magnes.
 */
export class MagnetPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'magnet');
  }
  
  /**
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt Magnesu.
   */
  applyEffect(state) {
    const { game } = state;
    
    // Logika przeniesiona z collisions.js
    game.magnet = true;
    game.magnetT = PICKUP_CONFIG.MAGNET_DURATION;
    playSound('MagnetPickup');
  }
}