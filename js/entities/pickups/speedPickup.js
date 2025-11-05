// ==============
// SPEEDPICKUP.JS (v0.72 - Refaktoryzacja Logiki Pickupów)
// Lokalizacja: /js/entities/pickups/speedPickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
import { PICKUP_CONFIG } from '../../config/gameData.js';
import { playSound } from '../../services/audio.js';

/**
 * Pickup Szybkość.
 */
export class SpeedPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'speed');
  }
  
  /**
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt Szybkości.
   */
  applyEffect(state) {
    const { game } = state;
    
    // Logika przeniesiona z collisions.js
    game.speedT = PICKUP_CONFIG.SPEED_DURATION;
    playSound('SpeedPickup');
  }
}