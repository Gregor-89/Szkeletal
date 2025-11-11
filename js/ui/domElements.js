// ==============
// DOMELEMENTS.JS (v0.86 - Export Licznika Wrogów)
// Lokalizacja: /js/ui/domElements.js
// ==============

// Ten plik eksportuje stałe referencje do elementów DOM,
// aby odchudzić główny plik ui.js i umożliwić
// innym modułom (np. scoreManager) dostęp do tych samych elementów.

export const xpBarFill = document.getElementById('xpBarFill');
export const playerHPBarInner = document.getElementById('playerHPBarInner');
export const playerHPBarTxt = document.getElementById('playerHPBarTxt');
// POPRAWKA v0.77j: Usunięto eksport 'playerHPBarOuter', ponieważ ładował się jako null
// export const playerHPBarOuter = document.getElementById('playerHPBarOuter');
export const xpBarTxt = document.getElementById('xpBarTxt');
export const bonusPanel = document.getElementById('bonusPanel');
export const statsDisplay = document.getElementById('statsDisplay');
export const statsDisplayPause = document.getElementById('statsDisplayPause');
export const menuOverlay = document.getElementById('menuOverlay');
export const btnContinue = document.getElementById('btnContinue');
export const levelUpOverlay = document.getElementById('levelUpOverlay');
export const perksDiv = document.getElementById('perks');
export const btnContinueMaxLevel = document.getElementById('btnContinueMaxLevel');
export const pauseOverlay = document.getElementById('pauseOverlay');
export const resumeOverlay = document.getElementById('resumeOverlay');
export const resumeText = document.getElementById('resumeText');
export const chestOverlay = document.getElementById('chestOverlay');
export const chestButton = document.getElementById('chestButton');
export const chestRewardDisplay = document.getElementById('chestRewardDisplay');
export const gameOverOverlay = document.getElementById('gameOverOverlay');
export const finalScore = document.getElementById('finalScore');
export const finalLevel = document.getElementById('finalLevel');
export const finalTime = document.getElementById('finalTime');
export const titleDiv = document.getElementById('title');
export const docTitle = document.querySelector('title');

// NOWE REFERENCJE V0.86
export const enemyCountSpan = document.getElementById('enemyCount');
export const enemyLimitSpan = document.getElementById('enemyLimit');
export const enemyProgressDiv = document.getElementById('enemyProgress');


export const confirmOverlay = document.getElementById('confirmOverlay');
export const confirmText = document.getElementById('confirmText');
export const btnConfirmYes = document.getElementById('btnConfirmYes');
export const btnConfirmNo = document.getElementById('btnConfirmNo');

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.77j] js/ui/domElements.js: Usunięto eksport playerHPBarOuter.');