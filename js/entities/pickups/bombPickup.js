// ==============
// BOMBPICKUP.JS (v0.76a - FIX: Przekazanie flagi 'isWallNuke' do areaNuke)
// Lokalizacja: /js/entities/pickups/bombPickup.js
// ==============

import { Pickup } from '../pickup.js';
// NOWE IMPORTY (v0.72)
import { PICKUP_CONFIG } from '../../config/gameData.js';
import { areaNuke } from '../../core/utils.js'; // Zmieniono ścieżkę importu na 'core/utils.js'
import { playSound } from '../../services/audio.js';

/**
 * Pickup Bomba.
 */
export class BombPickup extends Pickup {
  constructor(x, y) {
    super(x, y, 'bomb');
  }
  
  /**
   * (v0.72) Nadpisuje metodę bazową, aby zastosować efekt Bomby.
   */
  applyEffect(state) {
    const { game, player, settings, enemies, gemsPool, pickups, particlePool, bombIndicators } = state;
    
    // Logika przeniesiona z collisions.js
    // POPRAWKA v0.76a: Dodano 'false' jako ostatni argument (isWallNuke)
    areaNuke(
      player.x,
      player.y,
      PICKUP_CONFIG.BOMB_RADIUS,
      true, // onlyXP = true
      game, settings, enemies, gemsPool, pickups, particlePool, bombIndicators,
      false // <-- NOWA FLAGA: isWallNuke (to jest bomba, nie Oblężnik)
    );
    playSound('BombPickup');
  }
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.76a] js/entities/pickups/bombPickup.js: Przekazano flagę isWallNuke=false do areaNuke().');