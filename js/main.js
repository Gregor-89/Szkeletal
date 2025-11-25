// ==============
// MAIN.JS (v0.94 Final - COMPLETE)
// Lokalizacja: /js/main.js
// ==============

import './services/i18n.js'; 

import { ObjectPool } from './core/objectPool.js';
import { Player } from './entities/player.js';
import { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } from './config/gameData.js';
import { draw } from './core/draw.js';

import { updateUI, resumeGame, showMenu, startRun, resetAll, gameOver, pauseGame, updateEnemyCounter } from './ui/ui.js';
import { initializeMainEvents } from './core/eventManager.js';
import { initializeIntro } from './managers/introManager.js'; 
import { updateIndicators } from './managers/indicatorManager.js'; 
import { updateVisualEffects, updateParticles } from './managers/effects.js';
import { initInput } from './ui/input.js';
import { devSettings, initDevTools } from './services/dev.js';
import { updateGame } from './core/gameLogic.js';
import { loadAudio } from './services/audio.js';
import { PlayerBullet, EnemyBullet } from './entities/bullet.js';
import { Gem } from './entities/gem.js';
import { Particle } from './entities/particle.js';
import { HitText } from './entities/hitText.js';
import { Hazard } from './entities/hazard.js'; 
import { loadAssets } from './services/assets.js';
import { VERSION } from './config/version.js';
import { displayScores } from './services/scoreManager.js';

class Camera {
    constructor(worldWidth, worldHeight, viewWidth, viewHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}

let canvas = null;
let ctx = null;
const splashOverlay = document.getElementById('splashOverlay');

let savedGameState = null;
let fps = 0;
let lastFrameTime = 0;
let frameCount = 0;
let lastEnemyCounterUpdate = 0;
const ENEMY_COUNTER_UPDATE_INTERVAL = 200;

const game={
  score:0, level:1, health: PLAYER_CONFIG.INITIAL_HEALTH, maxHealth: PLAYER_CONFIG.INITIAL_HEALTH, 
  time:0, running:false, paused:true, inMenu:true,
  xp:0, xpNeeded: GAME_CONFIG.INITIAL_XP_NEEDED, 
  pickupRange: PLAYER_CONFIG.INITIAL_PICKUP_RANGE, 
  magnet:false, magnetT:0, shakeT:0, shakeMag:0, hyper:false,
  shield:false, shieldT:0, speedT:0, freezeT:0, screenShakeDisabled:false, manualPause:false,
  collisionSlowdown: 0,
  triggerChestOpen: false,
  playerHitFlashT: 0, 
  newEnemyWarningT: 0, 
  newEnemyWarningType: null, 
  seenEnemyTypes: ['standard'], 
  dynamicEnemyLimit: GAME_CONFIG.INITIAL_MAX_ENEMIES, 
  introSeen: false 
};

const settings={ 
    spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
    maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
    lastFire:0, 
    lastElite:0,
    lastHazardSpawn: 0, 
    lastSiegeEvent: 0,
    currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME
};

let perkLevels={};

let player = null;
let camera = null;
let playerBulletPool = null;
let enemyBulletPool = null;
let gemsPool = null;
let particlePool = null;
let hitTextPool = null;

const enemies=[]; 
const chests=[];
const pickups=[];
const hazards=[]; 
const stars=[];
const bombIndicators = [];

let bullets = [];
let eBullets = [];
let gems = [];
let particles = [];
let hitTexts = [];

let gameStateRef = {};

function initializeCanvas() {
    if (canvas !== null) return; 

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    const worldSize = WORLD_CONFIG.SIZE;
    const worldWidth = canvas.width * worldSize;
    const worldHeight = canvas.height * worldSize;

    player = new Player(worldWidth / 2, worldHeight / 2); 
    camera = new Camera(worldWidth, worldHeight, canvas.width, canvas.height);
    
    playerBulletPool = new ObjectPool(PlayerBullet, 500);
    enemyBulletPool = new ObjectPool(EnemyBullet, 500);
    gemsPool = new ObjectPool(Gem, 3000); 
    particlePool = new ObjectPool(Particle, 2000); 
    hitTextPool = new ObjectPool(HitText, 100); 

    bullets = playerBulletPool.activeItems; 
    eBullets = enemyBulletPool.activeItems;
    gems = gemsPool.activeItems;
    particles = particlePool.activeItems;
    hitTexts = hitTextPool.activeItems;

    gameStateRef = {
      game, player, settings, perkLevels, enemies, chests, pickups, 
      canvas, ctx, 
      bombIndicators, stars, hazards, 
      bulletsPool: playerBulletPool, eBulletsPool: enemyBulletPool, gemsPool: gemsPool, 
      particlePool: particlePool, hitTextPool: hitTextPool, camera: camera,
      bullets: bullets, eBullets: eBullets, gems: gems, particles: particles, hitTexts: hitTexts,
      trails: [], confettis: [], enemyIdCounter: 0,
      siegeSpawnQueue: []
    };

    // FIX: Pełny tytuł gry
    document.title = `Szkeletal: Ziemniaczkowy Głód Estrogenowego Drakula v${VERSION}`;
    console.log(`[DEBUG-v${VERSION}] js/main.js: Inicjalizacja zakończona.`);
}

const uiData = {
    VERSION: VERSION, 
    game, player: null, settings, weapons: null, perkLevels, 
    enemies, 
    chests, pickups, stars, bombIndicators, hazards: null, 
    bullets: null, eBullets: null, gems: null, particles: null, hitTexts: null,
    trails: [], confettis: [], canvas: null, ctx: null,
    animationFrameId: null, 
    startTime: 0, 
    lastTime: 0, 
    savedGameState,
    loopCallback: null, 
    drawCallback: null, 
    initStarsCallback: initStars,
    currentChestReward: null,
    pickupShowLabels: true,
    pickupStyleEmoji: false,
    showFPS: true,
    fpsPosition: 'right',
    gameData: { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG }
};

function updateUiDataReferences() {
    uiData.player = player;
    uiData.canvas = canvas;
    uiData.ctx = ctx;
    uiData.bullets = bullets;
    uiData.eBullets = eBullets;
    uiData.gems = gems;
    uiData.particles = particles;
    uiData.hitTexts = hitTexts;
    uiData.hazards = hazards; 
    uiData.loopCallback = loop;
    uiData.drawCallback = () => draw(ctx, gameStateRef, uiData, fps);
}

function initStars(){
  stars.length = 0;
  const worldWidth = canvas.width * WORLD_CONFIG.SIZE;
  const worldHeight = canvas.height * WORLD_CONFIG.SIZE;
  for(let i=0;i<30*WORLD_CONFIG.SIZE*WORLD_CONFIG.SIZE;i++){ 
    stars.push({
      x: Math.random()*worldWidth,
      y: Math.random()*worldHeight,
      size: 1 + Math.random()*2,
      phase: Math.random()*Math.PI*2,
      t:0
    });
  }
}

function update(dt){
  updateGame(
      gameStateRef, 
      dt, 
      window.wrappedLevelUp, 
      window.wrappedOpenChest, 
      camera
  );
  updateIndicators(gameStateRef, dt);

  if (canvas && camera) {
      const roundedX = Math.round(camera.offsetX);
      const roundedY = Math.round(camera.offsetY);
      canvas.style.backgroundPosition = `${-roundedX}px ${-roundedY}px`;
  }
}

function loop(currentTime){
  if (canvas === null) {
      uiData.animationFrameId = requestAnimationFrame(loop);
      return;
    }
    
    try {
        if (uiData.startTime === 0) {
            uiData.startTime = currentTime;
            uiData.lastTime = currentTime;
            lastFrameTime = currentTime;
        }
        
        const deltaMs = currentTime - uiData.lastTime;
        uiData.lastTime = currentTime;
        const dt = Math.min(deltaMs / 1000, 0.1); 
        
        frameCount++;
        if (currentTime - lastFrameTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = currentTime;
        }
        
        updateVisualEffects(dt, [], [], bombIndicators); 
        updateParticles(dt, particles); 
        
        if (currentTime - lastEnemyCounterUpdate > ENEMY_COUNTER_UPDATE_INTERVAL) {
            updateEnemyCounter(game, enemies);
            lastEnemyCounterUpdate = currentTime;
        }

        if (game.paused || !game.running) {
            uiData.drawCallback();
            if (game.inMenu || game.manualPause || (document.getElementById('gameOverOverlay') && document.getElementById('gameOverOverlay').style.display === 'flex')) {
                updateUI(game, player, settings, null); 
            }
        } else {
            game.time = (currentTime - uiData.startTime) / 1000;
            update(dt); 
            uiData.drawCallback();
            updateUI(game, player, settings, null);
            
            if(game.health<=0 && !devSettings.godMode){
                window.wrappedGameOver(); 
            }
        }
        
    } catch (e) {
        console.error("BŁĄD KRYTYCZNY:", e.message);
        console.error(e.stack);
        game.running = false;
        game.paused = true;
        if (uiData.animationFrameId) {
            cancelAnimationFrame(uiData.animationFrameId);
            uiData.animationFrameId = null;
        }
    }
    
    if (game.running || game.paused) {
        uiData.animationFrameId = requestAnimationFrame(loop);
    }
}

function initTabSwitching() {
    document.querySelectorAll('.tabs .tab').forEach((tab, index) => {
        tab.addEventListener('click', (event) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            const tabNames = ['game', 'config', 'dev', 'guide'];
            document.getElementById('tab-' + tabNames[index]).classList.add('active');
        });
    });
}

function initMenuAndEvents() {
    console.log('[Main] Inicjalizacja menu...');
    try {
        initTabSwitching();
        const { initEvents, wrappedLoadConfig, wrappedStartRun } = initializeMainEvents(gameStateRef, uiData);
        initEvents();
        displayScores('scoresBodyMenu');
        return { wrappedLoadConfig, wrappedStartRun };
    } catch (err) {
        console.error("Błąd inicjalizacji menu:", err);
        return { wrappedLoadConfig: () => {}, wrappedStartRun: () => {} };
    }
}

let assetsLoaded = false;
let splashSequenceActive = true;
let currentSplashIndex = 0;
let splashTimer = null;
let splashAdvanceLocked = true;
const splashImageEl = document.getElementById('splashImage');

const SPLASH_SEQUENCE = [
    'img/splash_dev.png',
    'img/splash_ratings.png',
    'img/splash_logo.jpg'
];
const SPLASH_DURATIONS = [4000, 15000, 6000];

function launchApp() {
    console.log('[Main] Ładowanie zasobów...');
    Promise.all([
        loadAssets(),
        loadAudio()
    ]).then((results) => { 
        console.log('[Main] Zasoby załadowane.');
        assetsLoaded = true;
        
        initializeCanvas();
        updateUiDataReferences(); 
        initStars(); 
        
        const { wrappedLoadConfig, wrappedStartRun } = initMenuAndEvents();
        initDevTools(gameStateRef, wrappedLoadConfig, wrappedStartRun); 
        initInput(handleEscape, handleJoyStart, handleJoyEnd); 
        
        showSplash(currentSplashIndex);

    }).catch((err) => { 
        console.error("Krytyczny błąd ładowania:", err);
        assetsLoaded = true;
        initializeCanvas();
        updateUiDataReferences();
        initStars();
        const { wrappedLoadConfig, wrappedStartRun } = initMenuAndEvents();
        initDevTools(gameStateRef, wrappedLoadConfig, wrappedStartRun); 
        initInput(handleEscape, handleJoyStart, handleJoyEnd);
        showSplash(currentSplashIndex); 
    });
}

function finishSplashSequence() {
    if (!splashSequenceActive) return; 
    splashSequenceActive = false;
    clearTimeout(splashTimer);
    window.removeEventListener('keydown', advanceSplash);
    window.removeEventListener('mousedown', advanceSplash);
    window.removeEventListener('touchstart', advanceSplash);
    splashOverlay.classList.add('fade-out');
    setTimeout(() => {
        splashOverlay.style.display = 'none';
        initializeIntro(gameStateRef); 
    }, 1000); 
}

function showSplash(index) {
    if (!assetsLoaded || !splashSequenceActive) return;
    splashAdvanceLocked = true;
    splashImageEl.classList.remove('fade-in');
    void splashImageEl.offsetWidth; 
    splashImageEl.src = SPLASH_SEQUENCE[index];
    splashImageEl.classList.add('fade-in');
    const duration = SPLASH_DURATIONS[index] || 4000;
    splashTimer = setTimeout(advanceSplash, duration); 
    setTimeout(() => { splashAdvanceLocked = false; }, 500); 
}

function advanceSplash(e) {
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

launchApp();

window.addEventListener('keydown', advanceSplash);
window.addEventListener('mousedown', advanceSplash);
window.addEventListener('touchstart', advanceSplash, { passive: false });

const handleEscape = () => {
  if(!game.inMenu && game.running){
    if(game.manualPause){
      window.wrappedResumeGame ? window.wrappedResumeGame() : resumeGame(game);
    } else {
      window.wrappedPauseGame ? window.wrappedPauseGame() : pauseGame(game, settings, player.weapons, player);
    }
  }
};
const handleJoyStart = () => {
  if(game.manualPause && !game.inMenu && game.running){ 
      window.wrappedResumeGame ? window.wrappedResumeGame() : resumeGame(game); 
  }
};
const handleJoyEnd = () => {
  if(!game.manualPause && !game.paused && !game.inMenu && game.running){
    window.wrappedPauseGame ? window.wrappedPauseGame() : pauseGame(game, settings, player.weapons, player);
  }
};