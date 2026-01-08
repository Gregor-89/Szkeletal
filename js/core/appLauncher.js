// ==============
// APPLAUNCHER.JS (v1.0.1 - Launch Sequence BugFix)
// Lokalizacja: /js/core/appLauncher.js
// ==============

import { initAudio, loadAudio, playSound, AUDIO_ASSET_LIST } from '../services/audio.js';
import { loadAssets, assetDefinitions } from '../services/assets.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { initializeIntro } from '../managers/introManager.js';

// Konfiguracja Splashy
const SPLASH_SEQUENCE = ['img/splash_dev.png', 'img/splash_ratings.png', 'img/splash_logo.jpg'];
const SPLASH_DURATIONS = [4000, 15000, 6000];

let assetsLoaded = false;
let splashSequenceActive = true;
let currentSplashIndex = 0;
let splashTimer = null;
let splashAdvanceLocked = true;

const splashOverlay = document.getElementById('splashOverlay');
const splashImageEl = document.getElementById('splashImage');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingBarFill = document.getElementById('loadingBarFill');
const loadingText = document.getElementById('loadingText');

/**
 * Rozpoczyna proces ładowania i wyświetlania splashy.
 */
export function launchApp(gameStateRef, uiData, callbacks) {
  initAudio();
  LeaderboardService.trackUniquePlayer();
  
  const totalAssets = Object.keys(assetDefinitions).length + AUDIO_ASSET_LIST.length;
  let loadedCount = 0;
  
  const updateProgress = () => {
    loadedCount++;
    const pct = Math.min(100, Math.floor((loadedCount / totalAssets) * 100));
    if (loadingBarFill) loadingBarFill.style.width = `${pct}%`;
    if (loadingText) loadingText.textContent = `WCZYTYWANIE ZASOBÓW... (${loadedCount}/${totalAssets})`;
  };
  
  Promise.all([loadAssets(updateProgress), loadAudio(updateProgress)]).then(() => {
    setTimeout(() => {
      if (callbacks.updateGameTitle) callbacks.updateGameTitle();
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (splashOverlay) splashOverlay.style.display = 'flex';
      
      assetsLoaded = true;
      if (callbacks.initializeCanvas) callbacks.initializeCanvas();
      if (callbacks.initStars) callbacks.initStars();
      
      // FIX: Wywołanie rejestracji zdarzeń i wejścia po załadowaniu zasobów
      if (callbacks.onAssetsReady) callbacks.onAssetsReady();
      
      showSplash(currentSplashIndex);
    }, 500);
  }).catch((err) => {
    console.error("Błąd ładowania assetów:", err);
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    assetsLoaded = true;
    if (callbacks.initializeCanvas) callbacks.initializeCanvas();
    if (callbacks.onAssetsReady) callbacks.onAssetsReady();
    showSplash(currentSplashIndex);
  });
}

function showSplash(index) {
  if (!assetsLoaded || !splashSequenceActive || !splashImageEl) return;
  splashAdvanceLocked = true;
  splashImageEl.classList.remove('fade-in');
  void splashImageEl.offsetWidth;
  splashImageEl.src = SPLASH_SEQUENCE[index];
  splashImageEl.classList.add('fade-in');
  
  const duration = SPLASH_DURATIONS[index] || 4000;
  splashTimer = setTimeout(advanceSplash, duration);
  setTimeout(() => { splashAdvanceLocked = false; }, 500);
}

export function advanceSplash(e) {
  if (e) {
    if (e.type === 'keydown' && e.repeat) return;
    if ((e.type === 'touchstart' || e.type === 'mousedown') && e.cancelable) e.preventDefault();
  }
  if (!splashSequenceActive || !assetsLoaded || splashAdvanceLocked) return;
  splashAdvanceLocked = true;
  clearTimeout(splashTimer);
  currentSplashIndex++;
  
  if (currentSplashIndex >= SPLASH_SEQUENCE.length) finishSplashSequence();
  else showSplash(currentSplashIndex);
}

function finishSplashSequence() {
  if (!splashSequenceActive) return;
  splashSequenceActive = false;
  clearTimeout(splashTimer);
  
  window.removeEventListener('keydown', advanceSplash);
  window.removeEventListener('mousedown', advanceSplash);
  window.removeEventListener('touchstart', advanceSplash);
  
  if (splashOverlay) splashOverlay.classList.add('fade-out');
  initAudio();
  
  setTimeout(() => {
    if (splashOverlay) splashOverlay.style.display = 'none';
    const game = window.gameStateRef ? window.gameStateRef.game : null;
    if (game && !game.running) {
      initializeIntro(window.gameStateRef);
      setTimeout(() => {
        const introOverlay = document.getElementById('introOverlay');
        if (!game.running && (!introOverlay || introOverlay.style.display !== 'flex')) playSound('MusicMenu');
      }, 100);
    }
  }, 1000);
}