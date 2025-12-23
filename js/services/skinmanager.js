// ==============
// SKINMANAGER.JS (v1.06 - JSON Fix & Robustness)
// Lokalizacja: /js/services/skinManager.js
// ==============

// Cache dla szybkiego dostępu
let currentSkinCache = localStorage.getItem('szkeletal_current_skin') || 'default';

// Pomocnicza funkcja do bezpiecznego parsowania JSON (usuwa znaki sterujące)
function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("[SkinManager] Wykryto uszkodzony JSON, próbuję naprawić...", e);
    try {
      // Usuwamy znaki sterujące (ASCII 0-31), które często psują JSON.parse
      const sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error("[SkinManager] Nie udało się naprawić JSON:", e2);
      return fallback;
    }
  }
}

export function getUnlockedSkins() {
  const stored = localStorage.getItem('szkeletal_skins_unlocked');
  return safeJsonParse(stored, ['default']);
}

export function unlockSkin(skinId) {
  const skins = getUnlockedSkins();
  if (!skins.includes(skinId)) {
    skins.push(skinId);
    try {
      localStorage.setItem('szkeletal_skins_unlocked', JSON.stringify(skins));
      console.log(`[SkinManager] Odblokowano skin: ${skinId}`);
    } catch (e) {
      console.error("[SkinManager] Błąd zapisu skinów:", e);
    }
  }
}

export function getCurrentSkin() {
  return currentSkinCache;
}

export function setCurrentSkin(skinId) {
  currentSkinCache = skinId;
  try {
    localStorage.setItem('szkeletal_current_skin', skinId);
    console.log(`[SkinManager] Ustawiono skin: ${skinId}`);
  } catch (e) {
    console.error("[SkinManager] Błąd zapisu wybranego skina:", e);
  }
}