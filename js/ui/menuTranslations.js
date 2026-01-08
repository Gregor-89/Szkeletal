// ==============
// MENUTRANSLATIONS.JS (v1.0.1 - Full Translation Map)
// Lokalizacja: /js/ui/menuTranslations.js
// ==============

import { getLang, getCurrentLangCode, getAvailableLanguages, setLanguage } from '../services/i18n.js';
import { playSound } from '../services/audio.js';
import { VERSION } from '../config/version.js';
import { generateGuide } from './menus.js';

export const STATIC_TRANSLATION_MAP = {
    'btnStart': 'ui_menu_start', 
    'btnContinue': 'ui_menu_continue', 
    'navScores': 'ui_scores_title', 
    'navConfig': 'ui_menu_tab_config', 
    'navGuide': 'ui_menu_tab_guide', 
    'btnReplayIntroMain': 'ui_menu_replay_intro',
    'navDev': 'ui_menu_tab_dev', 
    'navCoffee': 'ui_coffee_title',
    'navShop': 'ui_menu_shop',
    'coffeeFooter': 'ui_coffee_footer',
    'shopTitle': 'ui_shop_title',
    'shopInfoNoteTitle': 'ui_shop_info_title',
    'shopInfoNoteText': 'ui_shop_info',
    'lblShopWallet': 'ui_shop_wallet',
    'btnResetShop': 'ui_shop_reset_btn',
    'scoresTitle': 'ui_scores_title',
    'btnClearScoresMenu': 'ui_scores_clear_local',
    'lblNick': 'ui_config_nick',
    'lblSkin': 'ui_config_skin',
    'lblJoy': 'ui_config_joystick',
    'lblHyper': 'ui_config_hyper',
    'lblShake': 'ui_config_shake',
    'lblFPS': 'ui_config_fps',
    'lblLabels': 'ui_config_labels',
    'lblMusic': 'ui_config_music',
    'lblSFX': 'ui_config_sfx',
    'lblFOV': 'ui_config_fov',
    'lblLang': 'ui_config_title_lang',
    'lblTutorial': 'ui_config_tutorial',
    'btnIntroSkip': 'ui_intro_skip',
    'btnIntroPrev': 'ui_intro_prev',
    'configTitleMain': 'ui_config_title_game',
    'coffeeTitle': 'ui_coffee_title',
    'coffeeBtn': 'ui_coffee_btn',
    'lblSupporters': 'ui_coffee_supporters_header',
    'pauseTitle': 'ui_pause_title',
    'btnResume': 'ui_pause_resume',
    'btnPauseMenu': 'ui_pause_menu',
    'resumeOverlayTitle': 'ui_ready_title',
    'tabLocalScores': 'ui_scores_local',
    'tabOnlineScores': 'ui_scores_online',
    'tabStats': 'ui_tab_stats',
    'confirmTitle': 'ui_confirm_title',
    'btnConfirmYes': 'ui_confirm_yes',
    'btnConfirmNo': 'ui_confirm_no'
};

export function updateStaticTranslations() {
    for (const [id, key] of Object.entries(STATIC_TRANSLATION_MAP)) {
        const el = document.getElementById(id);
        if (el) {
            const text = getLang(key);
            if (text && !text.startsWith('[')) {
                if (text.includes('<') && text.includes('>')) el.innerHTML = text;
                else el.innerText = text;
            }
        }
    }
    
    const coffeeDesc = document.getElementById('coffeeDesc');
    if (coffeeDesc) coffeeDesc.innerHTML = getLang('ui_coffee_desc');

    const walletLabel = document.getElementById('lblShopWallet');
    if (walletLabel) {
        const translatedLabel = getLang('ui_shop_wallet') || "DOSTĘPNE PUNKTY:";
        const currency = getLang('ui_shop_currency') || "PKT";
        
        const currentBalance = (window.shopManager ? window.shopManager.getWalletBalance() : 0).toLocaleString();
        walletLabel.innerHTML = `${translatedLabel} <span id="shopWalletPoints" style="color:var(--accent-green);">${currentBalance}</span> ${currency}`;
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

export function updateFlagHighlights() {
    const currentLang = getCurrentLangCode();
    ['btnLangPL', 'btnLangEN', 'btnLangRO'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.transform = 'scale(1.0)';
            btn.style.filter = 'grayscale(1.0) contrast(0.8)'; 
            btn.style.outline = 'none';
            btn.style.boxShadow = 'none';
            btn.style.border = '2px solid transparent';
            btn.style.borderRadius = '4px'; 
            btn.style.transition = 'all 0.2s ease-in-out';

            const isActive = id.endsWith(currentLang.toUpperCase());
            const isFocused = btn.classList.contains('focused');

            if (isActive || isFocused) {
                btn.style.border = '2px solid #FFFFFF';
                btn.style.transform = 'scale(1.15)';
                btn.style.filter = 'grayscale(0) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'; 
                btn.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.4)';
            }
        }
    });
}

export function updateTutorialTexts() {
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

export function updateJoystickToggleLabel() {
    const btn = document.getElementById('toggleJoy');
    if(!btn) return;
    let label = "JOY";
    const currentJoyMode = window.currentJoyMode || 'right';
    if (currentJoyMode === 'left') label = getLang('ui_config_joy_left');
    else if (currentJoyMode === 'right') label = getLang('ui_config_joy_right');
    else if (currentJoyMode === 'off') label = getLang('ui_config_joy_off');
    btn.textContent = label;
}

export function updateToggleLabels() {
    const onTxt = getLang('ui_on') || "WŁ";
    const offTxt = getLang('ui_off') || "WYŁ";
    document.querySelectorAll('.retro-toggle').forEach(btn => {
        if(btn.id !== 'toggleJoy') {
            if (btn.classList.contains('on')) btn.textContent = onTxt;
            else if (btn.classList.contains('off')) btn.textContent = offTxt;
        }
    });
}

async function updateMainMenuStats() {
    const { LeaderboardService } = await import('../services/leaderboard.js');
    const lblPlayers = document.getElementById('lblMainPlayers');
    const valPlayers = document.getElementById('valMainPlayers');
    const lblGames = document.getElementById('lblMainGames');
    const valGames = document.getElementById('valMainGames');
    if (!lblPlayers || !valPlayers || !lblGames || !valGames) return;
    lblPlayers.textContent = (getLang('stat_unique_players') || 'GRACZY') + ':';
    lblGames.textContent = (getLang('stat_games_played') || 'GIER') + ':';
    const stats = await LeaderboardService.getGlobalStats();
    if (stats.unique_players !== undefined) valPlayers.textContent = stats.unique_players.toLocaleString();
    if (stats.games_played !== undefined) valGames.textContent = stats.games_played.toLocaleString();
}

export function initLanguageSelector() {
    const container = document.getElementById('lang-selector-container');
    if (!container) return;
    const langs = getAvailableLanguages();
    const current = getCurrentLangCode();
    container.innerHTML = '';
    langs.forEach(lang => {
        const label = document.createElement('label');
        label.style.marginRight = '15px'; label.style.cursor = 'pointer';
        label.tabIndex = 0; label.className = 'lang-label-wrapper';
        if (lang.code === current) { label.style.color = '#FFD700'; label.style.fontWeight = 'bold'; }
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'lang-select'; radio.value = lang.code; radio.checked = (lang.code === current); radio.tabIndex = -1;
        label.onclick = () => {
            radio.checked = true; setLanguage(lang.code); updateStaticTranslations(); initLanguageSelector(); playSound('Click');
            setTimeout(() => {
                const newContainer = document.getElementById('lang-selector-container');
                if (newContainer) {
                    const newRadio = newContainer.querySelector(`input[value="${lang.code}"]`);
                    if (newRadio && newRadio.parentElement) {
                        const newLabel = newRadio.parentElement;
                        document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
                        if (window.setFocusedElement) window.setFocusedElement(newLabel);
                        newLabel.classList.add('focused'); newLabel.focus();
                    }
                }
            }, 0);
        };
        const span = document.createElement('span'); span.textContent = ` ${lang.name}`;
        label.appendChild(radio); label.appendChild(span); container.appendChild(label);
    });
}