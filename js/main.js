// ==============
// MAIN.JS (v0.86 - Throttling Enemy Counter)
// Lokalizacja: /js/main.js
// ==============

// === Importowanie modułów ===
import { ObjectPool } from './core/objectPool.js';
import { Player } from './entities/player.js';
import { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } from './config/gameData.js';
import { draw } from './core/draw.js';

import { updateUI, resumeGame, showMenu, startRun, resetAll, gameOver, pauseGame, updateEnemyCounter } from './ui/ui.js';
import { initializeMainEvents } from './core/eventManager.js';

// NOWY IMPORT v0.78
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

// === NOWA KLASA KAMERY ===
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

// === Referencje do DOM (wstępna deklaracja) ===
let canvas = null;
let ctx = null;

// === Ustawienia i stan gry (Obiekty proste) ===
let savedGameState = null; // Przechowywany przez uiData

let fps = 0;
let lastFrameTime = 0;
let frameCount = 0;

// NOWE ZMIENNE V0.86: Throttling Licznika Wrogów
let lastEnemyCounterUpdate = 0;
const ENEMY_COUNTER_UPDATE_INTERVAL = 200; // Co 200ms

const game={
  score:0, level:1, health: PLAYER_CONFIG.INITIAL_HEALTH, maxHealth: PLAYER_CONFIG.INITIAL_HEALTH, 
  time:0, running:false, paused:true, inMenu:true,
  xp:0, xpNeeded: GAME_CONFIG.INITIAL_XP_NEEDED, 
  pickupRange: PLAYER_CONFIG.INITIAL_PICKUP_RANGE, 
  magnet:false, magnetT:0, shakeT:0, shakeMag:0, hyper:false,
  shield:false, shieldT:0, speedT:0, freezeT:0, screenShakeDisabled:false, manualPause:false,
  collisionSlowdown: 0,
  triggerChestOpen: false,
  // NOWE WŁAŚCIWOŚCI V0.86
  newEnemyWarningT: 0, // Czas trwania ostrzeżenia o nowym wrogu
  newEnemyWarningType: null, // Typ nowego wroga
  seenEnemyTypes: ['standard'], // Wrogowie, których gracz już spotkał (startujemy ze Standard)
  dynamicEnemyLimit: GAME_CONFIG.INITIAL_MAX_ENEMIES // Aktualny limit wrogów na planszy
};

const settings={ 
    spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
    maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
    lastFire:0, 
    lastElite:0,
    lastHazardSpawn: 0, 
    lastSiegeEvent: 0,
    // NOWA WŁAŚCIWOŚĆ v0.77: Przechowuje czas do następnego oblężenia
    currentSiegeInterval: SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME
};

let perkLevels={};

// === Obiekty dynamiczne (zostaną zainicjowane w initializeCanvas) ===
let player = null;
let camera = null;
let playerBulletPool = null;
let enemyBulletPool = null;
let gemsPool = null;
let particlePool = null;
let hitTextPool = null;

// Tablice stanu gry
const enemies=[]; 
const chests=[];
const pickups=[];
const hazards=[]; 
const stars=[];
const bombIndicators = [];

// Zmienne referencyjne dla puli obiektów
let bullets = [];
let eBullets = [];
let gems = [];
let particles = [];
let hitTexts = [];

// Definicja gameStateRef (tylko zmienne globalne)
let gameStateRef = {};

// === FUNKCJA INICJALIZUJĄCA CANVAS I OBIEKTY GRY ===
function initializeCanvas() {
    if (canvas !== null) return; 

    // 1. Inicjalizacja DOM
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    const worldSize = WORLD_CONFIG.SIZE;
    const worldWidth = canvas.width * worldSize;
    const worldHeight = canvas.height * worldSize;

    // 2. Inicjalizacja obiektów/pól
    player = new Player(worldWidth / 2, worldHeight / 2); 
    camera = new Camera(worldWidth, worldHeight, canvas.width, canvas.height);
    playerBulletPool = new ObjectPool(PlayerBullet, 500);
    enemyBulletPool = new ObjectPool(EnemyBullet, 500);
    // ZBALANSOWANIE v0.76: Zwiększenie puli gemów (1000 -> 3000)
    gemsPool = new ObjectPool(Gem, 3000); 
    particlePool = new ObjectPool(Particle, 2000); 
    hitTextPool = new ObjectPool(HitText, 100); 

    // 3. Wypełnienie referencji do aktywnych obiektów
    bullets = playerBulletPool.activeItems; 
    eBullets = enemyBulletPool.activeItems;
    gems = gemsPool.activeItems;
    particles = particlePool.activeItems;
    hitTexts = hitTextPool.activeItems;

    // 4. Definicja gameStateRef
    gameStateRef = {
      game, player, settings, perkLevels, enemies, chests, pickups, 
      canvas, ctx, 
      bombIndicators, stars, hazards, 
      bulletsPool: playerBulletPool, eBulletsPool: enemyBulletPool, gemsPool: gemsPool, 
      particlePool: particlePool, hitTextPool: hitTextPool, camera: camera,
      bullets: bullets, eBullets: eBullets, gems: gems, particles: particles, hitTexts: hitTexts,
      trails: [], confettis: [], enemyIdCounter: 0,
      siegeSpawnQueue: [] // NOWE v0.75: Kolejka pozycji spawnów Oblężnika
    };

    console.log('[DEBUG-v0.76] js/main.js: Pula gemów zwiększona do 3000.');
}


// === Dane dla UI ===
const uiData = {
    VERSION, 
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


// === Funkcje pomocnicze do zarządzania stanem (Wrappery) ===

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
    
    uiData.drawCallback = () => draw(
        ctx, 
        gameStateRef, 
        uiData,       
        fps           
    );
}

// POPRAWKA v0.71 (OKOŁO L205): Naprawiono błąd 'worldSize is not defined'
function initStars(){
  stars.length = 0;
  // Użyj 'WORLD_CONFIG.SIZE' zamiast 'worldSize', który jest poza zakresem
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

// === GŁÓWNA PĘTLA AKTUALIZACJI ===
function update(dt){
  updateGame(
      gameStateRef, 
      dt, 
      window.wrappedLevelUp, 
      window.wrappedOpenChest, 
      camera
  );

  // NOWA LINIA v0.78: Aktualizacja wskaźników (z throttlingiem)
  updateIndicators(gameStateRef, dt);

  if (canvas && camera) {
      const roundedX = Math.round(camera.offsetX);
      const roundedY = Math.round(camera.offsetY);
      canvas.style.backgroundPosition = `${-roundedX}px ${-roundedY}px`;
  }
}

// === GŁÓWNA PĘTLA GRY (LOOP) ===
function loop(currentTime){
  if (canvas === null) {
      console.warn("Canvas nie został zainicjalizowany. Czekam...");
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
        
        // NOWA LOGIKA V0.86: Throttling Licznika Wrogów
        if (currentTime - lastEnemyCounterUpdate > ENEMY_COUNTER_UPDATE_INTERVAL) {
            updateEnemyCounter(game, enemies);
            lastEnemyCounterUpdate = currentTime;
        }

        if (game.paused || !game.running) {
            // Logika pauzy/menu
            uiData.drawCallback();
            
            // POPRAWKA v0.77L: Odkomentowano wywołanie updateUI dla stanu pauzy/menu/gameover
            if (game.inMenu || game.manualPause || (document.getElementById('gameOverOverlay') && document.getElementById('gameOverOverlay').style.display === 'flex')) {
                updateUI(game, player, settings, null); 
            }
            
        } else {
            // Logika działającej gry
            game.time = (currentTime - uiData.startTime) / 1000;
            
            update(dt); 
            
            uiData.drawCallback();
            
            // POPRAWKA v0.77i: Usunięto throttle (ogranicznik)
            updateUI(game, player, settings, null);
            
            if(game.health<=0 && !devSettings.godMode){
                window.wrappedGameOver(); 
            }
        }
        
    } catch (e) {
        // POPRAWKA v0.76c: Zmieniono logowanie, aby uniknąć błędu TypeError w konsoli
        console.error("BŁĄD KRYTYCZNY W PĘTLI GRY (loop). Wiadomość: ", e.message);
        console.error("Stos błędu: ", e.stack);
        
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


// === PRZYPISANIE EVENTÓW ===

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

// POPRAWKA v0.77r: Uproszczono funkcję, usuwając całą logikę fetch()
function initMenuAndEvents() {
    console.log('[DEBUG-v0.77r] js/main.js: Uruchamiam synchroniczną inicjalizację menu i eventów.');
    try {
        // 1. Aktywuj zakładki (HTML już tam jest)
        initTabSwitching();
        
        // 2. Podepnij listenery (elementy DOM już tam są)
        const { initEvents, wrappedLoadConfig, wrappedStartRun } = initializeMainEvents(gameStateRef, uiData);
        initEvents();
        
        // 3. Zwróć funkcje dla dev.js
        return { wrappedLoadConfig, wrappedStartRun };
        
    } catch (err) {
        // Ten błąd nie powinien się już zdarzyć, ale zostawiam zabezpieczenie
        console.error("BŁĄD KRYTYCZNY: Nie można było zainicjować eventów (mimo osadzonego HTML).", err);
        alert("BŁĄD KRYTYCZNY: Wystąpił błąd podczas inicjalizacji. Odśwież stronę (F5).");
        
        const gameTab = document.getElementById('tab-game');
        if (gameTab) {
            gameTab.innerHTML = `<h4 style="color: #f44336;">Błąd Inicjalizacji</h4><p>Proszę, odśwież stronę (F5).</p>`;
        }
        return { wrappedLoadConfig: () => {}, wrappedStartRun: () => {} };
    }
}

// === START GRY ===

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

console.log('[Main] Ładowanie zasobów...');
Promise.all([
    loadAssets(),
    loadAudio()
]).then((results) => { // POPRAWKA v0.77r: Usunięto async
    console.log('[Main] Wszystkie zasoby (grafika i audio) załadowane. Inicjalizacja Canvas i Obiektów Gry.');
    
    uiData.gameData = { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG };
    
    initializeCanvas();
    updateUiDataReferences(); 
    initStars(); 
    
    // POPRAWKA v0.77r: Wywołanie synchroniczne
    const { wrappedLoadConfig, wrappedStartRun } = initMenuAndEvents();
    
    // Przekaż obie funkcje do devTools
    initDevTools(gameStateRef, wrappedLoadConfig, wrappedStartRun); 
    
    initInput(handleEscape, handleJoyStart, handleJoyEnd); 
    
    window.wrappedShowMenu(false);

}).catch((err) => { // POPRAWKA v0.77r: Usunięto async
    console.error("[Main] Krytyczny błąd podczas ładowania zasobów:", err);
    
    uiData.gameData = { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG };
    
    initializeCanvas();
    updateUiDataReferences();
    initStars(); 
    
    // POPRAWKA v0.77r: Wywołanie synchroniczne
    const { wrappedLoadConfig, wrappedStartRun } = initMenuAndEvents();
    
    // Przekaż obie funkcje do devTools
    initDevTools(gameStateRef, wrappedLoadConfig, wrappedStartRun); 
    initInput(handleEscape, handleJoyStart, handleJoyEnd);
    
    if (window.wrappedShowMenu) {
        window.wrappedShowMenu(false);
    } else {
        document.getElementById('menuOverlay').style.display = 'flex';
        console.error("FATAL: Nie można było nawet zainicjować Menedżera Eventów.");
    }
});