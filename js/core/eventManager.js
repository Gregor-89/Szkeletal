// ==============
// EVENTMANAGER.JS (v0.91c - FIX: Pełna lista tłumaczeń)
// Lokalizacja: /js/core/eventManager.js
// ==============

// Importy Menedżerów
import { showMenu, resetAll, pauseGame, resumeGame, gameOver, startRun } from '../ui/ui.js';
import { levelUp, pickPerk, openChest } from '../managers/levelManager.js';
import { saveGame, loadGame } from '../services/saveManager.js';
import { playSound } from '../services/audio.js';
import { setJoystickSide } from '../ui/input.js';
import { devSettings, resetDevTime } from '../services/dev.js';

// Importy Systemowe
import { 
    getLang, setLanguage, getAvailableLanguages, getCurrentLanguage 
} from '../services/i18n.js';
import { get as getAsset } from '../services/assets.js'; 

// Import referencji DOM
import {
    gameOverOverlay, pauseOverlay, levelUpOverlay, chestOverlay,
    btnContinueMaxLevel, chestButton, docTitle
} from '../ui/domElements.js';


// Przechowuje referencje ustawione podczas inicjalizacji
let gameStateRef = null;
let uiDataRef = null;

// --- Funkcje Pomocnicze (Ikony) ---

function getIconHtml(assetKey) {
    const asset = getAsset(assetKey);
    if (asset) {
        // Klasa 'bar-icon' zapewnia spójny rozmiar (zdefiniowany w CSS)
        return `<img src="${asset.src}" class="bar-icon" alt=""> `; 
    }
    return '';
}

// --- Funkcje Wrapper ---

function wrappedShowMenu(allowContinue = false) {
    // Hack na odświeżenie referencji (dla pewności)
    uiDataRef.animationFrameId = uiDataRef.animationFrameId;
    showMenu(uiDataRef.game, wrappedResetAll, uiDataRef, allowContinue);
    updateAllStaticText(); 
}

function wrappedResetAll() {
    uiDataRef.game = gameStateRef.game;
    uiDataRef.settings = gameStateRef.settings;
    uiDataRef.perkLevels = gameStateRef.perkLevels;
    uiDataRef.enemies = gameStateRef.enemies;
    uiDataRef.chests = gameStateRef.chests;
    uiDataRef.pickups = gameStateRef.pickups;
    uiDataRef.bombIndicators = gameStateRef.bombIndicators;
    uiDataRef.stars = gameStateRef.stars;
    uiDataRef.hazards = gameStateRef.hazards;
    uiDataRef.bulletsPool = gameStateRef.bulletsPool;
    uiDataRef.eBulletsPool = gameStateRef.eBulletsPool;
    uiDataRef.gemsPool = gameStateRef.gemsPool;
    uiDataRef.particlePool = gameStateRef.particlePool;
    uiDataRef.hitTextPool = gameStateRef.hitTextPool;
    uiDataRef.camera = gameStateRef.camera; 
    
    if (window.SIEGE_EVENT_CONFIG) {
        uiDataRef.settings.currentSiegeInterval = window.SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
    }
    
    resetAll(uiDataRef.canvas, uiDataRef.settings, uiDataRef.perkLevels, uiDataRef, uiDataRef.camera);
    gameStateRef.enemyIdCounter = 0;
    uiDataRef.animationFrameId = null;
    uiDataRef.lastTime = 0;
    uiDataRef.startTime = 0;
}

function wrappedPauseGame() {
    pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
    updateAllStaticText();
}

function wrappedResumeGame() {
    const resumeTime = uiDataRef.gameData?.UI_CONFIG?.RESUME_TIMER || 0.75;
    resumeGame(gameStateRef.game, resumeTime);
}

function wrappedLevelUp() {
    levelUp(gameStateRef.game, gameStateRef.player, gameStateRef.hitTextPool, gameStateRef.particlePool, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.perkLevels);
    updateAllStaticText();
}

function wrappedOpenChest() {
    openChest(gameStateRef.game, gameStateRef.perkLevels, uiDataRef, gameStateRef.player);
    updateAllStaticText();
}

function wrappedGameOver() {
    gameOver(gameStateRef.game, uiDataRef);
    uiDataRef.savedGameState = null;
    updateAllStaticText();
}

function wrappedStartRun() {
    startRun(gameStateRef.game, wrappedResetAll, uiDataRef); 
}

function wrappedLoadConfig() {
    const joyPosEl = document.querySelector('input[name="joypos"]:checked');
    const hyperEl = document.getElementById('chkHyper');
    const shakeEl = document.getElementById('chkShake');
    const fpsEl = document.getElementById('chkFPS');
    const fpsPosEl = document.querySelector('input[name="fpspos"]:checked');
    const labelsEl = document.getElementById('chkPickupLabels');
    const styleEl = document.querySelector('input[name="pickupstyle"]:checked');

    const pos = (joyPosEl || {value:'right'}).value;
    setJoystickSide(pos);
    gameStateRef.game.hyper = !!(hyperEl && hyperEl.checked);
    gameStateRef.game.screenShakeDisabled = !!(shakeEl && !shakeEl.checked);
    
    uiDataRef.showFPS = !!(fpsEl && fpsEl.checked);
    uiDataRef.fpsPosition = (fpsPosEl || {value:'right'}).value;
    
    uiDataRef.pickupShowLabels = !!(labelsEl && labelsEl.checked);
    uiDataRef.pickupStyleEmoji = (styleEl || {value:'emoji'}).value === 'emoji';
}

// --- i18n Update Logic ---

function updateAllStaticText() {
    const lang = getCurrentLanguage();
    
    // 1. Mapowanie ID elementu -> Klucz Tłumaczenia
    const textMap = {
        'docTitle': 'ui_game_title',
        'title': 'ui_game_title',
        
        // HUD (Statyczne etykiety)
        'statLabelScore': 'ui_hud_score',
        'statLabelLevel': 'ui_hud_level',
        'statLabelXP': 'ui_hud_xp_name',
        'statLabelHealth': 'ui_hud_hp_name',
        'statLabelEnemies': 'ui_hud_enemies',
        'statLabelTime': 'ui_hud_time',
        
        // Zakładki Menu
        'tabBtnGame': 'ui_menu_tab_game',
        'tabBtnConfig': 'ui_menu_tab_config',
        'tabBtnDev': 'ui_menu_tab_dev',
        'tabBtnGuide': 'ui_menu_tab_guide',
        'menuNewGamePrompt': 'ui_menu_new_game_prompt',
        'btnStart': 'ui_menu_start',
        'btnContinue': 'ui_menu_continue',
        'btnReplayIntro': 'ui_menu_replay_intro',
        'btnClearScoresMenu': 'ui_scores_clear',
        'btnClearScoresGO': 'ui_scores_clear',
        
        // Konfiguracja
        'configTitleGame': 'ui_config_title_game',
        'configJoystickTitle': 'ui_config_joystick',
        'configJoyLeft': 'ui_config_joy_left',
        'configJoyRight': 'ui_config_joy_right',
        'configJoyOff': 'ui_config_joy_off',
        'configHyper': 'ui_config_hyper',
        'configShake': 'ui_config_shake',
        'configTitleVisual': 'ui_config_title_visual',
        'configFPS': 'ui_config_fps',
        'configFpsPosTitle': 'ui_config_fps_pos',
        'configFpsPosLeft': 'ui_config_fps_pos_left',
        'configFpsPosRight': 'ui_config_fps_pos_right',
        'configLabels': 'ui_config_labels',
        'configStyleTitle': 'ui_config_style',
        'configStyleCircle': 'ui_config_style_circle',
        'configStyleEmoji': 'ui_config_style_emoji',
        'configTitleLang': 'ui_config_title_lang',
        
        // Intro
        'btnIntroPrev': 'ui_intro_prev',
        'btnIntroSkip': 'ui_intro_skip',
        'btnIntroNext': 'ui_intro_next',
        
        // Ekrany
        'levelUpTitle': 'ui_levelup_title',
        'btnContinueMaxLevel': 'ui_levelup_max',
        'levelUpStatsTitle': 'ui_levelup_stats',
        'pauseTitle': 'ui_pause_title',
        'pauseText': 'ui_pause_text',
        'btnResume': 'ui_pause_resume',
        'btnPauseMenu': 'ui_pause_menu',
        'pauseStatsTitle': 'ui_levelup_stats',
        'chestTitle': 'ui_chest_title',
        'chestButton': 'ui_chest_button',
        'gameOverTitle': 'ui_gameover_title',
        'btnRetry': 'ui_gameover_retry',
        'btnMenu': 'ui_gameover_menu',
        'confirmTitle': 'ui_confirm_title',
        'btnConfirmYes': 'ui_confirm_yes',
        'btnConfirmNo': 'ui_confirm_no'
    };

    // 2. Mapowanie ID elementu -> Klucz Ikony (assets.js)
    // To pozwala nam wstawić <img src="..."> przed tekstem
    const iconMap = {
        'scoresTitleMenu': 'icon_hud_score', // Ikona pucharu/wyniku
        'scoresTitleGO': 'icon_hud_score',
        
        // Nagłówki tabel (Scores)
        'scoresScoreMenu': 'icon_hud_score',
        'scoresLevelMenu': 'icon_hud_level',
        'scoresTimeMenu': 'icon_hud_time',
        'scoresScoreGO': 'icon_hud_score',
        'scoresLevelGO': 'icon_hud_level',
        'scoresTimeGO': 'icon_hud_time',
        
        // Game Over Stats Labels
        'gameOverScoreLabel': 'icon_hud_score',
        'gameOverLevelLabel': 'icon_hud_level',
        'gameOverTimeLabel': 'icon_hud_time'
    };

    // Aplikowanie tłumaczeń i ikon
    for (const [id, key] of Object.entries(textMap)) {
        const el = document.getElementById(id);
        if (el) {
            const text = getLang(key);
            const iconKey = iconMap[id];
            
            if (iconKey) {
                // Jeśli element ma przypisaną ikonę, używamy innerHTML
                el.innerHTML = `${getIconHtml(iconKey)}${text}`;
            } else if (id === 'docTitle' && docTitle) {
                docTitle.textContent = `${text} v${uiDataRef.VERSION || '0.91'}`;
            } else {
                // Zwykły tekst
                el.textContent = text;
            }
        }
    }
    
    const prompt = document.getElementById('confirmText');
    if (prompt) prompt.textContent = getLang('ui_confirm_clear_scores');
    
    // Odświeżanie Przewodnika (ui.js ma funkcję generateGuide wywoływaną osobno, 
    // ale przy zmianie języka warto ją wywołać ponownie, jeśli menu jest otwarte)
    if (window.wrappedGenerateGuide) {
        window.wrappedGenerateGuide();
    }
}

function buildLanguageSelector() {
    const container = document.getElementById('lang-selector-container');
    if (!container) return;
    
    container.innerHTML = ''; 
    const availableLangs = getAvailableLanguages();
    const currentLang = getCurrentLanguage();
    
    availableLangs.forEach(langName => {
        const label = document.createElement('label');
        label.className = 'option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'lang';
        input.value = langName;
        if (langName === currentLang) input.checked = true;
        
        input.onchange = () => {
            setLanguage(langName);
            updateAllStaticText(); 
        };
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${langName}`));
        container.appendChild(label);
    });
}

function initEvents() {
    buildLanguageSelector();
    updateAllStaticText(); 

    document.getElementById('btnStart').addEventListener('click', () => {
        devSettings.presetLoaded = false;
        resetDevTime(); 
        wrappedLoadConfig();
        wrappedStartRun();
    });

    // Konfiguracja
    const chkShake = document.getElementById('chkShake');
    if (chkShake) chkShake.addEventListener('change', () => { gameStateRef.game.screenShakeDisabled = !chkShake.checked; });
    const chkFPS = document.getElementById('chkFPS');
    if (chkFPS) chkFPS.addEventListener('change', () => { uiDataRef.showFPS = !!chkFPS.checked; });
    
    document.querySelectorAll('input[name="fpspos"]').forEach(radio => {
        radio.addEventListener('change', (e) => { if (e.target.checked) uiDataRef.fpsPosition = e.target.value; });
    });
    const chkLabels = document.getElementById('chkPickupLabels');
    if (chkLabels) chkLabels.addEventListener('change', () => { uiDataRef.pickupShowLabels = !!chkLabels.checked; });
    document.querySelectorAll('input[name="pickupstyle"]').forEach(radio => {
        radio.addEventListener('change', (e) => { if (e.target.checked) uiDataRef.pickupStyleEmoji = e.target.value === 'emoji'; });
    });

    // Przyciski Menu/Game Over
    document.getElementById('btnContinue').addEventListener('click', () => {
        wrappedLoadConfig();
        loadGame(uiDataRef.savedGameState, gameStateRef, uiDataRef);
    });
    document.getElementById('btnRetry').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        devSettings.presetLoaded = false;
        resetDevTime();
        wrappedLoadConfig();
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
        gameStateRef.game.manualPause = false;
        if (gameStateRef.game.running && !gameStateRef.game.inMenu) {
            uiDataRef.savedGameState = saveGame(gameStateRef);
            wrappedShowMenu(true);
        } else {
            wrappedShowMenu(false);
        }
    });

    // Perk Picker
    window.wrappedPickPerk = (perk) => {
        pickPerk(perk, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    };
    btnContinueMaxLevel.addEventListener('click', () => {
        levelUpOverlay.style.display='none';
        pickPerk(null, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    });

    // Chest
    chestButton.addEventListener('click',() => {
        chestOverlay.style.display='none';
        if(uiDataRef.currentChestReward){
            const state = { game: gameStateRef.game, settings: gameStateRef.settings, weapons: gameStateRef.player.weapons, player: gameStateRef.player };
            uiDataRef.currentChestReward.apply(state, uiDataRef.currentChestReward);
            gameStateRef.perkLevels[uiDataRef.currentChestReward.id]=(gameStateRef.perkLevels[uiDataRef.currentChestReward.id]||0)+1;
            playSound('ChestReward');
        }
        uiDataRef.currentChestReward=null;
        resumeGame(gameStateRef.game, 0.75);
    });
    
    window.addEventListener('blur', () => {
        if (gameStateRef.game.running && !gameStateRef.game.paused && !gameStateRef.game.inMenu) {
            wrappedPauseGame();
        }
    });
}

export function initializeMainEvents(stateRef, uiRef) {
    gameStateRef = stateRef;
    uiDataRef = uiRef;
    
    window.wrappedShowMenu = wrappedShowMenu;
    window.wrappedPauseGame = wrappedPauseGame;
    window.wrappedResumeGame = wrappedResumeGame;
    window.wrappedGameOver = wrappedGameOver;
    window.wrappedLevelUp = wrappedLevelUp;
    window.wrappedOpenChest = wrappedOpenChest;
    window.wrappedLoadConfig = wrappedLoadConfig;
    window.wrappedStartRun = wrappedStartRun; 
    
    if (uiRef.gameData && uiDataRef.gameData.SIEGE_EVENT_CONFIG) {
        window.SIEGE_EVENT_CONFIG = uiRef.gameData.SIEGE_EVENT_CONFIG;
    }
    
    return {
        initEvents,
        wrappedLoadConfig,
        wrappedStartRun 
    };
}