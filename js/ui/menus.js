// ==============
// MENUS.JS (v1.26h - Layout Restore & Full Code)
// Lokalizacja: /js/ui/menus.js
// ==============

import { getLang, setLanguage, getAvailableLanguages, getCurrentLangCode } from '../services/i18n.js';
import { playSound, setMusicVolume, setSfxVolume } from '../services/audio.js';
import { get as getAsset } from '../services/assets.js';
import { setJoystickSide, getGamepadButtonState, pollGamepad } from './input.js';
import { initLeaderboardUI } from './leaderboardUI.js'; 
import { VERSION } from '../config/version.js';
import { MUSIC_CONFIG, SKINS_CONFIG } from '../config/gameData.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { getUnlockedSkins, unlockSkin, setCurrentSkin, getCurrentSkin } from '../services/skinManager.js'; 

let currentJoyMode = 'right';

// === GAMEPAD NAVIGATION STATE ===
let lastGpState = {};
let navCooldown = 0;
let focusedElement = null;

const STATIC_TRANSLATION_MAP = {
    'btnStart': 'ui_menu_start', 
    'btnContinue': 'ui_menu_continue', 
    'navScores': 'ui_scores_title', 
    'navConfig': 'ui_menu_tab_config', 
    'navGuide': 'ui_menu_tab_guide', 
    'btnReplayIntroMain': 'ui_menu_replay_intro',
    'navDev': 'ui_menu_tab_dev', 
    'navCoffee': 'ui_coffee_title',

    'configTitleMain': 'ui_config_title_game',
    'lblNick': 'ui_config_nick',
    'lblSkin': 'ui_config_skin',
    'lblTutorial': 'ui_config_tutorial',
    'btnShowTutorialConfig': 'ui_config_tutorial_btn',
    
    'lblJoy': 'ui_config_joystick', 
    'lblHyper': 'ui_config_hyper',
    'lblShake': 'ui_config_shake', 
    'lblFPS': 'ui_config_fps', 
    'lblLabels': 'ui_config_labels',
    'lblMusic': 'ui_config_music', 
    'lblSFX': 'ui_config_sfx', 
    'lblLang': 'ui_config_title_lang',
    
    'coffeeTitle': 'ui_coffee_title', 
    'coffeeDesc': 'ui_coffee_desc', 
    'coffeeBtn': 'ui_coffee_btn', 
    'coffeeFooter': 'ui_coffee_footer',
    'lblSupporters': 'ui_coffee_supporters_header',
    
    'resumeOverlayTitle': 'ui_ready_title', 
    'scoresTitle': 'ui_scores_title', 
    'btnClearScoresMenu': 'ui_scores_clear_local',
    'btnClearScoresGO': 'ui_scores_clear_local',
    'scoresEmptyMsg': 'ui_chest_empty_title', 
    'guideTitle': 'ui_guide_title',

    'devTitle': 'ui_dev_title', 
    'devLblPresets': 'ui_dev_label_presets', 
    'devLblScenarios': 'ui_dev_label_scenarios',
    'devLblPlayer': 'ui_dev_label_player', 
    'btnDevApply': 'ui_dev_btn_apply', 
    'btnDevPeaceful': 'ui_dev_btn_peaceful',
    
    'devBtnStd': 'enemy_standard_name', 
    'devBtnHorde': 'enemy_horde_name', 
    'devBtnRng': 'enemy_ranged_name',
    'devBtnTank': 'enemy_tank_name', 
    'devBtnSplit': 'enemy_splitter_name', 
    'devBtnTroll': 'enemy_kamikaze_name',
    'devBtnWall': 'enemy_wall_name', 
    'devBtnBoss': 'enemy_elite_name', 
    'devBtnAgr': 'enemy_aggressive_name',
    'devBtnMin': 'ui_dev_scen_min', 
    'devBtnHigh': 'ui_dev_scen_high', 
    'devBtnMax': 'ui_dev_scen_max',
    
    'lblDevLvl': 'ui_stat_level', 
    'lblDevHp': 'ui_stat_health', 
    'lblDevXp': 'ui_hud_xp_name',
    'lblDevGod': 'ui_dev_god', 
    'lblDevHit': 'ui_dev_hitbox',

    'pauseTitle': 'ui_pause_title', 
    'btnResume': 'ui_pause_resume', 
    'btnPauseMenu': 'ui_pause_menu',
    'levelUpTitle': 'ui_levelup_title', 
    'levelUpStatsTitle': 'ui_levelup_stats', 
    'chestTitle': 'ui_chest_title', 
    'chestButton': 'ui_chest_button', 
    'gameOverTitle': 'ui_gameover_title', 
    'btnRetry': 'ui_gameover_retry', 
    'btnMenu': 'ui_gameover_menu', 
    'confirmTitle': 'ui_confirm_title', 
    'confirmText': 'ui_confirm_clear_scores', 
    'btnConfirmYes': 'ui_confirm_yes', 
    'btnConfirmNo': 'ui_confirm_no',
    
    'btnIntroPrev': 'ui_intro_prev', 
    'btnIntroNext': 'ui_intro_next', 
    'btnIntroSkip': 'ui_intro_skip',
    
    'lblNickTitle': 'ui_nick_modal_title',
    'lblNickText': 'ui_nick_modal_text',
    'btnConfirmNick': 'ui_nick_modal_confirm',
    'btnCancelNick': 'ui_nick_modal_cancel',
    
    'lblNickLimit': 'ui_nick_limit_info',
    'lblNickLimitConfig': 'ui_nick_limit_info',

    'lblGOScore': 'ui_gameover_score_label',
    'lblGOTime': 'ui_gameover_time_label',
    'lblGOLevel': 'ui_gameover_level_label',
    'lblGOKills': 'ui_gameover_kills_label',
    
    'tabLocalScores': 'ui_scores_local',
    'tabOnlineScores': 'ui_scores_online',
    'tabGOLocal': 'ui_scores_local',
    'tabGOOnline': 'ui_scores_online',
    'tabStats': 'ui_tab_stats'
};

export function updateStaticTranslations() {
    for (const [id, key] of Object.entries(STATIC_TRANSLATION_MAP)) {
        const el = document.getElementById(id);
        if (el) {
            const text = getLang(key);
            if (text && !text.startsWith('[')) {
                if (text.includes('<') && text.includes('>')) {
                    el.innerHTML = text;
                } else {
                    el.innerText = text;
                }
            }
        }
    }
    
    const btnScores = document.getElementById('navScores');
    if (btnScores && getCurrentLangCode() === 'pl') {
        btnScores.innerText = "KRONIKI POLEGŁYCH";
    }
    
    const btnSubmit = document.getElementById('btnSubmitScore');
    if(btnSubmit && btnSubmit.style.display !== 'none' && btnSubmit.textContent !== getLang('ui_gameover_sent')) {
        btnSubmit.textContent = getLang('ui_gameover_submit') || "WYŚLIJ WYNIK";
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const period = btn.dataset.period; 
        if (period) {
            const key = `ui_filter_${period}`;
            const txt = getLang(key);
            if (txt) btn.innerText = txt;
        }
    });
    
    updateTutorialTexts();
    updateFlagHighlights();
    
    const backText = getLang('ui_nav_back') || 'POWRÓT';
    document.querySelectorAll('.nav-back').forEach(el => el.innerText = backText);

    const headers = document.querySelectorAll('#retroScoreTable th, #goScoreTable th');
    if (headers.length > 0) {
        headers.forEach((th, index) => {
            const mod = index % 7; 
            if (mod === 0) th.innerText = getLang('ui_scores_col_rank');
            if (mod === 1) th.innerText = getLang('ui_scores_col_nick');
            if (mod === 2) th.innerText = getLang('ui_scores_col_score');
            if (mod === 3) th.innerText = getLang('ui_scores_col_kills');
            if (mod === 4) th.innerText = getLang('ui_scores_col_level');
            if (mod === 5) th.innerText = getLang('ui_scores_col_time');
            if (mod === 6) th.innerText = getLang('ui_scores_col_date');
        });
    }
    
    const pageTitle = getLang('ui_game_title');
    if (pageTitle) document.title = `${pageTitle} v${VERSION}`;

    if (document.getElementById('view-guide') && document.getElementById('view-guide').classList.contains('active')) {
        generateGuide();
    }
    
    updateJoystickToggleLabel();
    updateToggleLabels();
    
    updateMainMenuStats();
}

function updateFlagHighlights() {
    const currentLang = getCurrentLangCode();
    
    ['btnLangPL', 'btnLangEN', 'btnLangRO'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.transform = 'scale(1.0)';
            btn.style.filter = 'drop-shadow(2px 2px 0 #000) grayscale(0.5)';
            btn.style.outline = 'none';
            btn.style.boxShadow = 'none';

            const isActive = id.endsWith(currentLang.toUpperCase());
            const isFocused = btn.classList.contains('focused');

            if (isActive || isFocused) {
                btn.style.border = '2px solid #FFD700';
                btn.style.borderRadius = '50%';
                btn.style.transform = 'scale(1.2)';
                btn.style.filter = 'drop-shadow(2px 2px 0 #000) grayscale(0)';
            } else {
                btn.style.border = 'none';
            }
        }
    });
}

function updateTutorialTexts() {
    const tutTitle = document.getElementById('tutTitle');
    const tutIntro = document.getElementById('tutIntro');
    const tutList = document.getElementById('tutList');
    const btnClose = document.getElementById('btnCloseTutorial');
    
    if (tutTitle) tutTitle.textContent = getLang('ui_tutorial_title');
    if (tutIntro) tutIntro.textContent = getLang('ui_tutorial_intro');
    if (btnClose) btnClose.textContent = getLang('ui_tutorial_btn_close');
    
    if (tutList) {
        tutList.innerHTML = `
            <li style="margin-bottom:12px;"><b>${getLang('ui_tutorial_ctrl_title')}</b><br>${getLang('ui_tutorial_ctrl_desc')}</li>
            <li style="margin-bottom:12px;"><b>${getLang('ui_tutorial_hunger_title')}</b><br>${getLang('ui_tutorial_hunger_desc')}</li>
            <li style="margin-bottom:12px;"><b>${getLang('ui_tutorial_prog_title')}</b><br>${getLang('ui_tutorial_prog_desc')}</li>
            <li><b>${getLang('ui_tutorial_boss_title')}</b><br>${getLang('ui_tutorial_boss_desc')}</li>
        `;
    }
}

function updateJoystickToggleLabel() {
    const btn = document.getElementById('toggleJoy');
    if(!btn) return;
    let label = "JOY";
    if (currentJoyMode === 'left') label = getLang('ui_config_joy_left');
    else if (currentJoyMode === 'right') label = getLang('ui_config_joy_right');
    else if (currentJoyMode === 'off') label = getLang('ui_config_joy_off');
    btn.textContent = label;
}

function updateToggleLabels() {
    const onTxt = getLang('ui_on') || "WŁ";
    const offTxt = getLang('ui_off') || "WYŁ";
    document.querySelectorAll('.retro-toggle').forEach(btn => {
        if(btn.id !== 'toggleJoy') {
            if (btn.classList.contains('on')) btn.textContent = onTxt;
            else if (btn.classList.contains('off')) btn.textContent = offTxt;
        }
    });
}

function initLanguageSelector() {
    const container = document.getElementById('lang-selector-container');
    if (!container) return;
    
    const langs = getAvailableLanguages();
    const current = getCurrentLangCode();
    
    container.innerHTML = '';
    
    langs.forEach(lang => {
        const label = document.createElement('label');
        label.style.marginRight = '15px';
        label.style.cursor = 'pointer';
        label.tabIndex = 0; 
        label.className = 'lang-label-wrapper';
        
        if (lang.code === current) {
            label.style.color = '#FFD700'; 
            label.style.fontWeight = 'bold';
        }

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'lang-select';
        radio.value = lang.code;
        radio.checked = (lang.code === current);
        radio.tabIndex = -1;
        
        label.onclick = () => {
            radio.checked = true;
            setLanguage(lang.code);
            updateStaticTranslations();
            initLanguageSelector(); 
            playSound('Click');
            
            setTimeout(() => {
                const newContainer = document.getElementById('lang-selector-container');
                if (newContainer) {
                    const newRadio = newContainer.querySelector(`input[value="${lang.code}"]`);
                    if (newRadio && newRadio.parentElement) {
                        const newLabel = newRadio.parentElement;
                        document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
                        focusedElement = newLabel;
                        newLabel.classList.add('focused');
                        newLabel.focus();
                    }
                }
            }, 0);
        };
        
        const span = document.createElement('span');
        span.textContent = ` ${lang.name}`;
        
        label.appendChild(radio);
        label.appendChild(span);
        container.appendChild(label);
    });
}

async function fetchSupporters(retries = 3) {
    const listContainer = document.getElementById('supportersList');
    if (!listContainer) return;
    
    const lastFetch = sessionStorage.getItem('suppi_last_fetch');
    const cachedData = sessionStorage.getItem('suppi_data');
    if (lastFetch && cachedData && (Date.now() - lastFetch < 300000)) {
        listContainer.innerHTML = cachedData;
        return;
    }

    listContainer.innerHTML = '<span class="pulse">Łączenie z Suppi...</span>';

    const suppiUrl = 'https://suppi.pl/gregor'; 
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(suppiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Proxy error");
        
        const data = await response.json();
        if (!data.contents) throw new Error("Brak danych");

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');

        const rows = doc.querySelectorAll('.contributor-row');
        
        let html = '';
        
        if (rows.length === 0) {
             html = '<div style="color:#888; font-style:italic; margin-top:10px;">Brak widocznych wpłat na profilu.<br>Zostań pierwszym Mecenasem!</div>';
        } else {
            html = '<ul style="list-style:none; padding:0; margin:0; width:100%;">';
            
            rows.forEach((row) => {
                const nameEl = row.querySelector('.fund-contributor-name .wrap-ellipsis');
                const name = nameEl ? nameEl.innerText.trim() : "Anonim";
                
                const dataEls = row.querySelectorAll('.fund-contributor-data');
                
                let amount = "Darowizna";
                let timeAgo = "";
                
                if (dataEls.length > 0) amount = dataEls[0].innerText.trim();
                if (dataEls.length > 1) timeAgo = dataEls[1].innerText.trim();

                html += `
                    <li style="margin-bottom:8px; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="text-align:left;">
                            <span style="color:#4CAF50; font-weight:bold; display:block;">${name}</span>
                            <span style="font-size:0.8em; color:#666;">${timeAgo}</span>
                        </div>
                        <span style="color:#FFD700; font-weight:bold; font-size:1.1em;">${amount}</span>
                    </li>
                `;
            });
            html += '</ul>';
        }

        listContainer.innerHTML = html;
        sessionStorage.setItem('suppi_data', html);
        sessionStorage.setItem('suppi_last_fetch', Date.now());

    } catch (e) {
        console.warn("Suppi fetch failed, retrying...", retries);
        if (retries > 0) {
            setTimeout(() => fetchSupporters(retries - 1), 1000); 
        } else {
            listContainer.innerHTML = '<div style="color:#D32F2F; font-size:0.9em;">Błąd pobierania listy.<br>Spróbuj ponownie później.</div>';
        }
    }
}

export function switchView(viewId) {
    document.querySelectorAll('.menu-view').forEach(el => { el.classList.remove('active'); });
    const target = document.getElementById(viewId);
    if (target) { target.classList.add('active'); playSound('Click'); }
    
    focusedElement = null;
    document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
    
    if (viewId === 'view-coffee') {
        playSound('MusicIntro'); 
        fetchSupporters(); 
    }
    else if (viewId === 'view-main') {
        playSound('MusicMenu');
        updateFlagHighlights(); 
        
        setTimeout(() => {
            const btnStart = document.getElementById('btnStart');
            if (btnStart) {
                document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
                focusedElement = btnStart;
                btnStart.classList.add('focused');
                btnStart.focus(); 
            }
        }, 50);
    }

    if (viewId === 'view-scores') {
        if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard();
        setTimeout(() => { updateStaticTranslations(); }, 100);
    }
    if (viewId === 'view-guide') { 
        generateGuide(); 
    }
    if (viewId === 'view-config') {
        generateSkinSelector();
        initLanguageSelector(); 
    }
    if (viewId === 'view-main') {
        updateMainMenuStats();
    }
}

async function updateMainMenuStats() {
    const lblPlayers = document.getElementById('lblMainPlayers');
    const valPlayers = document.getElementById('valMainPlayers');
    const lblGames = document.getElementById('lblMainGames');
    const valGames = document.getElementById('valMainGames');
    
    if (!lblPlayers || !valPlayers || !lblGames || !valGames) return;
    
    lblPlayers.textContent = (getLang('stat_unique_players') || 'GRACZY') + ':';
    lblGames.textContent = (getLang('stat_games_played') || 'GIER') + ':';
    
    const stats = await LeaderboardService.getGlobalStats();
    
    if (stats.unique_players !== undefined) {
        valPlayers.textContent = stats.unique_players.toLocaleString();
    } else {
        valPlayers.textContent = "...";
    }
    
    if (stats.games_played !== undefined) {
        valGames.textContent = stats.games_played.toLocaleString();
    } else {
        valGames.textContent = "...";
    }
}

function updateToggleVisual(btn, isOn) {
    const onTxt = getLang('ui_on') || "WŁ";
    const offTxt = getLang('ui_off') || "WYŁ";
    if (isOn) { btn.textContent = onTxt; btn.className = "retro-toggle on"; } else { btn.textContent = offTxt; btn.className = "retro-toggle off"; }
}

function generateSkinSelector() {
    const container = document.getElementById('skinSelector');
    if (!container) return;

    container.innerHTML = '';
    const unlocked = getUnlockedSkins();
    const current = getCurrentSkin();

    SKINS_CONFIG.forEach(skin => {
        const option = document.createElement('div');
        option.className = 'skin-option';
        option.tabIndex = 0; 
        
        const isLocked = skin.locked && !unlocked.includes(skin.id);
        const isSelected = (skin.id === current);

        if (isLocked) option.classList.add('locked');
        if (isSelected) option.classList.add('selected');

        const asset = getAsset(skin.assetIdle);
        const img = document.createElement('img');
        if (asset) img.src = asset.src;
        else img.alt = skin.name;

        option.appendChild(img);

        option.onclick = () => {
            if (isLocked) {
                playSound('Click');
                switchView('view-coffee');
            } else {
                setCurrentSkin(skin.id);
                playSound('Click');
                generateSkinSelector(); 
            }
        };

        option.title = isLocked ? "ZABLOKOWANE (Kliknij aby zobaczyć jak odblokować)" : skin.name;

        container.appendChild(option);
    });
}

function getFocusableElements() {
    const overlays = ['gameOverOverlay', 'levelUpOverlay', 'pauseOverlay', 'introOverlay', 'confirmOverlay', 'nickInputOverlay'];
    
    for (const ovId of overlays) {
        const ov = document.getElementById(ovId);
        if (ov && ov.style.display !== 'none' && ov.style.display !== '') {
             return Array.from(ov.querySelectorAll('button:not([disabled]), input:not([type="radio"]), .perk, .skin-option, .lang-label-wrapper'));
        }
    }
    
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay && menuOverlay.style.display !== 'none') {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView) {
            const all = Array.from(activeView.querySelectorAll('button:not([disabled]), input:not([type="radio"]), .perk, .skin-option, .lang-label-wrapper'));
            const flags = all.filter(el => el.id && el.id.startsWith('btnLang'));
            const others = all.filter(el => !el.id || !el.id.startsWith('btnLang'));
            return [...others, ...flags];
        }
    }
    
    return [];
}

function isGameplayActive() {
    const menuOverlay = document.getElementById('menuOverlay');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const levelUpOverlay = document.getElementById('levelUpOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const introOverlay = document.getElementById('introOverlay');
    const chestOverlay = document.getElementById('chestOverlay');
    
    if (menuOverlay && menuOverlay.style.display !== 'none') return false;
    if (pauseOverlay && pauseOverlay.style.display !== 'none') return false;
    if (levelUpOverlay && levelUpOverlay.style.display !== 'none') return false;
    if (gameOverOverlay && gameOverOverlay.style.display !== 'none') return false;
    if (introOverlay && introOverlay.style.display !== 'none') return false;
    if (chestOverlay && chestOverlay.style.display !== 'none') return false;
    
    return true;
}

function updateGamepadMenu() {
    navCooldown--;
    if (navCooldown > 0) return;

    const gpState = getGamepadButtonState();
    if (Object.keys(gpState).length === 0) return;

    if (gpState.A && !lastGpState.A) {
        const splash = document.getElementById('splashOverlay');
        if (splash && splash.style.display !== 'none' && !splash.classList.contains('fade-out')) {
             splash.classList.add('fade-out'); 
             setTimeout(() => { splash.style.display = 'none'; }, 1000); 
             const evt = new Event('touchstart');
             document.dispatchEvent(evt);
             navCooldown = 30; 
             return;
        }
    }

    if (gpState.Start && !lastGpState.Start) {
        if (isGameplayActive()) {
            const event = new KeyboardEvent('keydown', {'key': 'Escape'});
            document.dispatchEvent(event);
            navCooldown = 15;
            return;
        }
    }

    if (isGameplayActive()) return;

    const focusables = getFocusableElements();
    if (focusables.length === 0) return;

    const menuOverlay = document.getElementById('menuOverlay');
    const viewMain = document.getElementById('view-main');
    if (menuOverlay.style.display !== 'none' && viewMain.classList.contains('active')) {
        if (!focusedElement || !focusables.includes(focusedElement)) {
             const btnStart = document.getElementById('btnStart');
             if(btnStart) {
                 focusedElement = btnStart;
                 btnStart.classList.add('focused');
             }
        }
    } else {
        if (!focusedElement || !focusables.includes(focusedElement)) {
            const current = document.querySelector('.focused');
            if (current && focusables.includes(current)) {
                focusedElement = current;
            } else {
                focusedElement = focusables[0];
                if(focusedElement) focusedElement.classList.add('focused');
            }
        }
    }

    const rawGp = pollGamepad();
    let moveDir = { up: false, down: false, left: false, right: false };

    if (gpState.Up) moveDir.up = true;
    if (gpState.Down) moveDir.down = true;
    if (gpState.Left) moveDir.left = true;
    if (gpState.Right) moveDir.right = true;

    if (rawGp && rawGp.axes) {
        if (rawGp.axes[1] < -0.5) moveDir.up = true;
        if (rawGp.axes[1] > 0.5) moveDir.down = true;
        if (rawGp.axes[0] < -0.5) moveDir.left = true;
        if (rawGp.axes[0] > 0.5) moveDir.right = true;
        if (rawGp.axes.length >= 4) {
            const scrollY = rawGp.axes[3];
            if (Math.abs(scrollY) > 0.2) {
                const activeView = document.querySelector('.menu-view.active');
                if (activeView) {
                    const scrollBox = activeView.querySelector('.retro-scroll-box, .config-list, .menu-list');
                    if (scrollBox) scrollBox.scrollTop += scrollY * 15;
                }
            }
        }
    }

    let index = focusables.indexOf(focusedElement);
    let moved = false;

    if (moveDir.down || moveDir.right) {
        index++;
        if (index >= focusables.length) index = 0;
        moved = true;
    } else if (moveDir.up || moveDir.left) {
        index--;
        if (index < 0) index = focusables.length - 1;
        moved = true;
    } 

    if (moved) {
        if (focusedElement) {
            focusedElement.classList.remove('focused');
            focusedElement.blur(); 
        }
        focusedElement = focusables[index];
        if (focusedElement) {
            focusedElement.classList.add('focused');
            focusedElement.focus();
            focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            playSound('Click'); 
            updateFlagHighlights();
        }
        navCooldown = 12; 
    }

    if (gpState.A && !lastGpState.A) {
        if (focusedElement) {
            const el = focusedElement;
            if (el.id === 'btnLangPL') { setLanguage('pl'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangEN') { setLanguage('en'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangRO') { setLanguage('ro'); updateStaticTranslations(); playSound('Click'); }
            else {
                el.focus(); 
                el.click();
            }
        }
        navCooldown = 15;
    }
    
    if (gpState.B && !lastGpState.B) {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView && activeView.id !== 'view-main') {
            const backBtn = activeView.querySelector('.nav-back');
            if (backBtn) backBtn.click();
        }
        navCooldown = 15;
    }

    lastGpState = { ...gpState };
}

setInterval(updateGamepadMenu, 16); 

export function initRetroToggles(game, uiData) {
    const setupToggle = (btnId, chkId, callback) => {
        const btn = document.getElementById(btnId);
        const chk = document.getElementById(chkId);
        if(btn && chk) {
            btn.addEventListener('click', () => {
                chk.checked = !chk.checked;
                updateToggleVisual(btn, chk.checked);
                playSound('Click');
                if(callback) callback();
            });
        }
    };

    setupToggle('toggleHyper', 'chkHyper');
    setupToggle('toggleShake', 'chkShake', () => { game.screenShakeDisabled = !document.getElementById('chkShake').checked; });
    setupToggle('toggleFPS', 'chkFPS', () => { uiData.showFPS = !!document.getElementById('chkFPS').checked; });
    setupToggle('toggleLabels', 'chkPickupLabels', () => { uiData.pickupShowLabels = !!document.getElementById('chkPickupLabels').checked; });
    
    const hyperBtn = document.getElementById('toggleHyper'); if(hyperBtn) updateToggleVisual(hyperBtn, game.hyper);
    const shakeBtn = document.getElementById('toggleShake'); if(shakeBtn) updateToggleVisual(shakeBtn, !game.screenShakeDisabled);
    const fpsBtn = document.getElementById('toggleFPS'); if(fpsBtn) updateToggleVisual(fpsBtn, uiData.showFPS);
    const lblBtn = document.getElementById('toggleLabels'); if(lblBtn) updateToggleVisual(lblBtn, uiData.pickupShowLabels);

    const joyBtn = document.getElementById('toggleJoy');
    if(joyBtn) {
        const joyOpts = ['right', 'left', 'off'];
        let joyIdx = 0;
        updateStaticTranslations(); 
        joyBtn.addEventListener('click', () => {
            joyIdx = (joyIdx + 1) % joyOpts.length;
            currentJoyMode = joyOpts[joyIdx]; 
            updateStaticTranslations();
            setJoystickSide(currentJoyMode);
            playSound('Click');
        });
    }

    const coffeeBtn = document.getElementById('coffeeBtn');
    if (coffeeBtn) {
        coffeeBtn.addEventListener('click', () => {
            playSound('Click');
            setTimeout(() => {
                unlockSkin('hot');
                playSound('ChestReward'); 
            }, 2000);
        });
    }

    const volMusic = document.getElementById('volMusic');
    if (volMusic) { 
        volMusic.oninput = (e) => { const val = parseInt(e.target.value) / 100; setMusicVolume(val); }; 
    }
    const volSFX = document.getElementById('volSFX');
    if (volSFX) { volSFX.oninput = (e) => { const val = parseInt(e.target.value) / 100; setSfxVolume(val); }; }
    
    const btnPL = document.getElementById('btnLangPL');
    const btnEN = document.getElementById('btnLangEN');
    const btnRO = document.getElementById('btnLangRO');

    const doSwitch = (lang) => {
        setLanguage(lang);
        updateStaticTranslations();
        initLanguageSelector(); 
        playSound('Click');
    };

    if(btnPL) btnPL.onclick = () => doSwitch('pl');
    if(btnEN) btnEN.onclick = () => doSwitch('en');
    if(btnRO) btnRO.onclick = () => doSwitch('ro');

    initLeaderboardUI();
    initLanguageSelector(); 
    updateFlagHighlights();

    setTimeout(() => {
        const btnStart = document.getElementById('btnStart');
        if (btnStart) {
            document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
            focusedElement = btnStart;
            btnStart.classList.add('focused');
            btnStart.focus();
        }
    }, 500);
}

export function generateGuide() {
    const guideContainer = document.getElementById('guideContent');
    if (!guideContainer) return;
    
    const guideData = [
        { customImg: 'img/drakul.png', nameKey: 'ui_player_name', descKey: 'ui_guide_intro' },
        { asset: 'gem', nameKey: 'ui_gem_name', descKey: 'ui_gem_desc' },
        { asset: 'chest', nameKey: 'pickup_chest_name', descKey: 'pickup_chest_desc' },
        { header: getLang('ui_guide_pickups_title') || "Pickupy" },
        { asset: 'pickup_heal', nameKey: 'pickup_heal_name', descKey: 'pickup_heal_desc' },
        { asset: 'pickup_magnet', nameKey: 'pickup_magnet_name', descKey: 'pickup_magnet_desc' },
        { asset: 'pickup_shield', nameKey: 'pickup_shield_name', descKey: 'pickup_shield_desc' },
        { asset: 'pickup_speed', nameKey: 'pickup_speed_name', descKey: 'pickup_speed_desc' },
        { asset: 'pickup_bomb', nameKey: 'pickup_bomb_name', descKey: 'pickup_bomb_desc' },
        { asset: 'pickup_freeze', nameKey: 'pickup_freeze_name', descKey: 'pickup_freeze_desc' },
        { header: getLang('ui_guide_enemies_title') || "Wrogowie" },
        { asset: 'enemy_standard', nameKey: 'enemy_standard_name', descKey: 'enemy_standard_desc' },
        { asset: 'enemy_horde', nameKey: 'enemy_horde_name', descKey: 'enemy_horde_desc' },
        { asset: 'enemy_aggressive', nameKey: 'enemy_aggressive_name', descKey: 'enemy_aggressive_desc' },
        { asset: 'enemy_kamikaze', nameKey: 'enemy_kamikaze_name', descKey: 'enemy_kamikaze_desc' },
        { asset: 'enemy_splitter', nameKey: 'enemy_splitter_name', descKey: 'enemy_splitter_desc' },
        { asset: 'enemy_tank', nameKey: 'enemy_tank_name', descKey: 'enemy_tank_desc' },
        { asset: 'enemy_ranged', nameKey: 'enemy_ranged_name', descKey: 'enemy_ranged_desc' },
        { asset: 'enemy_wall', nameKey: 'enemy_wall_name', descKey: 'enemy_wall_desc' },
        { asset: 'enemy_elite', nameKey: 'enemy_elite_name', descKey: 'enemy_elite_desc' },
        { asset: 'enemy_lumberjack', nameKey: 'enemy_lumberjack_name', descKey: 'enemy_lumberjack_desc' },
        { asset: 'enemy_snakeEater', nameKey: 'enemy_snakeEater_name', descKey: 'enemy_snakeEater_desc' },
        { header: getLang('ui_guide_weapons_title') || "Bronie" },
        { asset: 'icon_whip', nameKey: 'perk_whip_name', descKey: 'perk_whip_desc' },
        { asset: 'icon_autogun', nameKey: 'perk_autogun_name', descKey: 'perk_autogun_desc' },
        { asset: 'icon_orbital', nameKey: 'perk_orbital_name', descKey: 'perk_orbital_desc' },
        { asset: 'icon_nova', nameKey: 'perk_nova_name', descKey: 'perk_nova_desc' },
        { asset: 'icon_lightning', nameKey: 'perk_chainLightning_name', descKey: 'perk_chainLightning_desc' }
    ];

    let html = `<h4 style="color:#4caf50; margin-bottom:15px; text-align:center;">📖 ${getLang('ui_guide_title')}</h4>`;
    guideData.forEach(item => {
        if (item.header) {
            html += `<div class="guide-section-title" style="margin-top:20px; border-bottom:1px solid #444; color:#FFD700; font-size:1.2em;">${item.header}</div>`;
        } else {
            let displayIcon = '<span style="font-size:24px;">❓</span>';
            if (item.customImg) displayIcon = `<img src="${item.customImg}" class="guide-icon">`;
            else if (item.asset) {
                const asset = getAsset(item.asset);
                if(asset) displayIcon = `<img src="${asset.src}" class="guide-icon">`;
            }
            const name = item.nameKey ? getLang(item.nameKey) : item.title;
            const desc = item.descKey ? getLang(item.descKey) : item.desc;
            html += `<div class="guide-entry"><div class="guide-icon-wrapper">${displayIcon}</div><div class="guide-text-wrapper"><strong style="color:#FFD700;">${name}</strong><br><span style="color:#ccc; font-size:16px;">${desc}</span></div></div>`;
        }
    });
    guideContainer.innerHTML = html;
}

window.wrappedGenerateGuide = generateGuide;
window.wrappedDisplayScores = () => { if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard(); };