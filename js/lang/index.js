// ==============
// INDEX.JS (v0.90 - Manifest Języków)
// Lokalizacja: /js/lang/index.js
// ==============

// Ten plik importuje wszystkie dostępne języki i eksportuje je
// jako jedną mapę. Silnik i18n (i18n.js) będzie używał tego
// pliku do dynamicznego budowania menu wyboru języka.

import { LANG_PL } from './polish.js';
import { LANG_EN } from './english.js';

/**
 * Mapa wszystkich dostępnych języków.
 * Klucz (np. 'Polski') to nazwa, która pojawi się w menu wyboru.
 * Wartość (np. LANG_PL) to obiekt z tłumaczeniami.
 */
export const LANG_MAP = {
    'Polski': LANG_PL,
    'English': LANG_EN
};