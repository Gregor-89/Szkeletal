// ==============
// I18N.JS (v0.90 - Silnik Lokalizacji)
// Lokalizacja: /js/services/i18n.js
// ==============

import { LANG_MAP } from '../lang/index.js';

// --- Stałe ---
const DEFAULT_LANG = 'Polski';
const STORAGE_KEY = 'szkeletalLang';

// --- Stan Wewnętrzny ---
let currentLangName = DEFAULT_LANG;
let currentLangData = LANG_MAP[DEFAULT_LANG];
let fallbackLangData = LANG_MAP[DEFAULT_LANG]; // Polski jest wzorcem

/**
 * Inicjalizuje serwis i18n.
 * Wczytuje preferencje użytkownika z localStorage.
 */
function initLanguage() {
  let savedLang = DEFAULT_LANG;
  try {
    savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  } catch (e) {
    console.error("[i18n] Nie można uzyskać dostępu do localStorage:", e);
  }
  
  // Upewnij się, że zapisany język nadal istnieje w mapie
  if (!LANG_MAP[savedLang]) {
    savedLang = DEFAULT_LANG;
  }
  
  setLanguage(savedLang, true); // Ustaw język bez ponownego zapisu
  console.log(`[i18n] Język zainicjalizowany na: ${currentLangName}`);
}

/**
 * Zmienia aktywny język gry.
 * @param {string} langName - Nazwa języka (klucz z LANG_MAP, np. "English")
 * @param {boolean} [silent=false] - Jeśli true, nie zapisuje do localStorage (używane przy inicjalizacji)
 */
export function setLanguage(langName, silent = false) {
  if (!LANG_MAP[langName]) {
    console.warn(`[i18n] Próba ustawienia nieistniejącego języka: ${langName}. Powrót do domyślnego.`);
    langName = DEFAULT_LANG;
  }
  
  currentLangName = langName;
  currentLangData = LANG_MAP[langName];
  
  if (!silent) {
    try {
      localStorage.setItem(STORAGE_KEY, currentLangName);
      console.log(`[i18n] Zapisano język w localStorage: ${currentLangName}`);
    } catch (e) {
      console.error("[i18n] Nie można zapisać języka w localStorage:", e);
    }
  }
}

/**
 * Pobiera przetłumaczony ciąg tekstowy na podstawie klucza.
 * Implementuje logikę fallbacku (powrotu do polskiego), jeśli klucz nie istnieje.
 * @param {string} key - Klucz tłumaczenia (np. "perk_whip_name")
 * @returns {string} Przetłumaczony tekst.
 */
export function getLang(key) {
  // 1. Spróbuj pobrać z aktualnie wybranego języka
  let translation = currentLangData[key];
  
  // 2. Jeśli brakuje, użyj języka polskiego (fallback)
  if (translation === undefined) {
    translation = fallbackLangData[key];
    
    // 3. Jeśli nadal brakuje, zwróć błąd widoczny dla gracza
    if (translation === undefined) {
      console.warn(`[i18n] Brakujący klucz tłumaczenia w '${currentLangName}' ORAZ w '${DEFAULT_LANG}': ${key}`);
      return `[BRAK TŁUMACZENIA: ${key}]`;
    }
  }
  
  return translation;
}

/**
 * Zwraca listę nazw dostępnych języków.
 * @returns {string[]} Np. ['Polski', 'English']
 */
export function getAvailableLanguages() {
  return Object.keys(LANG_MAP);
}

/**
 * Zwraca nazwę aktualnie aktywnego języka.
 * @returns {string} Np. "Polski"
 */
export function getCurrentLanguage() {
  return currentLangName;
}

// --- Inicjalizacja przy ładowaniu modułu ---
initLanguage();