// ==============
// EVENTMANAGER.JS (v0.90d - FIX: Użycie ui_game_title)
// Lokalizacja: /js/core/eventManager.js
// ==============

// Importy Menedżerów
import { showMenu, resetAll, pauseGame, resumeGame, gameOver, startRun } from '../ui/ui.js';
import { levelUp, pickPerk, openChest } from '../managers/levelManager.js';
import { saveGame, loadGame } from '../services/saveManager.js';
import { playSound } from '../services/audio.js';
import { setJoystickSide } from '../ui/input.js';
// POPRAWKA v0.76d: Import devSettings ORAZ resetDevTime
import { devSettings, resetDevTime } from '../services/dev.js';

// NOWY IMPORT v0.90: Silnik i18n
import { 
    getLang, setLanguage, getAvailableLanguages, getCurrentLanguage 
} from '../services/i18n.js';

// Import referencji DOM (potrzebne do eventów)
import {
    gameOverOverlay, pauseOverlay, levelUpOverlay, chestOverlay,
    btnContinueMaxLevel, chestButton, docTitle
} from '../ui/domElements.js';


// Przechowuje referencje ustawione podczas inicjalizacji
let gameStateRef = null;
let uiDataRef = null;

// --- Funkcje Wrapper (przeniesione z main.js) ---

function wrappedShowMenu(allowContinue = false) {
    uiDataRef.animationFrameId = uiDataRef.animationFrameId; // Użyj referencji
    uiDataRef.savedGameState = uiDataRef.savedGameState;
    showMenu(uiDataRef.game, wrappedResetAll, uiDataRef, allowContinue);
    
    // NOWA LINIA v0.90: Zawsze aktualizuj teksty przy pokazywaniu menu
    updateAllStaticText(); 
}

function wrappedResetAll() {
    // Przekazanie wszystkich referencji stanu do resetAll
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
    uiDataRef.trails = gameStateRef.trails;
    uiDataRef.confettis = gameStateRef.confettis;
    uiDataRef.camera = gameStateRef.camera; 
    
    // POPRAWKA v0.77: Zresetuj pierwszy interwał oblężenia
    // (Upewnijmy się, że SIEGE_EVENT_CONFIG jest dostępne globalnie, jeśli jest potrzebne)
    if (window.SIEGE_EVENT_CONFIG) {
        uiDataRef.settings.currentSiegeInterval = window.SIEGE_EVENT_CONFIG.SIEGE_EVENT_START_TIME;
    }
    
    resetAll(uiDataRef.canvas, uiDataRef.settings, uiDataRef.perkLevels, uiDataRef, uiDataRef.camera);
    
    gameStateRef.enemyIdCounter = 0;
    
    // Zaktualizuj referencje w uiData po resecie
    uiDataRef.animationFrameId = null;
    uiDataRef.lastTime = 0;
    uiDataRef.startTime = 0;
}

function wrappedPauseGame() {
    pauseGame(gameStateRef.game, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player);
    // NOWA LINIA v0.90: Przetłumacz ekran pauzy
    updateAllStaticText();
}

function wrappedResumeGame() {
    const resumeTime = uiDataRef.gameData?.UI_CONFIG?.RESUME_TIMER || 0.75;
    resumeGame(gameStateRef.game, resumeTime);
}

function wrappedLevelUp() {
    levelUp(gameStateRef.game, gameStateRef.player, gameStateRef.hitTextPool, gameStateRef.particlePool, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.perkLevels);
    // NOWA LINIA v0.90: Przetłumacz ekran level up
    updateAllStaticText();
}

function wrappedOpenChest() {
    // POPRAWKA v0.81c: Przekaż 'player' do openChest, aby umożliwić filtrowanie nagród
    openChest(gameStateRef.game, gameStateRef.perkLevels, uiDataRef, gameStateRef.player);
    // NOWA LINIA v0.90: Przetłumacz ekran skrzyni
    updateAllStaticText();
}

function wrappedGameOver() {
    uiDataRef.savedGameState = uiDataRef.savedGameState;
    gameOver(gameStateRef.game, uiDataRef);
    uiDataRef.savedGameState = null; // Zaktualizuj zapisany stan (na null)
    // NOWA LINIA v0.90: Przetłumacz ekran game over
    updateAllStaticText();
}

function wrappedStartRun() {
    // Ta funkcja *tylko* uruchamia logikę startu (która wywoła resetAll)
    startRun(gameStateRef.game, wrappedResetAll, uiDataRef); 
}

/**
 * NOWA FUNKCJA (v0.76e): Odczytuje konfigurację UI.
 * Ta funkcja musi być wywołana PRZED wrappedStartRun() lub loadGame().
 */
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
    
    console.log(`[DEBUG-v0.76e] js/core/eventManager.js: Konfiguracja UI odczytana (Labels: ${uiDataRef.pickupShowLabels})`);
}

// --- NOWE FUNKCJE i18n (v0.90) ---

/**
 * (NOWA FUNKCJA v0.90)
 * Dynamicznie buduje zawartość Przewodnika na podstawie aktywnego języka.
 */
function populateGuide() {
    const guide = document.getElementById('guideContent');
    if (!guide) return;

    // Definicje kluczy (dla łatwiejszego zarządzania)
    const pickups = ['heal', 'magnet', 'shield', 'speed', 'bomb', 'freeze', 'chest'];
    const enemies = ['standard', 'horde', 'aggressive', 'kamikaze', 'splitter', 'tank', 'ranged', 'elite', 'wall'];
    const hazards = ['hazard', 'megahazard'];
    const weapons = ['whip', 'autogun', 'orbital', 'nova', 'chainLightning'];
    const perks = ['firerate', 'damage', 'multishot', 'pierce', 'speed', 'pickup', 'health'];

    const h = (tag, content) => `<${tag}>${content}</${tag}>`;
    const p = (content) => h('p', content);
    const li = (content) => h('li', content);
    
    let html = '';

    // Wprowadzenie
    html += h('h4', getLang('ui_guide_title'));
    html += p(getLang('ui_guide_intro'));
    
    // Zasady
    html += h('h4', getLang('ui_guide_basics_title'));
    html += h('ul', 
        li(getLang('ui_guide_basics_1')) +
        li(getLang('ui_guide_basics_2')) +
        li(getLang('ui_guide_basics_3')) +
        li(getLang('ui_guide_basics_4')) +
        li(getLang('ui_guide_basics_5'))
    );

    // Pickupy
    html += h('h4', getLang('ui_guide_pickups_title'));
    html += h('ul', pickups.map(key => 
        li(`<strong>${getLang(`pickup_${key}_name`)}:</strong> ${getLang(`pickup_${key}_desc`)}`)
    ).join(''));

    // Wrogowie
    html += h('h4', getLang('ui_guide_enemies_title'));
    html += h('ul', enemies.map(key => 
        li(`<strong>${getLang(`enemy_${key}_name`)}:</strong> ${getLang(`enemy_${key}_desc`)}`)
    ).join(''));

    // Zagrożenia
    html += h('h4', getLang('ui_guide_hazards_title'));
    html += h('ul', hazards.map(key => 
        li(`<strong>${getLang(`enemy_${key}_name`)}:</strong> ${getLang(`enemy_${key}_desc`)}`)
    ).join(''));
    
    // Bronie
    html += h('h4', getLang('ui_guide_weapons_title'));
    html += h('ul', weapons.map(key => 
        li(`<strong>${getLang(`perk_${key}_name`)}:</strong> ${getLang(`perk_${key}_desc`)}`)
    ).join(''));

    // Perki
    html += h('h4', getLang('ui_guide_perks_title'));
    html += h('ul', perks.map(key => 
        li(`<strong>${getLang(`perk_${key}_name`)}:</strong> ${getLang(`perk_${key}_desc`)}`)
    ).join(''));

    guide.innerHTML = html;
}

/**
 * (NOWA FUNKCJA v0.90)
 * Tłumaczy wszystkie statyczne elementy UI na podstawie ID.
 */
function updateAllStaticText() {
    const lang = getCurrentLanguage();
    
    // Słownik ID -> Klucz Językowy
    const idMap = {
        // Tytuły
        'docTitle': 'ui_game_title', // POPRAWKA v0.90c
        'title': 'ui_game_title', // POPRAWKA v0.90c
        
        // HUD
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
        
        // Tablica Wyników (wspólna dla Menu i Game Over)
        'btnClearScoresMenu': 'ui_scores_clear',
        'scoresTitleMenu': 'ui_scores_title',
        'scoresRankMenu': 'ui_scores_col_rank',
        'scoresScoreMenu': 'ui_scores_col_score',
        'scoresLevelMenu': 'ui_scores_col_level',
        'scoresTimeMenu': 'ui_scores_col_time',
        
        'btnClearScoresGO': 'ui_scores_clear',
        'scoresTitleGO': 'ui_scores_title',
        'scoresRankGO': 'ui_scores_col_rank',
        'scoresScoreGO': 'ui_scores_col_score',
        'scoresLevelGO': 'ui_scores_col_level',
        'scoresTimeGO': 'ui_scores_col_time',
        
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
        
        // Level Up
        'levelUpTitle': 'ui_levelup_title',
        'btnContinueMaxLevel': 'ui_levelup_max',
        'levelUpStatsTitle': 'ui_levelup_stats',
        
        // Pauza
        'pauseTitle': 'ui_pause_title',
        'pauseText': 'ui_pause_text',
        'btnResume': 'ui_pause_resume',
        'btnPauseMenu': 'ui_pause_menu',
        'pauseStatsTitle': 'ui_levelup_stats', // (Używa tego samego klucza co levelup)
        
        // Wznowienie
        'resumeTitle': 'ui_resume_text', // (Tymczasowo, zaraz zostanie nadpisane)
        
        // Skrzynia
        'chestTitle': 'ui_chest_title',
        'chestButton': 'ui_chest_button',
        
        // Game Over
        'gameOverTitle': 'ui_gameover_title',
        'gameOverScoreLabel': 'ui_gameover_score',
        'gameOverLevelLabel': 'ui_gameover_level',
        'gameOverTimeLabel': 'ui_gameover_time',
        'btnRetry': 'ui_gameover_retry',
        'btnMenu': 'ui_gameover_menu',
        
        // Modal Potwierdzenia
        'confirmTitle': 'ui_confirm_title',
        'btnConfirmYes': 'ui_confirm_yes',
        'btnConfirmNo': 'ui_confirm_no',
    };

    // Tłumacz elementy
    for (const [id, key] of Object.entries(idMap)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = getLang(key);
        } else {
            // Obsłuż specjalny przypadek tytułu dokumentu
            if (id === 'docTitle' && docTitle) {
                // Do tytułu strony dodajemy też wersję
                docTitle.textContent = `${getLang(key)} v${uiDataRef.VERSION || '0.90'}`;
            }
        }
    }
    
    // Tłumacz teksty, które nie są 'textContent'
    const prompt = document.getElementById('confirmText');
    if (prompt) prompt.textContent = getLang('ui_confirm_clear_scores');
    
    // Zaktualizuj Przewodnik
    populateGuide();
}

/**
 * (NOWA FUNKCJA v0.90c)
 * Buduje przełącznik języka (radio buttons) w menu konfiguracji.
 */
function buildLanguageSelector() {
    const container = document.getElementById('lang-selector-container');
    if (!container) return;
    
    container.innerHTML = ''; // Wyczyść
    const availableLangs = getAvailableLanguages();
    const currentLang = getCurrentLanguage();
    
    availableLangs.forEach(langName => {
        const label = document.createElement('label');
        label.className = 'option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'lang';
        input.value = langName;
        
        if (langName === currentLang) {
            input.checked = true;
        }
        
        // Zmień język i przetłumacz wszystko od razu
        input.onchange = () => {
            setLanguage(langName);
            updateAllStaticText(); 
        };
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${langName}`)); // (Dodaj spację)
        container.appendChild(label);
    });
}


/**
 * Inicjalizuje wszystkie eventy (przeniesione z main.js)
 */
function initEvents() {
    // === NOWA INICJALIZACJA i18n (v0.90) ===
    // Zbuduj przełącznik języka i przetłumacz UI po raz pierwszy
    buildLanguageSelector();
    updateAllStaticText(); 
    // === Koniec i18n ===

    // === Przycisk Start/Continue ===
    document.getElementById('btnStart').addEventListener('click', () => {
        // 1. Zresetuj flagi deweloperskie (pełny reset)
        devSettings.presetLoaded = false;
        resetDevTime(); 
        // 2. Wczytaj konfigurację UI
        wrappedLoadConfig();
        // 3. Uruchom grę (co wywoła resetAll)
        wrappedStartRun();
    });

    // === Listenery dla dynamicznie ładowanych elementów (Konfiguracja) ===
    const chkShake = document.getElementById('chkShake');
    if (chkShake) {
        chkShake.addEventListener('change', () => {
            gameStateRef.game.screenShakeDisabled = !chkShake.checked;
        });
    }

    const chkFPS = document.getElementById('chkFPS');
    if (chkFPS) {
        chkFPS.addEventListener('change', () => {
            uiDataRef.showFPS = !!chkFPS.checked;
        });
    }
    
    document.querySelectorAll('input[name="fpspos"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                uiDataRef.fpsPosition = e.target.value;
            }
        });
    });

    const chkLabels = document.getElementById('chkPickupLabels');
    if (chkLabels) {
        chkLabels.addEventListener('change', () => {
            uiDataRef.pickupShowLabels = !!chkLabels.checked;
        });
    }
    
    document.querySelectorAll('input[name="pickupstyle"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                uiDataRef.pickupStyleEmoji = e.target.value === 'emoji';
            }
        });
    });


    // Logika Menedżera Zapisu
    document.getElementById('btnContinue').addEventListener('click', () => {
        // 1. Wczytaj konfigurację UI (na wypadek zmian)
        wrappedLoadConfig();
        // 2. Wczytaj stan gry (to NIE wywołuje resetAll)
        loadGame(uiDataRef.savedGameState, gameStateRef, uiDataRef);
    });

    document.getElementById('btnRetry').addEventListener('click', () => {
        gameOverOverlay.style.display='none';
        // 1. Zresetuj flagi deweloperskie (pełny reset)
        devSettings.presetLoaded = false;
        resetDevTime();
        // 2. Wczytaj konfigurację UI
        wrappedLoadConfig();
        // 3. Uruchom grę (co wywoła resetAll)
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

    // Eventy Menedżera Poziomów
    window.wrappedPickPerk = (perk) => {
        pickPerk(perk, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    };

    btnContinueMaxLevel.addEventListener('click', () => {
        levelUpOverlay.style.display='none';
        pickPerk(null, gameStateRef.game, gameStateRef.perkLevels, gameStateRef.settings, gameStateRef.player.weapons, gameStateRef.player, resumeGame); 
    });

    chestButton.addEventListener('click',() => {
        chestOverlay.style.display='none';
        if(uiDataRef.currentChestReward){
            // POPRAWKA v0.81c: Upewnij się, że obiekt 'state' zawiera 'player'
            const state = { game: gameStateRef.game, settings: gameStateRef.settings, weapons: gameStateRef.player.weapons, player: gameStateRef.player };
            uiDataRef.currentChestReward.apply(state, uiDataRef.currentChestReward);
            
            gameStateRef.perkLevels[uiDataRef.currentChestReward.id]=(gameStateRef.perkLevels[uiDataRef.currentChestReward.id]||0)+1;
            playSound('ChestReward');
        }
        uiDataRef.currentChestReward=null;
        resumeGame(gameStateRef.game, 0.75);
    });
    
    // NOWA LOGIKA v0.77: Pauza przy utracie fokusu
    window.addEventListener('blur', () => {
        if (gameStateRef.game.running && !gameStateRef.game.paused && !gameStateRef.game.inMenu) {
            console.log("[EVENT] Wykryto utratę fokusu, pauzuję grę.");
            wrappedPauseGame();
        }
    });
}

/**
 * Główny punkt wejścia dla Menedżera Eventów.
 */
export function initializeMainEvents(stateRef, uiRef) {
    gameStateRef = stateRef;
    uiDataRef = uiRef;
    
    // Zapewnij dostęp globalny do wrapperów
    window.wrappedShowMenu = wrappedShowMenu;
    window.wrappedPauseGame = wrappedPauseGame;
    window.wrappedResumeGame = wrappedResumeGame;
    window.wrappedGameOver = wrappedGameOver;
    window.wrappedLevelUp = wrappedLevelUp;
    window.wrappedOpenChest = wrappedOpenChest;
    
    // POPRAWKA v0.76e: Eksportuj nowe, rozdzielone funkcje
    window.wrappedLoadConfig = wrappedLoadConfig;
    window.wrappedStartRun = wrappedStartRun; 
    
    // Import SIEGE_EVENT_CONFIG (potrzebny do wrappedResetAll)
    if (uiRef.gameData && uiDataRef.gameData.SIEGE_EVENT_CONFIG) {
        window.SIEGE_EVENT_CONFIG = uiRef.gameData.SIEGE_EVENT_CONFIG;
    }
    
    return {
        initEvents,
        // Zwróć obie funkcje, aby main.js mógł je przekazać do dev.js
        wrappedLoadConfig: wrappedLoadConfig,
        wrappedStartRun: wrappedStartRun 
    };
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.81c] js/core/eventManager.js: Zweryfikowano przekazanie "player" do openChest i applyPerk (Chest).');