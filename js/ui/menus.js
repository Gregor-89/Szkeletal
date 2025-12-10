// ==============
// MENUS.JS (v0.99h_fix - With Guide)
// Lokalizacja: /js/ui/menus.js
// ==============

import { menuOverlay, btnContinue, tutorialOverlay } from './domElements.js';
import { getLang, setLanguage, getAvailableLanguages, getCurrentLangCode } from '../services/i18n.js';
import { playSound, setMusicVolume, setSfxVolume } from '../services/audio.js';
import { setJoystickSide } from './input.js';
import { get as getAsset } from '../services/assets.js';
import { VERSION } from '../config/version.js';
import { initLeaderboardUI } from './leaderboardUI.js';

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
    
    'resumeOverlayTitle': 'ui_ready_title', 
    'scoresTitle': 'ui_scores_title', 
    'btnClearScoresMenu': 'ui_scores_clear',
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
    'lblNickLimitConfig': 'ui_nick_limit_info'
};

export function updateStaticTranslations() {
    for (const [id, key] of Object.entries(STATIC_TRANSLATION_MAP)) {
        const el = document.getElementById(id);
        if (el) {
            const text = getLang(key);
            if (text && !text.startsWith('[')) el.innerText = text; 
        }
    }
    
    const btnSubmit = document.getElementById('btnSubmitScore');
    if(btnSubmit && btnSubmit.style.display !== 'none' && btnSubmit.textContent !== getLang('ui_gameover_sent')) {
        btnSubmit.textContent = getLang('ui_gameover_submit') || "WYŚLIJ WYNIK";
    }
    
    updateTutorialTexts();
    
    const backText = getLang('ui_nav_back') || 'POWRÓT';
    document.querySelectorAll('.nav-back').forEach(el => el.innerText = backText);

    const headers = document.querySelectorAll('#retroScoreTable th, #goScoreTable th');
    if (headers.length >= 5) {
        headers.forEach((th, index) => {
            const mod = index % 6; 
            if (mod === 0) th.innerText = getLang('ui_scores_col_rank');
            if (mod === 1) th.innerText = getLang('ui_scores_col_nick');
            if (mod === 2) th.innerText = getLang('ui_scores_col_score');
            if (mod === 3) th.innerText = getLang('ui_scores_col_kills');
            if (mod === 4) th.innerText = getLang('ui_scores_col_level');
            if (mod === 5) th.innerText = getLang('ui_scores_col_date');
        });
    }
    
    const pageTitle = getLang('ui_game_title');
    if (pageTitle) document.title = `${pageTitle} v${VERSION}`;
    
    if (document.getElementById('view-guide') && document.getElementById('view-guide').classList.contains('active')) {
        generateGuide();
    }
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

export function showMenu(game, resetAllCallback, uiData, allowContinue = false) {
    if (!allowContinue) { 
        resetAllCallback(); 
        uiData.savedGameState = null; 
    }
    if (uiData.savedGameState && allowContinue) btnContinue.style.display = 'block'; else btnContinue.style.display = 'none';
    switchView('view-main');
    menuOverlay.style.display = 'flex';
    
    const verTag = document.getElementById('menuVersionTag');
    if(verTag) verTag.textContent = `v${VERSION}`;
    
    game.inMenu = true; 
    game.paused = true; 
    game.running = false;
    
    initAudio(); 
    playSound('MusicMenu');
    
    initRetroToggles(game, uiData);
    initLanguageSelector();
    initLeaderboardUI();
    updateStaticTranslations();
}

export function switchView(viewId) {
    document.querySelectorAll('.menu-view').forEach(el => { el.classList.remove('active'); });
    const target = document.getElementById(viewId);
    if (target) { target.classList.add('active'); playSound('Click'); }
    if (viewId === 'view-scores') {
        if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard();
    }
    if (viewId === 'view-guide') { generateGuide(); }
}

export function initRetroToggles(game, uiData) {
    const setupToggle = (btnId, chkId, callback) => {
        const btn = document.getElementById(btnId);
        const chk = document.getElementById(chkId);
        if(btn && chk) {
            btn.onclick = () => { 
                chk.checked = !chk.checked;
                updateToggleVisual(btn, chk.checked);
                playSound('Click');
                if(callback) callback();
            };
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
        joyBtn.onclick = () => {
             let currentJoyMode = localStorage.getItem('szkeletal_joy') || 'right';
             const modes = ['right', 'left', 'off'];
             let idx = modes.indexOf(currentJoyMode);
             idx = (idx + 1) % modes.length;
             setJoystickSide(modes[idx]);
             updateStaticTranslations(); 
             playSound('Click');
        };
    }
    
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
    
    const volMusic = document.getElementById('volMusic');
    if (volMusic) { volMusic.oninput = (e) => { const val = parseInt(e.target.value) / 100; setMusicVolume(val); }; }
    const volSFX = document.getElementById('volSFX');
    if (volSFX) { volSFX.oninput = (e) => { const val = parseInt(e.target.value) / 100; setSfxVolume(val); }; }
    
    const overlay = document.getElementById('tutorialOverlay');
    const btnClose = document.getElementById('btnCloseTutorial');
    const btnShowTutorial = document.getElementById('btnShowTutorialConfig');

    if (btnClose && overlay) {
        btnClose.onclick = () => {
            overlay.style.display = 'none';
            if (!game.inMenu) {
                game.paused = false;
            }
            playSound('Click');
            localStorage.setItem('szkeletal_tutorial_seen', 'true');
        };
    }

    if (btnShowTutorial && overlay) {
        btnShowTutorial.onclick = () => {
            overlay.style.display = 'flex';
            updateTutorialTexts();
            playSound('Click');
            game.paused = true;
        };
    }
}

function updateToggleVisual(btn, isOn) {
    const onTxt = getLang('ui_on') || "WŁ";
    const offTxt = getLang('ui_off') || "WYŁ";
    if (isOn) { btn.textContent = onTxt; btn.className = "retro-toggle on"; } else { btn.textContent = offTxt; btn.className = "retro-toggle off"; }
}

function initLanguageSelector() {
    const container = document.getElementById('lang-selector-container');
    if (!container) return;
    const langs = getAvailableLanguages();
    const current = getCurrentLangCode();
    container.innerHTML = '';
    langs.forEach(lang => {
        const label = document.createElement('label');
        label.style.marginRight = '15px'; label.style.cursor = 'pointer';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'lang-select'; radio.value = lang.code; radio.checked = (lang.code === current);
        radio.onchange = () => { setLanguage(lang.code); updateStaticTranslations(); playSound('Click'); };
        const span = document.createElement('span'); span.textContent = ` ${lang.name}`;
        label.appendChild(radio); label.appendChild(span);
        container.appendChild(label);
    });
}

// Funkcja generująca przewodnik (przeniesiona z ui.js)
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
            if (item.customImg) {
                displayIcon = `<img src="${item.customImg}" class="guide-icon">`;
            } else if (item.asset) {
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