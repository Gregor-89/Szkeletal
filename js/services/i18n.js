// ==============
// I18N.JS (v0.99f - Hot-Swap Full)
// Lokalizacja: /js/services/i18n.js
// ==============

import { LANG_PL } from '../lang/polish.js';
import { LANG_EN } from '../lang/english.js';
import { LANG_RO } from '../lang/romanian.js';

// Mapa języków (klucze 'pl', 'en', 'ro')
const LANGUAGES = {
  'pl': LANG_PL,
  'en': LANG_EN,
  'ro': LANG_RO
};

const DEFAULT_LANG_CODE = 'pl';
let currentLangCode = localStorage.getItem('szkeletal_lang') || DEFAULT_LANG_CODE;

if (!LANGUAGES[currentLangCode]) {
  currentLangCode = DEFAULT_LANG_CODE;
}

export function getLang(key) {
  const langObj = LANGUAGES[currentLangCode];
  // 1. Sprawdź w wybranym języku
  let text = langObj[key];
  
  // 2. Fallback do PL (jeśli brak w wybranym, np. w RO)
  if (!text && currentLangCode !== 'pl') {
    text = LANGUAGES['pl'][key];
  }
  
  // 3. Ostateczny fallback
  return text || `[${key}]`;
}

// Zmienia język "w locie" bez przeładowania (wywoływane przez ui.js)
export function setLanguage(langCode) {
  if (LANGUAGES[langCode]) {
    currentLangCode = langCode;
    localStorage.setItem('szkeletal_lang', langCode);
    console.log(`[i18n] Język zmieniony na: ${langCode}`);
  } else {
    console.warn(`[i18n] Nieznany kod języka: ${langCode}`);
  }
}

export function getCurrentLangCode() {
  return currentLangCode;
}

// Kompatybilność wsteczna (jeśli coś starego tego używa)
export function getCurrentLanguage() {
  return currentLangCode;
}

// Zwraca listę dla generatora w Opcjach
export function getAvailableLanguages() {
  return [
    { code: 'pl', name: 'Polski' },
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' }
  ];
}