// ==============
// SHOPMANAGER.JS (v1.10h - Points Persistence & Shop Logic Fix)
// Lokalizacja: /js/services/shopManager.js
// ==============

import { SHOP_CONFIG } from '../config/gameData.js';
import { perkPool } from '../config/perks.js';

const STORAGE_KEYS = {
  MAX_SCORE: 'szkeletal_persistent_max_score',
  SPENT: 'szkeletal_spent_points',
  UPGRADES: 'szkeletal_bought_upgrades_v2', // Struktura poziomu ulepszeń
  TOTAL_PURCHASES: 'szkeletal_shop_total_count' // Licznik wszystkich kupionych poziomów
};

class ShopManager {
  constructor() {
    this.load();
  }
  
  load() {
    // FIX: Powrót do prostej, działającej logiki rzutowania (Problem Ad 6)
    const rawMax = localStorage.getItem(STORAGE_KEYS.MAX_SCORE);
    const rawSpent = localStorage.getItem(STORAGE_KEYS.SPENT);
    const rawTotal = localStorage.getItem(STORAGE_KEYS.TOTAL_PURCHASES);
    
    // Używamy parseInt, by uniknąć problemów z typami w porównaniach
    this.maxScore = parseInt(rawMax) || 0;
    this.spentPoints = parseInt(rawSpent) || 0;
    this.totalPurchases = parseInt(rawTotal) || 0;
    
    const storedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    try {
      this.boughtUpgrades = storedUpgrades ? JSON.parse(storedUpgrades) : {};
    } catch (e) {
      console.error("[SHOP] Dane ulepszeń uszkodzone, ładuję puste.");
      this.boughtUpgrades = {};
    }
    
    console.log(`[SHOP-LOAD] MaxScore: ${this.maxScore}, Spent: ${this.spentPoints}, Wallet: ${this.getWalletBalance()}`);
  }
  
  save() {
    // Zapisujemy wartości jako stringi dla localStorage
    localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore.toString());
    localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints.toString());
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
    localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases.toString());
  }
  
  getWalletBalance() {
    // Saldo to Twój rekord punktowy minus wydatki na ulepszenia
    const balance = Number(this.maxScore) - Number(this.spentPoints);
    return Math.max(0, Math.floor(balance));
  }
  
  getUpgradeLevel(upgradeId) {
    return this.boughtUpgrades[upgradeId] || 0;
  }
  
  calculateNextCost() {
    // Koszt skaluje się na podstawie całkowitej liczby zakupionych poziomów
    const multiplier = SHOP_CONFIG.COST_MULTIPLIER || 1.5;
    let cost = SHOP_CONFIG.BASE_COST * Math.pow(multiplier, this.totalPurchases);
    return Math.round(cost / 1000) * 1000 || 1000;
  }
  
  canBuy(upgradeId) {
    const config = SHOP_CONFIG.UPGRADES[upgradeId];
    const perkData = perkPool.find(p => p.id === upgradeId);
    if (!config || !perkData) return false;
    
    const currentLvl = this.getUpgradeLevel(upgradeId);
    if (currentLvl >= (perkData.max || 1)) return false;
    
    // Sprawdzenie zależności ulepszeń
    if (currentLvl === 0 && config.dependsOn && this.getUpgradeLevel(config.dependsOn) === 0) {
      return false;
    }
    
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
    console.log(`[SHOP-BUY] Kupiono ${upgradeId}. Nowy portfel: ${this.getWalletBalance()}`);
    return true;
  }
  
  resetUpgrades() {
    this.boughtUpgrades = {};
    this.spentPoints = 0;
    this.totalPurchases = 0;
    this.save();
    console.log("[SHOP] Ulepszenia zresetowane.");
  }
  
  updateMaxScore(newScore) {
    const scoreVal = Math.floor(Number(newScore) || 0);
    // Sklep punktowy bazuje na pobiciu HighScore (Twoja waluta)
    if (scoreVal > this.maxScore) {
      console.log(`[SHOP-SYNC] NOWY REKORD: ${scoreVal}. Poprzedni: ${this.maxScore}`);
      this.maxScore = scoreVal;
      this.save();
      return true;
    }
    return false;
  }
  
  isOwned(upgradeId) {
    return this.getUpgradeLevel(upgradeId) > 0;
  }
}

export const shopManager = new ShopManager();