// ==============
// MAIN.JS (v0.69 - FINAL FIX 4: Poprawka ładowania zakładek Dev/Guide)
// Lokalizacja: /js/main.js
// ==============

// === Importowanie modułów ===
import {
    addHitText, spawnConfetti, limitedShake,
    findFreeSpotForPickup, applyPickupSeparation
} from './core/utils.js';
import { ObjectPool } from './core/objectPool.js';

import { Player } from './entities/player.js';

import {
    AutoGun, OrbitalWeapon, NovaWeapon
} from './config/weapon.js';
// POPRAWKA v0.66: Import nowej stałej WORLD_CONFIG
import { PLAYER_CONFIG, GAME_CONFIG, WORLD_CONFIG, SIEGE_EVENT_CONFIG } from './config/gameData.js'; // POPRAWKA v0.69: Import SIEGE_EVENT_CONFIG

import { draw } from './core/draw.js';

import {
    updateUI, updateStatsUI, showPerks, pickPerk, openChest,
    gameOver, pauseGame, resumeGame,
    showMenu, startRun, resetAll,
    levelUp,
    gameOverOverlay
} from './ui/ui.js';

// POPRAWKA V0.67: Zmieniony import, aby pobrać updateParticles
import { areaNuke, updateVisualEffects, updateParticles } from './managers/effects.js';
import { keys, jVec, initInput, setJoystickSide } from './ui/input.js';
import { perkPool } from './config/perks.js';
// POPRAWKA v0.67: Zmieniony import, aby pobrać initDevTools z nowym argumentem
import { devSettings, initDevTools } from './services/dev.js';
import { checkCollisions } from './managers/collisions.js';
// POPRAWKA v0.69: Poprawny import updateGame
import { updateGame } from './core/gameLogic.js';
import { initAudio, playSound, loadAudio } from './services/audio.js';
import { ENEMY_CLASS_MAP } from './managers/enemyManager.js';
import { PlayerBullet, EnemyBullet } from './entities/bullet.js';
import { Gem } from './entities/gem.js';
import { Particle } from './entities/particle.js';
import { HitText } from './entities/hitText.js';
import { Hazard } from './entities/hazard.js'; 
import { 
    Pickup, HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from './entities/pickup.js';
import { Chest } from './entities/chest.js';
import { loadAssets } from './services/assets.js';
import { VERSION } from './config/version.js';

// === NOWA KLASA KAMERY ===
// Klasa tymczasowa, w pełni zawarta w main.js
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

// Mapa klas pickupów potrzebna do wczytania zapisu
const PICKUP_CLASS_MAP = {
    heal: HealPickup,
    magnet: MagnetPickup,
    shield: ShieldPickup,
    speed: SpeedPickup,
    bomb: BombPickup,
    freeze: FreezePickup
};

// Mapa klas broni potrzebna do wczytania zapisu
const WEAPON_CLASS_MAP = {
    AutoGun: AutoGun,
    OrbitalWeapon: OrbitalWeapon,
    NovaWeapon: NovaWeapon
};

// === Referencje do DOM (wstępna deklaracja) ===
// POPRAWKA v0.66: Usunięto odwołania do DOM. Zostaną zdefiniowane w initializeCanvas.
let canvas = null;
let ctx = null;
let menuOverlay = null; // Dodano, aby umożliwić dostęp w initEvents
let btnContinue = null; // Dodano

// === Ustawienia i stan gry (Obiekty proste) ===
let pickupShowLabels = true;
let pickupStyleEmoji = false;
let showFPS = true;
let fpsPosition = 'right'; 

let animationFrameId = null;
let startTime = 0;
let lastTime = 0;
let savedGameState = null;

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
    lastSiegeEvent: 0 // POPRAWKA v0.69: Dodano timer Wydarzenia Oblężenia
};

let perkLevels={};

// === NOWE: Obiekty dynamiczne (zostaną zainicjowane w initializeCanvas) ===
let player = null;
let camera = null;
let playerBulletPool = null;
let enemyBulletPool = null;
let gemsPool = null;
let particlePool = null;
let hitTextPool = null;

// Tablice stanu gry (Tylko te, które nie są pulami)
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
// POPRAWKA v0.66: Przeniesienie inicjalizacji DOM i obiektów tutaj, aby zapobiec crashom.
function initializeCanvas() {
    if (canvas !== null) return; 

    // 1. Inicjalizacja DOM
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    menuOverlay = document.getElementById('menuOverlay');
    btnContinue = document.getElementById('btnContinue');
    const worldSize = WORLD_CONFIG.SIZE;
    const worldWidth = canvas.width * worldSize;
    const worldHeight = canvas.height * worldSize;

    // 2. Inicjalizacja obiektów/pól
    player = new Player(worldWidth / 2, worldHeight / 2); // Gracz na środku świata
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

    // 4. Definicja gameStateRef
    gameStateRef = {
      game, player, settings, perkLevels, enemies, chests, pickups, canvas, bombIndicators, stars, hazards, 
      bulletsPool: playerBulletPool, eBulletsPool: enemyBulletPool, gemsPool: gemsPool, 
      particlePool: particlePool, hitTextPool: hitTextPool, camera: camera,
      bullets: bullets, eBullets: eBullets, gems: gems, particles: particles, hitTexts: hitTexts,
      trails: [], confettis: [], enemyIdCounter: 0 
    };

    // LOG DIAGNOSTYCZNY
    console.log('[DEBUG] js/main.js: initializeCanvas() setup complete');
}


// === Dane dla UI ===
// POPRAWKA v0.66: Inicjalizacja uiData przeniesiona do initializeCanvas (lub funkcja musi używać gameStateRef)
// Zostawiamy deklarację poza, aby była widoczna w zamknięciach
const uiData = {
    VERSION, 
    game, player: null, settings, weapons: null, perkLevels, 
    enemies, 
    chests, pickups, stars, bombIndicators, hazards: null, 
    bullets: null, eBullets: null, gems: null, particles: null, hitTexts: null,
    trails: [], confettis: [], canvas: null, ctx: null,
    animationFrameId, startTime, lastTime, savedGameState,
    loopCallback: null, 
    drawCallback: null, 
    initStarsCallback: initStars,
    currentChestReward: null 
};


// === Funkcje pomocnicze do zarządzania stanem (Wrappery) ===

// POPRAWKA v0.66: Zaktualizuj uiData po inicjalizacji Canvas
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
    
    // Zaktualizuj referencje do loop/draw callback, które używają teraz nowych zmiennych globalnych
    uiData.loopCallback = loop;
    // POPRAWKA v0.68 FIX: Zaktualizowano sygnaturę, aby poprawnie przekazywać wszystkie argumenty
    uiData.drawCallback = () => draw(ctx, canvas, game, stars, [], player, enemies, bullets, eBullets, gems, pickups, chests, particles, hitTexts, bombIndicators, hazards, [], pickupStyleEmoji, pickupShowLabels, fps, showFPS, fpsPosition, camera);
}


// Funkcja initStars może zostać użyta przed lub po initializeCanvas
function initStars(){
  stars.length = 0;
  // POPRAWKA v0.66: Wypełnienie gwiazdami całego świata
  const worldWidth = canvas.width * WORLD_CONFIG.SIZE;
  const worldHeight = canvas.height * WORLD_CONFIG.SIZE;
  
  for(let i=0;i<30*WORLD_CONFIG.SIZE*WORLD_CONFIG.SIZE;i++){ // Więcej gwiazd na większym świecie
    stars.push({
      x: Math.random()*worldWidth,
      y: Math.random()*worldHeight,
      size: 1 + Math.random()*2,
      phase: Math.random()*Math.PI*2,
      t:0
    });
  }
}

function wrappedShowMenu(allowContinue = false) {
    uiData.animationFrameId = animationFrameId;
    uiData.savedGameState = savedGameState;
    showMenu(game, wrappedResetAll, uiData, allowContinue);
    animationFrameId = uiData.animationFrameId;
}

function wrappedResetAll() {
    uiData.animationFrameId = animationFrameId;
    uiData.lastTime = lastTime;
    uiData.startTime = startTime;
    uiData.game = game;
    uiData.settings = settings;
    uiData.perkLevels = perkLevels;
    
    // Tablice, które wciąż są tablicami
    uiData.enemies = enemies; 
    uiData.chests = chests; 
    uiData.pickups = pickups; 
    uiData.bombIndicators = bombIndicators;
    uiData.stars = stars; 
    uiData.hazards = hazards; 
    
    // POPRAWKA v0.62: Przekazanie Puli do resetAll
    uiData.bulletsPool = playerBulletPool;
    uiData.eBulletsPool = enemyBulletPool;
    uiData.gemsPool = gemsPool;
    uiData.particlePool = particlePool;
    uiData.hitTextPool = hitTextPool;
    uiData.trails = []; 
    uiData.confettis = []; 
    
    // POPRAWKA v0.66: Przekazanie obiektu camera
    resetAll(canvas, settings, perkLevels, uiData, camera);
    
    gameStateRef.enemyIdCounter = 0;
    
    animationFrameId = uiData.animationFrameId;
    lastTime = uiData.lastTime;
    startTime = uiData.startTime;
}

function wrappedPauseGame() {
    pauseGame(game, settings, null, player); 
}

function wrappedResumeGame() {
    resumeGame(game, 0.75);
}

function wrappedLevelUp() {
    levelUp(game, player, hitTextPool, particlePool, settings, null, perkLevels);
}

function wrappedOpenChest() {
    openChest(game, perkLevels, uiData);
}

function wrappedGameOver() {
    uiData.savedGameState = savedGameState;
    gameOver(game, uiData);
    savedGameState = uiData.savedGameState;
}

/**
 * POPRAWKA V0.67 (FIX CRASH): Uproszczona funkcja startu gry.
 * Ta funkcja nie czyta już ustawień z DOM i jest bezpieczna do wywołania z dev.js.
 */
function wrappedStartRun() {
    // Właściwy start
    uiData.animationFrameId = animationFrameId;
    uiData.startTime = startTime;
    uiData.lastTime = lastTime;
    startRun(game, wrappedResetAll, uiData);
    animationFrameId = uiData.animationFrameId;
    startTime = uiData.startTime;
    lastTime = uiData.lastTime;
    
    // Dodatkowy reset dla czystości logiki startu z menu
    lastFrameTime = uiData.lastTime; 
    frameCount = 0;
    fps = 0;
}

/**
 * NOWA FUNKCJA QoL 1: Odczytuje konfigurację z DOM i uruchamia grę.
 * Ta funkcja jest wywoływana tylko przez kliknięcie przycisku "Start Gry" i przez Dev Menu.
 */
function wrappedLoadConfigAndStart() {
    // POPRAWKA v0.69: Sprawdzanie, czy elementy istnieją (ponieważ są ładowane dynamicznie)
    const joyPosEl = document.querySelector('input[name="joypos"]:checked');
    const hyperEl = document.getElementById('chkHyper');
    const shakeEl = document.getElementById('chkShake');
    const fpsEl = document.getElementById('chkFPS');
    const fpsPosEl = document.querySelector('input[name="fpspos"]:checked');
    const labelsEl = document.getElementById('chkPickupLabels');
    const styleEl = document.querySelector('input[name="pickupstyle"]:checked');

    const pos = (joyPosEl || {value:'right'}).value;
    setJoystickSide(pos);
    game.hyper = !!(hyperEl && hyperEl.checked);
    game.screenShakeDisabled = !!(shakeEl && !shakeEl.checked);
    
    showFPS = !!(fpsEl && fpsEl.checked);
    fpsPosition = (fpsPosEl || {value:'right'}).value;
    
    pickupShowLabels = !!(labelsEl && labelsEl.checked);
    pickupStyleEmoji = (styleEl || {value:'emoji'}).value === 'emoji';
    
    uiData.game = game;
    uiData.pickupShowLabels = pickupShowLabels;
    uiData.pickupStyleEmoji = pickupStyleEmoji;

    wrappedStartRun();
}


// === GŁÓWNA PĘTLA AKTUALIZACJI ===
function update(dt){
  // POPRAWKA v0.66: Przekazanie obiektu camera do updateGame
  updateGame(
      gameStateRef, 
      dt, 
      wrappedLevelUp, 
      wrappedOpenChest,
      camera
  );

  // POPRAWKA v0.66: Dodanie scrollowania tła CSS
  if (canvas && camera) {
      // Pełna synchronizacja (1:1) i zaokrąglenie pikseli dla CSS
      const roundedX = Math.round(camera.offsetX);
      const roundedY = Math.round(camera.offsetY);
      
      canvas.style.backgroundPosition = `${-roundedX}px ${-roundedY}px`;
      // LOG USUNIĘTY DLA CZYSTOŚCI
  }
}

// === GŁÓWNA PĘTLA GRY (LOOP) ===
function loop(currentTime){
  // POPRAWKA v0.66: Krytyczne zabezpieczenie przed niezainicjalizowanymi obiektami
  if (canvas === null) {
      console.warn("Canvas nie został zainicjalizowany. Czekam...");
      animationFrameId = requestAnimationFrame(loop);
      return;
    }
    
    try {
        if (startTime === 0) {
            startTime = currentTime;
            lastTime = currentTime;
            lastFrameTime = currentTime;
        }
        const deltaMs = currentTime - lastTime;
        lastTime = currentTime;
        const dt = Math.min(deltaMs / 1000, 0.1); 
        
        // Licznik FPS
        frameCount++;
        if (currentTime - lastFrameTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = currentTime;
        }
        
        // AKTUALIZACJA WSKAŹNIKÓW BOMBY
        updateVisualEffects(dt, [], [], bombIndicators); 
        
        // AKTUALIZACJA CZĄSTECZEK (KONFETTI) NIEZALEŻNIE OD PAUZY
        // KLUCZOWA ZMIANA V0.67: Cząsteczki są aktualizowane ZAWSZE, aby efekt się odgrywał.
        updateParticles(dt, particles); 
        
        if(game.paused || !game.running){
            // ... reszta kodu w stanie pauzy ...
            // Rysowanie odbywa się w Draw, a Draw rysuje cząsteczki z tablicy particles.
            uiData.drawCallback();
            
            if (currentTime - lastUiUpdateTime > UI_UPDATE_INTERVAL) {
                lastUiUpdateTime = currentTime;
                if (game.inMenu || game.manualPause || (gameOverOverlay && gameOverOverlay.style.display === 'flex')) {
                    updateUI(game, player, settings, null); 
                }
            }
            animationFrameId = requestAnimationFrame(loop);
            return;
        }
        
        game.time = (currentTime - startTime) / 1000;
        
        update(dt); 
        
        // POPRAWKA v0.66: drawCallback używa teraz kamery
        uiData.drawCallback();
        
        if (currentTime - lastUiUpdateTime > UI_UPDATE_INTERVAL) {
            lastUiUpdateTime = currentTime;
            updateUI(game, player, settings, null);
        } 
        
        if(game.health<=0 && !devSettings.godMode){
            wrappedGameOver();
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
// POPRAWKA v0.69: Nowa funkcja do ładowania zawartości zakładek
async function loadMenuTabs() {
    console.log('[Refactor v0.69] Ładowanie zawartości zakładek HTML...');
    try {
        const [configHTML, devHTML, guideHTML] = await Promise.all([
            fetch('menu_config.html').then(res => res.text()),
            fetch('menu_dev.html').then(res => res.text()),
            fetch('menu_guide.html').then(res => res.text())
        ]);
        
        // NAPRAWIONO BŁĄD (v0.69 FINAL FIX): Poprawne przypisanie wszystkich zakładek
        // POPRAWNY KOD:
document.getElementById('tab-config').innerHTML = configHTML;
document.getElementById('tab-dev').innerHTML = devHTML;
document.getElementById('tab-guide').innerHTML = guideHTML;
        
        console.log('[Refactor v0.69] Zakładki załadowane. Inicjalizacja przełączania.');
        initTabSwitching();
        
        // POPRAWKA v0.69 (Refactor): Przeniesiono initEvents() tutaj,
        // aby eventy były dodawane PO załadowaniu HTML-a zakładek.
        initEvents();
        
    } catch (err) {
        console.error("BŁĄD KRYTYCZNY: Nie można załadować zawartości menu (menu_*.html).", err);
        alert("BŁĄD: Nie można załadować plików menu. Sprawdź, czy pliki menu_config.html, menu_dev.html i menu_guide.html znajdują się w tym samym folderze co index.html.");
    }
}


// POPRAWKA v0.66: Przeniesienie konfiguracji eventów do osobnej funkcji, wywoływanej po ładowaniu zasobów
function initEvents() {
    // POPRAWKA v0.69: Logika przełączania zakładek została przeniesiona do loadMenuTabs()

    // === Przycisk Start/Continue ===
    // POPRAWKA V0.67: Przycisk startu używa nowej funkcji ładującej konfigurację
    document.getElementById('btnStart').addEventListener('click', () => {
        wrappedLoadConfigAndStart();
    });

    // POPRAWKA v0.69: Eventy dla dynamicznie ładowanych elementów (Konfiguracja)
    // Musimy użyć delegacji zdarzeń na kontenerze, który istnieje od początku (np. #menuOverlay)
    // lub poczekać, aż loadMenuTabs() się zakończy.
    // Prostsze rozwiązanie (ponieważ initEvents() jest wywoływane PO loadMenuTabs()):
    // Możemy bezpiecznie dodać listenery, zakładając, że elementy już istnieją.
    
    // Listenery, które były w index.html, ale teraz są w menu_*.html
    const chkShake = document.getElementById('chkShake');
    if (chkShake) {
        chkShake.addEventListener('change', () => {
            game.screenShakeDisabled = !chkShake.checked;
        });
    }

    const chkFPS = document.getElementById('chkFPS');
    if (chkFPS) {
        chkFPS.addEventListener('change', () => {
            showFPS = !!chkFPS.checked;
        });
    }


    document.getElementById('btnContinue').addEventListener('click', () => {
        if(uiData.savedGameState){ 
            Object.assign(game, uiData.savedGameState.game);
            
            // Deserializacja gracza i broni
            player.x = uiData.savedGameState.player.x;
            player.y = uiData.savedGameState.player.y;
            player.speed = uiData.savedGameState.player.speed;
            player.weapons = [];
            const loadedWeapons = uiData.savedGameState.player.weapons || [];
            for (const savedWeapon of loadedWeapons) {
                const WeaponClass = WEAPON_CLASS_MAP[savedWeapon.type];
                if (WeaponClass) {
                    const newWeapon = new WeaponClass(player);
                    Object.assign(newWeapon, savedWeapon); 
                    player.weapons.push(newWeapon);
                }
            }
            
            Object.assign(settings, uiData.savedGameState.settings);
            perkLevels = {...uiData.savedGameState.perkLevels};

            // Wskrzeszanie wrogów
            enemies.length = 0; 
            const loadedEnemies = uiData.savedGameState.enemies || [];
            for (const savedEnemy of loadedEnemies) {
                const EnemyClass = ENEMY_CLASS_MAP[savedEnemy.type];
                if (EnemyClass && savedEnemy.stats) {
                    const newEnemy = new EnemyClass(savedEnemy.x, savedEnemy.y, savedEnemy.stats, 1); 
                    Object.assign(newEnemy, savedEnemy);
                    enemies.push(newEnemy);
                }
            }
            
            // Wczytywanie pocisków do puli
            playerBulletPool.releaseAll(); 
            const loadedBullets = uiData.savedGameState.bullets || [];
            for (const b of loadedBullets) {
                const newBullet = playerBulletPool.get(); 
                if (newBullet) {
                    newBullet.init(b.x, b.y, b.vx, b.vy, b.size, b.damage, b.color, b.pierce);
                    Object.assign(newBullet, b); 
                }
            }
            
            enemyBulletPool.releaseAll(); 
            const loadedEBullets = uiData.savedGameState.eBullets || [];
            for (const eb of loadedEBullets) {
                const newEBullet = enemyBulletPool.get(); 
                if (newEBullet) {
                    newEBullet.init(eb.x, eb.y, eb.vx, eb.vy, eb.size, eb.damage, eb.color);
                    Object.assign(newEBullet, eb);
                }
            }

            // Wczytywanie gemów do puli
            gemsPool.releaseAll();
            const loadedGems = uiData.savedGameState.gems || [];
            for (const g of loadedGems) {
                const newGem = gemsPool.get();
                if(newGem) {
                    newGem.init(g.x, g.y, g.r, g.val, g.color);
                    Object.assign(newGem, g);
                }
            }
            
            // Wczytywanie Hazardów (nowa tablica)
            hazards.length = 0; 
            const loadedHazards = uiData.savedGameState.hazards || [];
            for (const h of loadedHazards) {
                const newHazard = new Hazard(h.x, h.y, h.isMega, h.scale); // POPRAWKA v0.69: Wczytanie skali
                Object.assign(newHazard, h);
                hazards.push(newHazard);
            }

            // Pickupy (nadal tablica)
            pickups.length = 0;
            const loadedPickups = uiData.savedGameState.pickups || [];
            for (const p of loadedPickups) {
                const PickupClass = PICKUP_CLASS_MAP[p.type];
                if (PickupClass) {
                    const newPickup = new PickupClass(p.x, p.y);
                    Object.assign(newPickup, p); 
                    pickups.push(newPickup);
                }
            }
            
            // Skrzynie (nadal tablica)
            chests.length = 0; 
            const loadedChests = uiData.savedGameState.chests || [];
            for (const c of loadedChests) {
                const newChest = new Chest(c.x, c.y);
                Object.assign(newChest, c); 
                chests.push(newChest);
            }
            
            gameStateRef.enemyIdCounter = uiData.savedGameState.enemyIdCounter || 0;
            bombIndicators.length = 0; 
            
            particlePool.releaseAll();
            hitTextPool.releaseAll();

            menuOverlay.style.display='none';
            game.inMenu = false; game.paused = false; game.running = true; 
            
            initAudio();
            
            if (animationFrameId === null) {
              startTime = performance.now() - game.time * 1000; 
              lastTime = performance.now();
              lastFrameTime = performance.now();
              frameCount = 0;
              fps = 0;
              animationFrameId = requestAnimationFrame(loop);
            }
        }
    });

    document.getElementById('btnRetry').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        wrappedLoadConfigAndStart(); // Używamy wrappedLoadConfigAndStart
    });

    document.getElementById('btnMenu').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        wrappedShowMenu(false);
    });

    document.getElementById('btnResume').addEventListener('click', () => {
        wrappedResumeGame();
    });

    document.getElementById('btnPauseMenu').addEventListener('click', () => {
        pauseOverlay.style.display='none';
        game.manualPause = false;
        if (game.running && !game.inMenu) {
            uiData.savedGameState = { 
              game: {...game},
              player: { 
                  x: player.x, 
                  y: player.y, 
                  speed: player.speed, 
                  weapons: player.weapons.map(w => w.toJSON())
              }, 
              settings: {...settings},
              perkLevels: {...perkLevels},
              enemies: enemies.map(e => ({ ...e })),
              bullets: playerBulletPool.activeItems.map(b => ({ ...b })),
              eBullets: enemyBulletPool.activeItems.map(eb => ({ ...eb })),
              gems: gemsPool.activeItems.map(g => ({ ...g })),
              pickups: pickups.map(p => ({ ...p })),
              chests: chests.map(c => ({ ...c })),
              hazards: hazards.map(h => ({ ...h, isMega: h.isMega, scale: h.scale })), // POPRAWKA v0.69: Zapisywanie skali
              enemyIdCounter: gameStateRef.enemyIdCounter 
            };
            wrappedShowMenu(true);
        } else {
            wrappedShowMenu(false);
        }
    });

    window.wrappedPickPerk = (perk) => {
        pickPerk(perk, game, perkLevels, settings, null, player); 
    };

    document.getElementById('btnContinueMaxLevel').addEventListener('click', () => {
        levelUpOverlay.style.display='none';
        pickPerk(null, game, perkLevels, settings, null, player); 
    });

    document.getElementById('chestButton').addEventListener('click',() => {
        chestOverlay.style.display='none';
        if(uiData.currentChestReward){
            const state = { game, settings, weapons: null, player };
            uiData.currentChestReward.apply(state, uiData.currentChestReward);
            
            perkLevels[uiData.currentChestReward.id]=(perkLevels[uiData.currentChestReward.id]||0)+1;
            playSound('ChestReward');
        }
        uiData.currentChestReward=null;
        resumeGame(game, 0.75);
    });
}


// === START GRY ===

// Inicjalizacja modułu Input (v0.44)
const handleEscape = () => {
  if(!game.inMenu && game.running){
    if(game.manualPause){
      wrappedResumeGame();
    } else {
      wrappedPauseGame();
    }
  }
};
const handleJoyStart = () => {
  if(game.manualPause && !game.inMenu && game.running){ wrappedResumeGame(); }
};
const handleJoyEnd = () => {
  if(!game.manualPause && !game.paused && !game.inMenu && game.running){
    wrappedPauseGame();
  }
};

// === START GRY (v0.58) ===
console.log('[Main] Ładowanie zasobów...');
Promise.all([
    loadAssets(),
    loadAudio()
]).then(async () => { // POPRAWKA v0.69: Dodano 'async'
    console.log('[Main] Wszystkie zasoby (grafika i audio) załadowane. Inicjalizacja Canvas i Obiektów Gry.');
    
    // NOWA KRYTYCZNA KOLEJNOŚĆ INICJALIZACJI
    initializeCanvas();
    updateUiDataReferences(); // Wypełnij referencje do uiData (player, camera, pools)
    initStars(); // Inicjalizacja gwiazd wymaga wymiarów świata (z initializeCanvas)
    
    // POPRAWKA v0.69: Ładowanie zawartości zakładek HTML PRZED resztą eventów
    await loadMenuTabs();
    
    // POPRAWKA V0.67: PRZEKAZANIE NOWEJ FUNKCJI ŁADUJĄCEJ KONFIGURACJĘ
    initDevTools(gameStateRef, wrappedLoadConfigAndStart); 
    
    // POPRAWKA v0.69: initEvents() jest teraz wywoływane WEWNĄTRZ loadMenuTabs()
    
    initInput(handleEscape, handleJoyStart, handleJoyEnd); // Input wymaga initEvents
    
    wrappedShowMenu(false);
}).catch(async (err) => { // POPRAWKA v0.69: Dodano 'async'
    console.error("[Main] Krytyczny błąd podczas ładowania zasobów:", err);
    // Nadal pokaż menu, nawet jeśli ładowanie się nie powiodło (z fallbackami na kwadraty)
    initializeCanvas();
    updateUiDataReferences();
    initStars();
    
    // POPRAWKA v0.69: Spróbuj załadować zakładki nawet po błędzie, aby menu działało
    await loadMenuTabs(); 
    
    // POPRAWKA V0.67: PRZEKAZANIE NOWEJ FUNKCJI ŁADUJĄCEJ KONFIGURACJĘ
    initDevTools(gameStateRef, wrappedLoadConfigAndStart); 
    
    // POPRAWKA v0.69: initEvents() jest teraz wywoływane WEWNĄTRZ loadMenuTabs()
    
    initInput(handleEscape, handleJoyStart, handleJoyEnd);
    wrappedShowMenu(false);
});