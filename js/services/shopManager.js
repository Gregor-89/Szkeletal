// ==============
// SHOPMANAGER.JS (v1.10c - Final Points Fix)
// Lokalizacja: /js/services/shopManager.js
// ==============

import { SHOP_CONFIG } from '../config/gameData.js';
import { perkPool } from '../config/perks.js';
import { getLang } from './i18n.js';

const STORAGE_KEYS = {
  MAX_SCORE: 'szkeletal_persistent_max_score',
  SPENT: 'szkeletal_spent_points',
  UPGRADES: 'szkeletal_bought_upgrades_v2',
  TOTAL_PURCHASES: 'szkeletal_shop_total_count',
  CHECKSUM: 'szkeletal_shop_integrity_v2'
};

const SALT = 7492;
const encrypt = (val) => Math.floor((val * 17 + SALT) ^ 0xDEADBEEF).toString(16);

class ShopManager {
  constructor() {
    this.maxScore = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_SCORE)) || 0;
    this.spentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.SPENT)) || 0;
    
    const storedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
    this.boughtUpgrades = storedUpgrades ? JSON.parse(storedUpgrades) : {};
    
    this.totalPurchases = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_PURCHASES)) || 0;
    
    // Walidacja przy starcie - logujemy błąd, ale pozwalamy grać na danych z localStorage
    if (!this.validateIntegrity()) {
      console.warn("[SHOP] Data integrity warning. Points loaded from local storage.");
    }
  }
  
  validateIntegrity() {
    const storedCheck = localStorage.getItem(STORAGE_KEYS.CHECKSUM);
    if (!storedCheck) return true;
    
    // ZMIANA v0.110f: Bardziej stabilna metoda sumy kontrolnej bazująca na wartościach liczbowych
    const checksumBase = this.maxScore + this.spentPoints + this.totalPurchases;
    const calculatedCheck = encrypt(checksumBase);
    
    return storedCheck === calculatedCheck;
  }
  
  save() {
    localStorage.setItem(STORAGE_KEYS.MAX_SCORE, this.maxScore);
    localStorage.setItem(STORAGE_KEYS.SPENT, this.spentPoints);
    localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.boughtUpgrades));
    localStorage.setItem(STORAGE_KEYS.TOTAL_PURCHASES, this.totalPurchases);
    
    // Zapis nowej sumy kontrolnej
    const checksumBase = this.maxScore + this.spentPoints + this.totalPurchases;
    localStorage.setItem(STORAGE_KEYS.CHECKSUM, encrypt(checksumBase));
    
    console.log(`[SHOP] Data saved. Wallet: ${this.getWalletBalance()} (Max: ${this.maxScore}, Spent: ${this.spentPoints})`);
  }
  
  getWalletBalance() {
    const balance = this.maxScore - this.spentPoints;
    return balance > 0 ? balance : 0;
  }
  
  calculateNextCost() {
    let cost = SHOP_CONFIG.BASE_COST * Math.pow(SHOP_CONFIG.COST_MULTIPLIER, this.totalPurchases);
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
  }
  
  updateMaxScore(newScore) {
    const scoreToAdd = Math.floor(newScore);
    if (scoreToAdd > this.maxScore) {
      this.maxScore = scoreToAdd;
      this.save();
      console.log(`[SHOP] New High Score updated: ${this.maxScore}`);
      return true;
    }
    return false;
  }
  
  isOwned(upgradeId) {
    return this.getUpgradeLevel(upgradeId) > 0;
  }
  
  getCurrencyLabel() {
    return getLang('ui_shop_currency') || "PKT";
  }
}

export const shopManager = new ShopManager();