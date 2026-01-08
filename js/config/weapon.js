// ==============
// WEAPON.JS (v0.71 - Refaktoryzacja: Tylko Klasa Bazowa)
// Lokalizacja: /js/config/weapon.js
// ==============

// (Usunięto importy, ponieważ klasa bazowa nie ma zależności)

// ===================================
// KLASA BAZOWA BRONI
// ===================================

export class Weapon {
    constructor(player) {
        this.player = player;
        this.level = 1;
        this.lastFire = 0;
    }
    
    update(state) {
        // Domyślnie nic nie rób
    }
    
    draw(ctx) {
        // Domyślnie nic nie rysuj
    }
    
    upgrade(perk) {
        this.level++;
        // Wywołujemy updateStats() bez argumentu,
        // ponieważ teraz będzie ona pobierać dane z PERK_CONFIG
        this.updateStats();
    }
    
    updateStats() {
        // Domyślnie nic nie rób
    }
    
    toJSON() {
        return {
            type: this.constructor.name,
            level: this.level,
            lastFire: this.lastFire
        };
    }
}

// ===================================
// BRONIE SPECJALISTYCZNE (Usunięto)
// ===================================
// Klasy AutoGun, OrbitalWeapon i NovaWeapon zostały przeniesione do 
// /js/config/weapons/