// ==============
// CHEST.JS (v0.91f - Fix: Circular Dependency Crash)
// Lokalizacja: /js/entities/chest.js
// ==============

import { Pickup } from './pickup.js';

// USUNIĘTO IMPORT: import { openChest } from '../managers/levelManager.js'; 
// Ten import powodował błąd "Cannot access 'AutoGun' before initialization" (pętla zależności).
// Zamiast tego używamy globalnego wrappera window.wrappedOpenChest.

export class Chest extends Pickup {
  constructor(x, y) {
    // Ustawiamy typ 'chest', co pozwoli klasie Pickup użyć 'pickups/chest.png' i złotej poświaty
    super(x, y, 'chest');
    // Skrzynia ma bardzo długi czas życia (praktycznie nieskończony)
    this.life = 999999;
  }
  
  // Nadpisujemy applyEffect, bo skrzynia działa inaczej niż zwykły pickup
  applyEffect(state) {
    // Wywołujemy globalny wrapper otwierania skrzyni zdefiniowany w eventManager.js
    if (window.wrappedOpenChest) {
      window.wrappedOpenChest();
    } else {
      console.error("Brak dostępu do wrappedOpenChest! Upewnij się, że eventManager jest zainicjalizowany.");
    }
  }
  
  update(dt) {
    // Skrzynia nie traci życia z czasem (w przeciwieństwie do zwykłych pickupów),
    // więc NIE wywołujemy super.update(dt).
  }
  
  // Metoda draw() jest dziedziczona z klasy Pickup, co gwarantuje
  // ten sam styl, rozmiar (48px), poświatę i czcionkę co inne obiekty.
}