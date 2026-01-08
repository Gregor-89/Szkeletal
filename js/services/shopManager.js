// ==============
// SHOPMANAGER.JS (v1.23 - Final Persistent Wallet Fix)
// Lokalizacja: /js/services/shopManager.js
// ==============

import { SHOP_CONFIG } from '../config/gameData.js';
import { perkPool } from '../config/perks.js';

const STORAGE_KEYS = {
  MAX_SCORE: 'szkeletal_persistent_max_score',
  SPENT: 'szkeletal_spent_points',
  UPGRADES: 'szkeletal_bought_upgrades_v2',
  TOTAL_PURCHASES: 'szkeletal_shop_total_count'
};

class ShopManager {
  constructor() {
    this.maxScore = 0;
    this.spentPoints = 0;
    this.totalPurchases = 0;
    this.boughtUpgrades = {};
    // Pierwsze ładowanie przy starcie
    this.load();
  }
  
  /**
   * Wczytuje surowe dane z localStorage i konwertuje na liczby.
   */
  load() {
    try {
      const rawMax = localStorage.getItem(STORAGE_KEYS.MAX_SCORE);
      const rawSpent = localStorage.getItem(STORAGE_KEYS.SPENT);
      const rawTotal = localStorage.getItem(STORAGE_KEYS.TOTAL_PURCHASES);
      
      const parseRobust = (val) => {
        if (val === null || val === undefined || val === "") return 0;
        const parsed = /[a-f]/i.test(val) ? parseInt(val, 16) : parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      this.maxScore = parseRobust(rawMax);
      this.spentPoints = parseRobust(rawSpent);
      this.totalPurchases = parseRobust(rawTotal);
      
      const storedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
      try {
        this.boughtUpgrades = storedUpgrades ? JSON.parse(storedUpgrades) : {};
      } catch (e) {
        this.boughtUpgrades = {};
      }
    } catch (e) {
      console.error("[SHOP] Krytyczny błąd odczytu localStorage.");
    }
  }
  
  /**
   * Zapisuje stan portfela.
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore.toString());
      localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints.toString());
      localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
      localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases.toString());
      console.log(`[SHOP-SAVE] Zapis zakończony. Rekord: ${this.maxScore}, Wydatki: ${this.spentPoints}`);
    } catch (e) {
      console.error("[SHOP] Błąd zapisu do localStorage!");
    }
  }
  
  /**
   * Zwraca saldo. WYMUSZA przeładowanie z dysku, aby UI widziało zmiany.
   */
  getWalletBalance() {
    this.load(); // Synchronizacja przed zwróceniem wartości
    const balance = Number(this.maxScore) - Number(this.spentPoints);
    return Math.max(0, Math.floor(balance));
  }
  
  getUpgradeLevel(upgradeId) {
    return this.boughtUpgrades[upgradeId] || 0;
  }
  
  calculateNextCost() {
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
    return true;
  }
  
  resetUpgrades() {
    this.boughtUpgrades = {};
    this.spentPoints = 0;
    this.totalPurchases = 0;
    this.save();
    console.log("[SHOP] Reset wszystkich ulepszeń.");
  }
  
  /**
   * AKTUALIZACJA SALDA (Logika "Bicia Salda"):
   * Wywoływana przez scoreManager przy zapisie wyniku.
   */
  updateMaxScore(newRunScore) {
    this.load(); // Najpierw pobierz aktualne Spent
    const scoreVal = Math.floor(Number(newRunScore) || 0);
    const currentWallet = this.getWalletBalance();
    
    console.log(`[SHOP-SYNC] Próba synchronizacji. Wynik: ${scoreVal}, Portfel: ${currentWallet}`);
    
    if (scoreVal > currentWallet) {
      // Obliczamy nowy rekord: maxScore = wydatki + to co chcemy mieć w portfelu
      // Dzięki temu Portfel pokaże dokładnie wynik rundy (Score = MaxScore - Spent)
      this.maxScore = this.spentPoints + scoreVal;
      console.log(`[SHOP-SYNC] NOWE SALDO USTALONE: ${scoreVal}`);
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