// ==============
// I18N.JS (v0.99g - Language Auto-Detect)
// Lokalizacja: /js/services/i18n.js
// ==============

import { LANG_PL } from '../lang/polish.js';
import { LANG_EN } from '../lang/english.js';
import { LANG_RO } from '../lang/romanian.js';

const LANGUAGES = {
  'pl': LANG_PL,
  'en': LANG_EN,
  'ro': LANG_RO
};

const DEFAULT_LANG_CODE = 'en'; // Domyślny dla reszty świata

// Funkcja autodetekcji języka systemowego
function detectSystemLanguage() {
  const sysLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (sysLang.startsWith('pl')) return 'pl';
  if (sysLang.startsWith('ro')) return 'ro';
  return DEFAULT_LANG_CODE;
}

// Inicjalizacja: najpierw localStorage, potem system, na końcu fallback
let currentLangCode = localStorage.getItem('szkeletal_lang');
if (!currentLangCode) {
  currentLangCode = detectSystemLanguage();
  localStorage.setItem('szkeletal_lang', currentLangCode);
  console.log(`[i18n] Autodetekcja języka: ${currentLangCode}`);
}

if (!LANGUAGES[currentLangCode]) {
  currentLangCode = 'pl'; // Ostateczny bezpiecznik projektu
}

export function getLang(key) {
  const langObj = LANGUAGES[currentLangCode];
  let text = langObj[key];
  
  if (!text && currentLangCode !== 'pl') {
    text = LANGUAGES['pl'][key];
  }
  
  return text || `[${key}]`;
}

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

export function getCurrentLanguage() {
  return currentLangCode;
}

export function getAvailableLanguages() {
  return [
    { code: 'pl', name: 'Polski' },
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' }
  ];
}