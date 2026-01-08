// ==============
// MAIN.JS (v0.114c - Full Restoration & Resume Fix)
// Lokalizacja: /js/main.js
// ==============

import './services/i18n.js';
import { ObjectPool } from './core/objectPool.js';
import { Player } from './entities/player.js';
import { PLAYER_CONFIG, WORLD_CONFIG } from './config/gameData.js';
import { draw } from './core/draw.js';
import { updateUI, resumeGame, showMenu, gameOver, pauseGame } from './ui/ui.js';
import { initializeMainEvents } from './core/eventManager.js';
import { initInput } from './ui/input.js';
import { initDevTools } from './services/dev.js';
import { PlayerBullet, EnemyBullet } from './entities/bullet.js';
import { Gem } from './entities/gem.js';
import { Particle } from './entities/particle.js';
import { HitText } from './entities/hitText.js';
import { VERSION } from './config/version.js';
import { displayScores } from './services/scoreManager.js';
import { generateMap } from './managers/mapManager.js';
import { shopManager } from './services/shopManager.js';

// Importy modułowe
import { Camera } from './core/camera.js';
import { gameStateRef } from './core/gameState.js';
import { loop, initStars, fps } from './core/gameLoop.js';
import { launchApp, advanceSplash } from './core/appLauncher.js';
import { handleMenuBack } from './ui/menus.js';

// Referencja globalna dla modułów
window.gameStateRef = gameStateRef;

const uiData = {
    VERSION: VERSION,
    game: gameStateRef.game,
    player: null,
    settings: gameStateRef.settings,
    weapons: null,
    perkLevels: gameStateRef.perkLevels,
    enemies: gameStateRef.enemies,
    chests: gameStateRef.chests,
    pickups: gameStateRef.pickups,
    stars: gameStateRef.stars,
    bombIndicators: gameStateRef.bombIndicators,
    hazards: gameStateRef.hazards,
    bullets: null,
    eBullets: null,
    gems: null,
    particles: null,
    hitTexts: null,
    trails: [],
    confettis: [],
    canvas: null,
    ctx: null,
    animationFrameId: null,
    startTime: 0,
    lastTime: 0,
    savedGameState: null,
    loopCallback: null,
    drawCallback: null,
    initStarsCallback: () => initStars(gameStateRef),
    currentChestReward: null,
    pickupShowLabels: true,
    pickupStyleEmoji: false,
    showFPS: false,
    fpsPosition: 'right',
    gameData: { PLAYER_CONFIG, WORLD_CONFIG },
    obstacles: gameStateRef.obstacles
};

function updateGameTitle() {
    const fullTitle = `Szkeletal: Ziemniaczkowy Głód Estrogenowego Drakula v${VERSION}`;
    document.title = fullTitle;
    const menuVer = document.getElementById('menuVersionTag');
    if (menuVer) menuVer.textContent = `v${VERSION}`;
}

function handleResize() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const hudTop = document.querySelector('.bars-container');
    const hudBottom = document.getElementById('gameInfo');
    let availableHeight = window.innerHeight;
    if (hudTop) availableHeight -= hudTop.offsetHeight;
    if (hudBottom) availableHeight -= hudBottom.offsetHeight;
    canvas.width = window.innerWidth;
    canvas.height = Math.max(300, availableHeight - 10);
    
    if (gameStateRef.camera) {
        gameStateRef.camera.updateViewDimensions(canvas.width, canvas.height);
        if (gameStateRef.game.inMenu && gameStateRef.player) {
            gameStateRef.camera.offsetX = gameStateRef.player.x - canvas.width / 2;
            gameStateRef.camera.offsetY = gameStateRef.player.y - canvas.height / 2;
        }
    }
    if (gameStateRef.stars.length > 0) initStars(gameStateRef);
}

function initializeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas || gameStateRef.canvas) return;
    
    gameStateRef.canvas = canvas;
    gameStateRef.ctx = canvas.getContext('2d');
    handleResize();
    
    window.addEventListener('resize', () => { requestAnimationFrame(handleResize); });
    
    const worldSize = WORLD_CONFIG.SIZE;
    const worldWidth = canvas.width * worldSize;
    const worldHeight = canvas.height * worldSize;
    
    // FIX ETAP 3: Resetowanie timerów wizualnych przy nowej instancji gracza
    gameStateRef.game.playerHitFlashT = 0;
    gameStateRef.game.shakeT = 0;
    gameStateRef.game.isDying = false;
    
    gameStateRef.player = new Player(worldWidth / 2, worldHeight / 2);
    gameStateRef.camera = new Camera(worldWidth, worldHeight, canvas.width, canvas.height);
    
    generateMap(gameStateRef.obstacles, gameStateRef.player, worldWidth, worldHeight);
    
    gameStateRef.bulletsPool = new ObjectPool(PlayerBullet, 500);
    gameStateRef.eBulletsPool = new ObjectPool(EnemyBullet, 500);
    gameStateRef.gemsPool = new ObjectPool(Gem, 3000);
    gameStateRef.particlePool = new ObjectPool(Particle, 2000);
    gameStateRef.hitTextPool = new ObjectPool(HitText, 100);
    
    gameStateRef.bullets = gameStateRef.bulletsPool.activeItems;
    gameStateRef.eBullets = gameStateRef.eBulletsPool.activeItems;
    gameStateRef.gems = gameStateRef.gemsPool.activeItems;
    gameStateRef.particles = gameStateRef.particlePool.activeItems;
    gameStateRef.hitTexts = gameStateRef.hitTextPool.activeItems;
}

function updateUiDataReferences() {
    uiData.player = gameStateRef.player;
    uiData.canvas = gameStateRef.canvas;
    uiData.ctx = gameStateRef.ctx;
    uiData.bullets = gameStateRef.bullets;
    uiData.eBullets = gameStateRef.eBullets;
    uiData.gems = gameStateRef.gems;
    uiData.particles = gameStateRef.particles;
    uiData.hitTexts = gameStateRef.hitTexts;
    uiData.hazards = gameStateRef.hazards;
    
    uiData.loopCallback = (t) => loop(t, gameStateRef, uiData);
    uiData.drawCallback = () => draw(gameStateRef.ctx, gameStateRef, uiData, fps);
}

function initTabSwitching() {
    document.querySelectorAll('.tabs .tab').forEach((tab, index) => {
        tab.addEventListener('click', (event) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            event.target.classList.add('active');
            const tabNames = ['game', 'config', 'dev', 'guide'];
            const activeTabName = tabNames[index];
            document.getElementById('tab-' + activeTabName).classList.add('active');
            
            if (activeTabName === 'config') {
                const balance = shopManager.getWalletBalance();
                const shopPointsEl = document.getElementById('shopWalletPoints');
                if (shopPointsEl) shopPointsEl.textContent = balance.toLocaleString();
                if (window.wrappedGenerateShop) window.wrappedGenerateShop();
            }
        });
    });
}

function initMenuAndEvents() {
    initTabSwitching();
    const { initEvents, wrappedLoadConfig, wrappedStartRun } = initializeMainEvents(gameStateRef, uiData);
    initEvents();
    window.wrappedGameOver = () => gameOver(gameStateRef.game, uiData);
    window.wrappedPauseGame = () => pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
    window.wrappedResumeGame = () => resumeGame(gameStateRef.game);
    displayScores('scoresBodyMenu');
    return { wrappedLoadConfig, wrappedStartRun };
}

launchApp(gameStateRef, uiData, {
    updateGameTitle,
    initializeCanvas: () => {
        initializeCanvas();
        updateUiDataReferences();
    },
    initStars: () => initStars(gameStateRef),
    onAssetsReady: () => {
        const { wrappedLoadConfig, wrappedStartRun } = initMenuAndEvents();
        initDevTools(gameStateRef, wrappedLoadConfig, wrappedStartRun);
        initInput(handleEscape, handleJoyStart, handleJoyEnd);
        
        // FIX Ad 3: Przycisk KONTYNUUJ musi korzystać z logiki handleMenuBack,
        // aby wymusić pokazanie poczekajki (odliczania) zamiast natychmiastowego wznowienia.
        const btnContinue = document.getElementById('btnContinue');
        if (btnContinue) {
            btnContinue.onclick = () => {
                handleMenuBack();
            };
        }
    }
});

window.addEventListener('keydown', advanceSplash);
window.addEventListener('mousedown', advanceSplash);
window.addEventListener('touchstart', advanceSplash, { passive: false });

const handleEscape = () => {
    if (!gameStateRef.game.inMenu && gameStateRef.game.running && !gameStateRef.game.isDying) {
        if (gameStateRef.game.manualPause) window.wrappedResumeGame();
        else window.wrappedPauseGame();
    }
};
const handleJoyStart = () => { if (gameStateRef.game.manualPause && !gameStateRef.game.inMenu) window.wrappedResumeGame(); };
const handleJoyEnd = () => { if (!gameStateRef.game.manualPause && !gameStateRef.game.paused && !gameStateRef.game.inMenu) window.wrappedPauseGame(); };