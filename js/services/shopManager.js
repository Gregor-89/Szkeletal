// ==============
// SHOPMANAGER.JS (v1.10e - Point Persistence Fix)
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
    this.load();
    this.validateIntegrity();
  }
  
  load() {
    // FIX: Zawsze rzutujemy na Number i parsujemy int, by uniknąć NaN w pamięci
    const rawMax = localStorage.getItem(STORAGE_KEYS.MAX_SCORE);
    const rawSpent = localStorage.getItem(STORAGE_KEYS.SPENT);
    const rawTotal = localStorage.getItem(STORAGE_KEYS.TOTAL_PURCHASES);
    
    this.maxScore = Number(rawMax) || 0;
    this.spentPoints = Number(rawSpent) || 0;
    this.totalPurchases = Number(rawTotal) || 0;
    
    const storedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    try {
      this.boughtUpgrades = storedUpgrades ? JSON.parse(storedUpgrades) : {};
    } catch (e) {
      console.error("[SHOP] Dane ulepszeń uszkodzone, używam pustego obiektu.");
      this.boughtUpgrades = {};
    }
  }
  
  validateIntegrity() {
    const storedCheck = localStorage.getItem(STORAGE_KEYS.CHECKSUM);
    const currentData = JSON.stringify(this.boughtUpgrades) + this.maxScore + this.spentPoints + this.totalPurchases;
    const calculatedCheck = encrypt(currentData.length);
    
    if (storedCheck && storedCheck !== calculatedCheck) {
      console.warn("[SHOP] Integracja danych naruszona. Próba automatycznej naprawy...");
      // Naprawiamy checksum zamiast zerować punkty
      this.save();
      return false;
    }
    return true;
  }
  
  save() {
    localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore.toString());
    localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints.toString());
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
    localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases.toString());
    
    const currentData = JSON.stringify(this.boughtUpgrades) + this.maxScore + this.spentPoints + this.totalPurchases;
    localStorage.setItem(STORAGE_KEYS.CHECKSUM, encrypt(currentData.length));
  }
  
  // LOGIKA ORYGINALNA: Punkty w sklepie to Twój najwyższy uzyskany wynik
  updateMaxScore(newScore) {
    const scoreVal = Math.floor(Number(newScore) || 0);
    if (scoreVal > this.maxScore) {
      console.log(`[SHOP] NOWY REKORD PUNKTOWY: ${scoreVal}. Poprzedni: ${this.maxScore}`);
      this.maxScore = scoreVal;
      this.save();
      return true;
    }
    return false;
  }
  
  getWalletBalance() {
    // Portfel to Twój HighScore minus to co wydałeś na ulepszenia
    const balance = Number(this.maxScore) - Number(this.spentPoints);
    return Math.max(0, balance);
  }
  
  getUpgradeLevel(upgradeId) {
    return this.boughtUpgrades[upgradeId] || 0;
  }
  
  calculateNextCost() {
    // Koszt skaluje się na podstawie całkowitej liczby zakupionych poziomów
    let cost = SHOP_CONFIG.BASE_COST * Math.pow(SHOP_CONFIG.COST_MULTIPLIER || 1.5, this.totalPurchases);
    return Math.round(cost / 1000) * 1000 || 1000;
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
    this.spentPoints = 0;
    this.totalPurchases = 0;
    this.save();
    console.log("[SHOP] Ulepszenia zresetowane.");
  }
  
  isOwned(upgradeId) {
    return this.getUpgradeLevel(upgradeId) > 0;
  }
}

export const shopManager = new ShopManager();