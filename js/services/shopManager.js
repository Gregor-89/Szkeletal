// ==============
// SHOPMANAGER.JS (v1.10 - Multi-Level Upgrades - Restoration v0.110m)
// Lokalizacja: /js/services/shopManager.js
// ==============

import { SHOP_CONFIG } from '../config/gameData.js';
import { perkPool } from '../config/perks.js';

const STORAGE_KEYS = {
  MAX_SCORE: 'szkeletal_persistent_max_score',
  SPENT: 'szkeletal_spent_points',
  UPGRADES: 'szkeletal_bought_upgrades_v2', // Nowy klucz dla struktury poziomów
  TOTAL_PURCHASES: 'szkeletal_shop_total_count', // Licznik wszystkich kupionych poziomów dla ceny
  CHECKSUM: 'szkeletal_shop_integrity_v2'
};

const SALT = 7492;
const encrypt = (val) => Math.floor((val * 17 + SALT) ^ 0xDEADBEEF).toString(16);

class ShopManager {
  constructor() {
    this.maxScore = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_SCORE)) || 0;
    this.spentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.SPENT)) || 0;
    // Obiekt przechowujący ulepszenia jako { upgradeId: poziom }
    const storedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    this.boughtUpgrades = storedUpgrades ? JSON.parse(storedUpgrades) : {};
    this.totalPurchases = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_PURCHASES)) || 0;
    this.validateIntegrity();
  }
  
  validateIntegrity() {
    const storedHash = localStorage.getItem(STORAGE_KEYS.CHECKSUM);
    const currentHash = encrypt(this.maxScore + this.spentPoints + this.totalPurchases);
    if (storedHash && storedHash !== currentHash) {
      console.warn("[Shop] Wykryto nieautoryzowaną zmianę punktów sklepiku!");
      // Opcjonalnie: kara lub reset, ale na razie tylko logujemy
    }
  }
  
  save() {
    localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore.toString());
    localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints.toString());
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
    localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases.toString());
    localStorage.setItem(STORAGE_KEYS.CHECKSUM, encrypt(this.maxScore + this.spentPoints + this.totalPurchases));
  }
  
  updateMaxScore(newScore) {
    if (newScore > this.maxScore) {
      this.maxScore = Math.floor(newScore);
      this.save();
      console.log("[Shop] Nowy High Score zapisany jako budżet:", this.maxScore);
    }
  }
  
  getWalletBalance() {
    return Math.max(0, this.maxScore - this.spentPoints);
  }
  
  getUpgradeLevel(upgradeId) {
    return this.boughtUpgrades[upgradeId] || 0;
  }
  
  calculateNextCost() {
    // Każdy kupiony poziom (dowolnego ulepszenia) podnosi cenę o 50% bazy
    const baseCost = SHOP_CONFIG.BASE_COST || 100;
    const multiplier = 1.5;
    return Math.floor(baseCost * Math.pow(multiplier, this.totalPurchases));
  }
  
  canBuy(upgradeId) {
    const config = SHOP_CONFIG.UPGRADES[upgradeId];
    const perkData = perkPool.find(p => p.id === upgradeId);
    if (!config || !perkData) return false;
    
    const currentLvl = this.getUpgradeLevel(upgradeId);
    
    // Sprawdź limit poziomów (z perkPool)
    if (currentLvl >= (perkData.max || 1)) return false;
    
    // Sprawdź zależności (tylko poziom 1 wymaga zależności)
    if (currentLvl === 0 && config.dependsOn && this.getUpgradeLevel(config.dependsOn) === 0) {
      return false;
    }
    
    // Sprawdź środki
    return this.getWalletBalance() >= this.calculateNextCost();
  }
  
  buyUpgrade(upgradeId) {
    if (!this.canBuy(upgradeId)) return false;
    
    const cost = this.calculateNextCost();
    this.spentPoints += cost;
    
    if (!this.boughtUpgrades[upgradeId]) {
      this.boughtUpgrades[upgradeId] = 0;
    }
    this.boughtUpgrades[upgradeId]++;
    this.totalPurchases++;
    
    this.save();
    return true;
  }
  
  resetUpgrades() {
    this.boughtUpgrades = {};
    this.spentPoints = 0; // POPRAWKA: Resetujemy też wydane punkty
    this.totalPurchases = 0;
    this.save();
    console.log("[Shop] Wszystkie ulepszenia zostały zresetowane.");
  }
}

export const shopManager = new ShopManager();