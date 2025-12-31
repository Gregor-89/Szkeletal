// ==============
// SHOPMANAGER.JS (v1.10 - Multi-Level Upgrades)
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
    const storedCheck = localStorage.getItem(STORAGE_KEYS.CHECKSUM);
    const currentData = JSON.stringify(this.boughtUpgrades) + this.maxScore + this.spentPoints + this.totalPurchases;
    const calculatedCheck = encrypt(currentData.length);
    
    if (storedCheck && storedCheck !== calculatedCheck) {
      console.warn("[SHOP] Integrity Breach Detected!");
      return false;
    }
    return true;
  }
  
  save() {
    localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore);
    localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints);
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
    localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases);
    
    const currentData = JSON.stringify(this.boughtUpgrades) + this.maxScore + this.spentPoints + this.totalPurchases;
    localStorage.setItem(STORAGE_KEYS.CHECKSUM, encrypt(currentData.length));
  }
  
  getWalletBalance() {
    // Upewniamy się, że operujemy na liczbach, aby uniknąć błędów typu NaN
    return Math.max(0, Number(this.maxScore) - Number(this.spentPoints));
  }
  
  calculateNextCost() {
    // Koszt skaluje się na podstawie całkowitej liczby zakupionych poziomów
    let cost = SHOP_CONFIG.BASE_COST * Math.pow(SHOP_CONFIG.COST_MULTIPLIER, this.totalPurchases);
    // Zaokrąglamy do pełnych tysięcy dla estetyki retro
    return Math.round(cost / 1000) * 1000;
  }
  
  getUpgradeLevel(upgradeId) {
    return this.boughtUpgrades[upgradeId] || 0;
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
    this.spentPoints = 0; // POPRAWKA: Resetujemy też wydane punkty, by odzyskać budżet
    this.totalPurchases = 0;
    this.save();
    console.log("[Shop] Ulepszenia zresetowane.");
  }
  
  updateMaxScore(newScore) {
    const scoreVal = Math.floor(newScore);
    if (scoreVal > this.maxScore) {
      this.maxScore = scoreVal;
      this.save();
      console.log("[Shop] Budżet zaktualizowany o nowy High Score:", scoreVal);
      return true;
    }
    return false;
  }
  
  isOwned(upgradeId) {
    return this.getUpgradeLevel(upgradeId) > 0;
  }
}

export const shopManager = new ShopManager();