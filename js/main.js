// ==============
// MAIN.JS (v0.65 - Centralizacja Danych)
// Lokalizacja: /js/main.js
// ==============

// === Importowanie modułów ===
import {
    addHitText, spawnConfetti, limitedShake,
    findFreeSpotForPickup, applyPickupSeparation
} from './core/utils.js';
import { ObjectPool } from './core/objectPool.js';

import { Player } from './entities/player.js';

// POPRAWKA v0.65: Usunięto import INITIAL_SETTINGS
import {
    AutoGun, OrbitalWeapon, NovaWeapon
} from './config/weapon.js';
// POPRAWKA v0.65: Import nowej centralnej konfiguracji
import { PLAYER_CONFIG, GAME_CONFIG } from './config/gameData.js';

import { draw } from './core/draw.js';

import {
    updateUI, updateStatsUI, showPerks, pickPerk, openChest,
    gameOver, pauseGame, resumeGame,
    showMenu, startRun, resetAll,
    levelUp,
    gameOverOverlay
} from './ui/ui.js';

import { areaNuke, updateVisualEffects } from './managers/effects.js';
import { keys, jVec, initInput, setJoystickSide } from './ui/input.js';
import { perkPool } from './config/perks.js';
import { devSettings, initDevTools } from './services/dev.js';
import { checkCollisions } from './managers/collisions.js';
import { updateGame } from './core/gameLogic.js';
import { initAudio, playSound, loadAudio } from './services/audio.js';
// POPRAWKA v0.65: Import ENEMY_STATS jest teraz w enemyManager.js, nie tutaj
import { ENEMY_CLASS_MAP } from './managers/enemyManager.js';
import { PlayerBullet, EnemyBullet } from './entities/bullet.js';
// POPRAWKA v0.62: Import nowych klas dla puli
import { Gem } from './entities/gem.js';
import { Particle } from './entities/particle.js';
import { HitText } from './entities/hitText.js';
import { 
    Pickup, HealPickup, MagnetPickup, ShieldPickup, 
    SpeedPickup, BombPickup, FreezePickup 
} from './entities/pickup.js';
import { Chest } from './entities/chest.js';
import { loadAssets } from './services/assets.js';
import { VERSION } from './config/version.js';

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

// === Referencje do DOM (tylko te używane globalnie) ===
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');

// === Ustawienia i stan gry ===
let pickupShowLabels = true;
let pickupStyleEmoji = false;
let showFPS = true;
let fpsPosition = 'right'; // POPRAWKA v0.64: Nowa zmienna dla pozycji FPS

let animationFrameId = null;
let startTime = 0;
let lastTime = 0;
let savedGameState = null;

let fps = 0;
let lastFrameTime = 0;
let frameCount = 0;
let lastUiUpdateTime = 0;
const UI_UPDATE_INTERVAL = 100;

// POPRAWKA v0.65: Użyj wartości z PLAYER_CONFIG i GAME_CONFIG
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

const player = new Player(canvas.width / 2, canvas.height / 2);

// Tablice stanu gry (Tylko te, które nie są (jeszcze) pulami)
const enemies=[]; 
const chests=[];
const pickups=[];
const stars=[];
const bombIndicators = [];
// POPRAWKA v0.62: Usunięto 'trails', 'confettis', 'particles', 'hitTexts', 'gems'

// POPRAWKA v0.62: Tworzenie Puli Obiektów dla wszystkiego
const playerBulletPool = new ObjectPool(PlayerBullet, 500);
const enemyBulletPool = new ObjectPool(EnemyBullet, 500);
const gemsPool = new ObjectPool(Gem, 1000); // Pula dla Gemów XP
const particlePool = new ObjectPool(Particle, 2000); // Pula dla cząsteczek, konfetti i śladów
const hitTextPool = new ObjectPool(HitText, 100); // Pula dla tekstów obrażeń

// POPRAWKA v0.65: Użyj wartości z GAME_CONFIG
const settings={ 
    spawn: GAME_CONFIG.INITIAL_SPAWN_RATE,
    maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    eliteInterval: GAME_CONFIG.ELITE_SPAWN_INTERVAL,
    lastFire:0, 
    lastElite:0 
};

let perkLevels={};

// Definicja gameStateRef
const gameStateRef = {
  game,
  player,
  settings,
  perkLevels,
  enemies,
  chests,
  pickups,
  canvas,
  bombIndicators,
  stars,
  // POPRAWKA v0.62: Przekazanie Puli zamiast tablic
  bulletsPool: playerBulletPool, 
  eBulletsPool: enemyBulletPool,
  gemsPool: gemsPool,
  particlePool: particlePool,
  hitTextPool: hitTextPool,
  // Przekazujemy też aktywne obiekty dla pętli
  bullets: playerBulletPool.activeItems, 
  eBullets: enemyBulletPool.activeItems,
  gems: gemsPool.activeItems,
  particles: particlePool.activeItems,
  hitTexts: hitTextPool.activeItems,
  // 'trails' i 'confettis' nie są już potrzebne
  trails: [], // Pusta tablica dla kompatybilności (zostanie usunięte później)
  confettis: [], // Pusta tablica dla kompatybilności
  enemyIdCounter: 0 
};

// === Przypisanie funkcji globalnych (dla HTML onclick) ===
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
};

// === Dane dla UI ===
const uiData = {
    VERSION, 
    game, player, settings, weapons: null, perkLevels, 
    enemies, 
    chests, pickups, stars, bombIndicators,
    // POPRAWKA v0.62: Przekazanie aktywnych obiektów z puli
    bullets: playerBulletPool.activeItems,
    eBullets: enemyBulletPool.activeItems,
    gems: gemsPool.activeItems,
    particles: particlePool.activeItems,
    hitTexts: hitTextPool.activeItems,
    trails: [], // Pusta tablica
    confettis: [], // Pusta tablica
    canvas, ctx,
    animationFrameId, startTime, lastTime, savedGameState,
    loopCallback: loop, 
    // POPRAWKA v0.64: Przekazanie 'fpsPosition' do funkcji rysowania
    drawCallback: () => draw(ctx, canvas, game, stars, [], player, enemies, playerBulletPool.activeItems, enemyBulletPool.activeItems, gemsPool.activeItems, pickups, chests, particlePool.activeItems, hitTextPool.activeItems, bombIndicators, [], pickupStyleEmoji, pickupShowLabels, 0, false, fpsPosition), 
    initStarsCallback: initStars,
    currentChestReward: null 
};


// === Funkcje pomocnicze do zarządzania stanem (Wrappery) ===
function initStars(){
  stars.length = 0;
  for(let i=0;i<30;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
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
    
    // POPRAWKA v0.62: Przekazanie Puli do resetAll
    uiData.bulletsPool = playerBulletPool;
    uiData.eBulletsPool = enemyBulletPool;
    uiData.gemsPool = gemsPool;
    uiData.particlePool = particlePool;
    uiData.hitTextPool = hitTextPool;
    uiData.trails = []; // Puste
    uiData.confettis = []; // Puste
    
    resetAll(canvas, settings, perkLevels, uiData);
    
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
    // POPRAWKA v0.62: Przekazujemy pule obiektów z gameStateRef
    levelUp(game, player, gameStateRef.hitTextPool, gameStateRef.particlePool, settings, null, perkLevels);
}

function wrappedOpenChest() {
    openChest(game, perkLevels, uiData);
}

function wrappedGameOver() {
    uiData.savedGameState = savedGameState;
    gameOver(game, uiData);
    savedGameState = uiData.savedGameState;
}

function wrappedStartRun() {
    uiData.animationFrameId = animationFrameId;
    uiData.startTime = startTime;
    uiData.lastTime = lastTime;
    startRun(game, wrappedResetAll, uiData);
    animationFrameId = uiData.animationFrameId;
    startTime = uiData.startTime;
    lastTime = uiData.lastTime;
}


// === GŁÓWNA PĘTLA AKTUALIZACJI ===
function update(dt){
  updateGame(
      gameStateRef, 
      dt, 
      wrappedLevelUp, 
      wrappedOpenChest
  );
}

// === GŁÓWNA PĘTLA GRY (LOOP) ===
function loop(currentTime){
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

    // POPRAWKA v0.62: updateVisualEffects aktualizuje teraz tylko bombIndicators
    updateVisualEffects(dt, [], [], bombIndicators); 

    if(game.paused || !game.running){
      // POPRAWKA v0.64: Przekazanie 'fpsPosition' do funkcji rysowania
      draw(ctx, canvas, game, stars, [], player, enemies, playerBulletPool.activeItems, enemyBulletPool.activeItems, gemsPool.activeItems, pickups, chests, particlePool.activeItems, hitTextPool.activeItems, bombIndicators, [], pickupStyleEmoji, pickupShowLabels, fps, showFPS, fpsPosition);
      
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
    
    // POPRAWKA v0.64: Przekazanie 'fpsPosition' do funkcji rysowania
    draw(ctx, canvas, game, stars, [], player, enemies, playerBulletPool.activeItems, enemyBulletPool.activeItems, gemsPool.activeItems, pickups, chests, particlePool.activeItems, hitTextPool.activeItems, bombIndicators, [], pickupStyleEmoji, pickupShowLabels, fps, showFPS, fpsPosition);
    
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
document.getElementById('btnStart').addEventListener('click', () => {
  const pos=(document.querySelector('input[name="joypos"]:checked')||{value:'right'}).value;
  setJoystickSide(pos);
  game.hyper=!!(document.getElementById('chkHyper')&&document.getElementById('chkHyper').checked);
  game.screenShakeDisabled = !document.getElementById('chkShake').checked;
  
  showFPS = !!(document.getElementById('chkFPS') && document.getElementById('chkFPS').checked);
  // POPRAWKA v0.64: Wczytanie opcji pozycji FPS
  fpsPosition = (document.querySelector('input[name="fpspos"]:checked')||{value:'right'}).value;
  
  pickupShowLabels = !!(document.getElementById('chkPickupLabels') && document.getElementById('chkPickupLabels').checked);
  pickupStyleEmoji = (document.querySelector('input[name="pickupstyle"]:checked')||{value:'emoji'}).value === 'emoji';
  
  uiData.game = game;
  uiData.pickupShowLabels = pickupShowLabels;
  uiData.pickupStyleEmoji = pickupStyleEmoji;

  startRun(game, wrappedResetAll, uiData);
  
  animationFrameId = uiData.animationFrameId;
  startTime = uiData.startTime;
  lastTime = uiData.lastTime;
  lastFrameTime = uiData.lastTime; 
  frameCount = 0;
  fps = 0;
});

document.getElementById('chkShake').addEventListener('change', () => {
    game.screenShakeDisabled = !document.getElementById('chkShake').checked;
});

document.getElementById('chkFPS').addEventListener('change', () => {
    showFPS = !!document.getElementById('chkFPS').checked;
});

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
        // POPRAWKA v0.65: Użyj ENEMY_STATS z gameStateRef (który importuje z gameData)
        const stats = gameStateRef.ENEMY_STATS[savedEnemy.type]; 
        const EnemyClass = ENEMY_CLASS_MAP[savedEnemy.type];
        if (EnemyClass && stats) {
            const newEnemy = new EnemyClass(savedEnemy.x, savedEnemy.y, stats, 1); 
            Object.assign(newEnemy, savedEnemy);
            enemies.push(newEnemy);
        }
    }
    
    // POPRAWKA v0.62: Wczytywanie pocisków do puli
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

    // POPRAWKA v0.62: Wczytywanie gemów do puli
    gemsPool.releaseAll();
    const loadedGems = uiData.savedGameState.gems || [];
    for (const g of loadedGems) {
        const newGem = gemsPool.get();
        if(newGem) {
            newGem.init(g.x, g.y, g.r, g.val, g.color);
            Object.assign(newGem, g);
        }
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
    
    // Reset tablic, które nie są zapisywane (i nie są pulami)
    gameStateRef.enemyIdCounter = uiData.savedGameState.enemyIdCounter || 0;
    bombIndicators.length = 0; 
    
    // Wyczyść pule efektów
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
  wrappedStartRun();
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
        // POPRAWKA v0.62: Zapisz tylko aktywne obiekty z puli
        bullets: playerBulletPool.activeItems.map(b => ({ ...b })),
        eBullets: enemyBulletPool.activeItems.map(eb => ({ ...eb })),
        gems: gemsPool.activeItems.map(g => ({ ...g })),
        // Pomijamy zapisywanie cząsteczek i tekstów obrażeń (są tymczasowe)
        pickups: pickups.map(p => ({ ...p })),
        chests: chests.map(c => ({ ...c })),
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

document.getElementById('chestButton').addEventListener('click',()=>{
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


// === START GRY ===
initStars();

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
initInput(handleEscape, handleJoyStart, handleJoyEnd);

// Inicjaljalizacja modułu Dev Tools (v0.45)
initDevTools(gameStateRef);

// === START GRY (v0.58) ===
console.log('[Main] Ładowanie zasobów...');
Promise.all([
    loadAssets(),
    loadAudio()
]).then(() => {
    console.log('[Main] Wszystkie zasoby (grafika i audio) załadowane. Pokazuję menu.');
    wrappedShowMenu(false);
}).catch(err => {
    console.error("[Main] Krytyczny błąd podczas ładowania zasobów:", err);
    wrappedShowMenu(false);
});