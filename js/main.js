// ==============
// MAIN.JS (v0.70 - FIX 4: Naprawa błędu resetowania czasu globalnego)
// Lokalizacja: /js/main.js
// ==============

// === Importowanie modułów ===
import { ObjectPool } from './core/objectPool.js';
import { Player } from './entities/player.js';
import { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } from './config/gameData.js';
import { draw } from './core/draw.js';

// POPRAWKA v0.70: Importy UI są teraz podzielone
import { updateUI, resumeGame, showMenu, startRun, resetAll, gameOver, pauseGame } from './ui/ui.js';
// POPRAWKA v0.70: Import Menedżera Eventów
import { initializeMainEvents } from './core/eventManager.js';

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
let animationFrameId = null;
// POPRAWKA v0.70 (FIX 4): Usunięto 'startTime' i 'lastTime'. Są teraz zarządzane w 'uiData'.
// let startTime = 0;
// let lastTime = 0;
let savedGameState = null; // Przechowywany przez uiData

let fps = 0;
let lastFrameTime = 0;
let frameCount = 0;
let lastUiUpdateTime = 0;
const UI_UPDATE_INTERVAL = 100;

const game={
  score:0, level:1, health: PLAYER_CONFIG.INITIAL_HEALTH, maxHealth: PLAYER_CONFIG.INITIAL_HEALTH, 
  time:0, running:false, paused:true, inMenu:true,
  xp:0, xpNeeded: GAME_CONFIG.INITIAL_XP_NEEDED, 
  pickupRange: PLAYER_CONFIG.INITIAL_PICKUP_RANGE, 
  magnet:false, magnetT:0, shakeT:0, shakeMag:0, hyper:false,
  shield:false, shieldT:0, speedT:0, freezeT:0, screenShakeDisabled:false, manualPause:false,
  collisionSlowdown: 0,
  triggerChestOpen: false 
};

const settings={ 
    spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
    maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
    lastFire:0, 
    lastElite:0,
    lastHazardSpawn: 0, 
    lastSiegeEvent: 0 
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
    // Usunięto referencje do menuOverlay i btnContinue (są w domElements.js)

    const worldSize = WORLD_CONFIG.SIZE;
    const worldWidth = canvas.width * worldSize;
    const worldHeight = canvas.height * worldSize;

    // 2. Inicjalizacja obiektów/pól
    player = new Player(worldWidth / 2, worldHeight / 2); 
    camera = new Camera(worldWidth, worldHeight, canvas.width, canvas.height);
    playerBulletPool = new ObjectPool(PlayerBullet, 500);
    enemyBulletPool = new ObjectPool(EnemyBullet, 500);
    gemsPool = new ObjectPool(Gem, 1000); 
    particlePool = new ObjectPool(Particle, 2000); 
    hitTextPool = new ObjectPool(HitText, 100); 

    // 3. Wypełnienie referencji do aktywnych obiektów
    bullets = playerBulletPool.activeItems; 
    eBullets = enemyBulletPool.activeItems;
    gems = gemsPool.activeItems;
    particles = particlePool.activeItems;
    hitTexts = hitTextPool.activeItems;

    // 4. Definicja gameStateRef (v0.70 - stan jest kompletny)
    gameStateRef = {
      game, player, settings, perkLevels, enemies, chests, pickups, canvas, bombIndicators, stars, hazards, 
      bulletsPool: playerBulletPool, eBulletsPool: enemyBulletPool, gemsPool: gemsPool, 
      particlePool: particlePool, hitTextPool: hitTextPool, camera: camera,
      bullets: bullets, eBullets: eBullets, gems: gems, particles: particles, hitTexts: hitTexts,
      trails: [], confettis: [], enemyIdCounter: 0 
    };

    console.log('[DEBUG] js/main.js: initializeCanvas() setup complete');
}


// === Dane dla UI ===
const uiData = {
    VERSION, 
    game, player: null, settings, weapons: null, perkLevels, 
    enemies, 
    chests, pickups, stars, bombIndicators, hazards: null, 
    bullets: null, eBullets: null, gems: null, particles: null, hitTexts: null,
    trails: [], confettis: [], canvas: null, ctx: null,
    animationFrameId, 
    // POPRAWKA v0.70 (FIX 4): startTime i lastTime są teraz jedynym źródłem prawdy.
    startTime: 0, 
    lastTime: 0, 
    savedGameState,
    loopCallback: null, 
    drawCallback: null, 
    initStarsCallback: initStars,
    currentChestReward: null,
    
    // POPRAWKA v0.70: Flagi UI przeniesione tutaj
    pickupShowLabels: true,
    pickupStyleEmoji: false,
    showFPS: true,
    fpsPosition: 'right',
    // Referencja do danych konfiguracyjnych (potrzebna Menedżerom)
    gameData: { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } // POPRAWKA v0.70: Dodano SIEGE_EVENT_CONFIG
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
    
    // Zaktualizuj referencje do loop/draw callback
    uiData.loopCallback = loop;
    uiData.drawCallback = () => draw(
        ctx, canvas, game, stars, [], player, enemies, bullets, eBullets, 
        gems, pickups, chests, particles, hitTexts, bombIndicators, hazards, [], 
        uiData.pickupStyleEmoji, uiData.pickupShowLabels, 
        fps, uiData.showFPS, uiData.fpsPosition, 
        camera
    );
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

// POPRAWKA v0.70: Wszystkie funkcje 'wrapped...' zostały przeniesione do eventManager.js

// === GŁÓWNA PĘTLA AKTUALIZACJI ===
function update(dt){
  // POPRAWKA v0.70: Wywołania callbacków są teraz obsługiwane przez Menedżera Eventów
  updateGame(
      gameStateRef, 
      dt, 
      window.wrappedLevelUp, // Użyj globalnych wrapperów ustawionych przez eventManager
      window.wrappedOpenChest, 
      camera
  );

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
      animationFrameId = requestAnimationFrame(loop);
      return;
    }
    
    try {
        // POPRAWKA v0.70 (FIX 4): Użyj 'uiData.startTime' i 'uiData.lastTime'
        if (uiData.startTime === 0) {
            uiData.startTime = currentTime;
            uiData.lastTime = currentTime;
            lastFrameTime = currentTime;
        }
        
        // POPRAWKA v0.70: Aktualizacja globalnej referencji (nadal potrzebna)
        uiData.animationFrameId = animationFrameId;
        
        const deltaMs = currentTime - uiData.lastTime;
        uiData.lastTime = currentTime;
        const dt = Math.min(deltaMs / 1000, 0.1); 
        
        // Licznik FPS
        frameCount++;
        if (currentTime - lastFrameTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = currentTime;
        }
        
        updateVisualEffects(dt, [], [], bombIndicators); 
        updateParticles(dt, particles); 
        
        if(game.paused || !game.running){
            uiData.drawCallback();
            
            if (currentTime - lastUiUpdateTime > UI_UPDATE_INTERVAL) {
                lastUiUpdateTime = currentTime;
                if (game.inMenu || game.manualPause || (document.getElementById('gameOverOverlay') && document.getElementById('gameOverOverlay').style.display === 'flex')) {
                    updateUI(game, player, settings, null); 
                }
            }
            animationFrameId = requestAnimationFrame(loop);
            return;
        }
        
        // POPRAWKA v0.70 (FIX 4): Oblicz 'game.time' na podstawie 'uiData.startTime'
        game.time = (currentTime - uiData.startTime) / 1000;
        
        update(dt); 
        
        uiData.drawCallback();
        
        if (currentTime - lastUiUpdateTime > UI_UPDATE_INTERVAL) {
            lastUiUpdateTime = currentTime;
            updateUI(game, player, settings, null);
        } 
        
        if(game.health<=0 && !devSettings.godMode){
            window.wrappedGameOver(); // Użyj globalnego wrappera
        }
        
    } catch (e) {
        console.error("BŁĄD KRYTYCZNY W PĘTLI GRY (loop):", e);
        game.running = false;
        game.paused = true;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    if (game.running || game.paused) {
        animationFrameId = requestAnimationFrame(loop);
    }
}


// === PRZYPISANIE EVENTÓW ===

// POPRAWKA v0.69: Nowa funkcja do przełączania zakładek (wywoływana PO załadowaniu HTML)
function initTabSwitching() {
    document.querySelectorAll('.tabs .tab').forEach((tab, index) => {
        tab.addEventListener('click', (event) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Wybieramy odpowiednią zakładkę (Gra, Konfiguracja, Dev, Przewodnik)
            const tabNames = ['game', 'config', 'dev', 'guide'];
            document.getElementById('tab-' + tabNames[index]).classList.add('active');
        });
    });
}

// POPRAWKA v0.69: Nowa funkcja do ładowania zawartości zakładek
async function loadMenuTabs() {
    console.log('[Refactor v0.69] Ładowanie zawartości zakładek HTML...');
    try {
        const [configHTML, devHTML, guideHTML] = await Promise.all([
            fetch('menu_config.html').then(res => res.text()),
            fetch('menu_dev.html').then(res => res.text()),
            fetch('menu_guide.html').then(res => res.text())
        ]);
        
        // NAPRAWIONO BŁĄD (v0.70): Poprawne przypisanie wszystkich zakładek
        document.getElementById('tab-config').innerHTML = configHTML;
        document.getElementById('tab-dev').innerHTML = devHTML; 
        document.getElementById('tab-guide').innerHTML = guideHTML; 
        
        console.log('[Refactor v0.69] Zakładki załadowane. Inicjalizacja przełączania.');
        initTabSwitching();
        
        // POPRAWKA v0.70 (Refactor): Inicjalizuj Menedżera Eventów PO załadowaniu HTML
        // To automatycznie wywoła initEvents() i ustawi globalne wrappery
        const { initEvents, wrappedLoadConfigAndStart } = initializeMainEvents(gameStateRef, uiData);
        initEvents();
        
        // Zwróć wrappedLoadConfigAndStart, aby DevTools mogły z niego korzystać
        return wrappedLoadConfigAndStart;
        
    } catch (err) {
        console.error("BŁĄD KRYTYCZNY: Nie można załadować zawartości menu (menu_*.html).", err);
        alert("BŁĄD: Nie można załadować plików menu. Sprawdź, czy pliki menu_config.html, menu_dev.html i menu_guide.html znajdują się w tym samym folderze co index.html.");
        // POPRAWKA v0.70 (FIX): Nawet jeśli ładowanie HTML zawiedzie,
        // musimy zainicjować Menedżera Eventów, aby .catch() mógł wywołać wrappedShowMenu
        const { initEvents, wrappedLoadConfigAndStart } = initializeMainEvents(gameStateRef, uiData);
        initEvents();
        return wrappedLoadConfigAndStart;
    }
}

// POPRAWKA v0.70: initEvents() zostało przeniesione do eventManager.js i jest wywoływane przez loadMenuTabs()


// === START GRY ===

// Inicjalizacja modułu Input (v0.44)
const handleEscape = () => {
  if(!game.inMenu && game.running){
    if(game.manualPause){
      // POPRAWKA v0.70: Użyj globalnego wrappera
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

// === START GRY (v0.58) ===
console.log('[Main] Ładowanie zasobów...');
Promise.all([
    loadAssets(),
    loadAudio()
]).then(async (results) => { // POPRAWKA v0.69: Dodano 'async'
    console.log('[Main] Wszystkie zasoby (grafika i audio) załadowane. Inicjalizacja Canvas i Obiektów Gry.');
    
    // POPRAWKA v0.70: Przekaż dane konfiguracyjne do uiData
    uiData.gameData = { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG };
    
    // NOWA KRYTYCZNA KOLEJNOŚĆ INICJALIZACJI
    initializeCanvas();
    updateUiDataReferences(); // Wypełnij referencje do uiData (player, camera, pools)
    initStars(); // Inicjalizacja gwiazd wymaga wymiarów świata (z initializeCanvas)
    
    // POPRAWKA v0.69: Ładowanie zawartości zakładek HTML PRZED resztą eventów
    const wrappedLoadConfigAndStart = await loadMenuTabs();
    
    // POPRAWKA V0.67: PRZEKAZANIE NOWEJ FUNKCJI ŁADUJĄCEJ KONFIGURACJĘ
    // POPRAWKA v0.70: Przekazanie gameStateRef (zawiera teraz pule)
    initDevTools(gameStateRef, wrappedLoadConfigAndStart); 
    
    // POPRAWKA v0.69: initEvents() jest teraz wywoływane WEWNĄTRZ loadMenuTabs()
    
    initInput(handleEscape, handleJoyStart, handleJoyEnd); // Input wymaga initEvents
    
    // POPRAWKA v0.70: Użyj globalnego wrappera
    window.wrappedShowMenu(false);

}).catch(async (err) => { // POPRAWKA v0.69: Dodano 'async'
    console.error("[Main] Krytyczny błąd podczas ładowania zasobów:", err);
    
    // POPRAWKA v0.70 (FIX): Musimy zainicjować wrappery nawet w przypadku błędu,
    // aby .catch() mógł wywołać window.wrappedShowMenu()
    
    // Ustaw dane konfiguracyjne (fallback)
    uiData.gameData = { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG };
    
    initializeCanvas();
    updateUiDataReferences();
    initStars();
    
    // Załaduj zakładki, co zainicjuje także eventManager i ustawi globalne wrappery
    const wrappedLoadConfigAndStart = await loadMenuTabs(); 
    
    initDevTools(gameStateRef, wrappedLoadConfigAndStart); 
    initInput(handleEscape, handleJoyStart, handleJoyEnd);
    
    // Teraz ta funkcja powinna istnieć
    if (window.wrappedShowMenu) {
        window.wrappedShowMenu(false);
    } else {
        // Ostateczny fallback, jeśli eventManager też zawiedzie
        document.getElementById('menuOverlay').style.display = 'flex';
        console.error("FATAL: Nie można było nawet zainicjować Menedżera Eventów.");
    }
});