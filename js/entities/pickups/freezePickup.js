// ==============
// FREEZEPICKUP.JS (v0.72 - Refaktoryzacja Logiki Pickupów)
// Lokalizacja: /js/entities/pickups/freezePickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
import { PICKUP_CONFIG } from '../../config/gameData.js';
import { playSound } from '../../services/audio.js';

/**
 * Pickup Zamrożenie.
 */
export class FreezePickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'freeze');
  }
  
  /**
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt Zamrożenia.
   */
  applyEffect(state) {
    const { game } = state;
    
    // Logika przeniesiona z collisions.js
    game.freezeT = PICKUP_CONFIG.FREEZE_DURATION;
    playSound('FreezePickup');
  }
}