// ==============
// MENUS.JS (v1.33h - Full Code Restore & Export Fix)
// Lokalizacja: /js/ui/menus.js
// ==============

import { getLang, setLanguage, getAvailableLanguages, getCurrentLangCode } from '../services/i18n.js';
import { playSound, setMusicVolume, setSfxVolume } from '../services/audio.js';
import { get as getAsset } from '../services/assets.js';
import { setJoystickSide, getGamepadButtonState, pollGamepad } from './input.js';
import { initLeaderboardUI } from './leaderboardUI.js'; 
import { VERSION } from '../config/version.js';
import { MUSIC_CONFIG, SKINS_CONFIG, SHOP_CONFIG } from '../config/gameData.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { getUnlockedSkins, unlockSkin, setCurrentSkin, getCurrentSkin } from '../services/skinManager.js'; 
import { shopManager } from '../services/shopManager.js';
import { perkPool } from '../config/perks.js';

let currentJoyMode = 'right';
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
    'navShop': 'ui_menu_shop',
    'coffeeFooter': 'ui_coffee_footer' // Przywrócenie stopki
};

export function updateStaticTranslations() {
    for (const [id, key] of Object.entries(STATIC_TRANSLATION_MAP)) {
        const el = document.getElementById(id);
        if (el) {
            const text = getLang(key);
            if (text && !text.startsWith('[')) {
                // Jeśli tekst zawiera HTML (jak link do wykopu), używamy innerHTML
                if (text.includes('<') && text.includes('>')) el.innerHTML = text;
                else el.innerText = text;
            }
        }
    }
    
    const coffeeDesc = document.getElementById('coffeeDesc');
    if (coffeeDesc) coffeeDesc.innerHTML = getLang('ui_coffee_desc');

    const btnScores = document.getElementById('navScores');
    if (btnScores && getCurrentLangCode() === 'pl') btnScores.innerText = "KRONIKI POLEGŁYCH";
    
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

export function generateShop() {
    const container = document.getElementById('shopContainer');
    const walletText = document.getElementById('shopWalletPoints');
    if (!container || !shopManager) return;

    walletText.textContent = shopManager.getWalletBalance().toLocaleString();
    container.innerHTML = '';

    const nextCost = shopManager.calculateNextCost();

    Object.values(SHOP_CONFIG.UPGRADES).forEach(upg => {
        const perkData = perkPool.find(p => p.id === upg.id);
        if (!perkData) return;

        const currentLvl = shopManager.getUpgradeLevel(upg.id);
        const maxLvl = perkData.max || 1;
        const isMaxed = currentLvl >= maxLvl;
        const canBuy = shopManager.canBuy(upg.id);
        
        const el = document.createElement('div');
        el.className = 'perk perk-graphic';
        
        if (isMaxed) {
            el.style.borderColor = 'var(--accent-green)';
            el.style.opacity = '0.6';
            el.style.cursor = 'default';
        } else if (!canBuy) {
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
        }

        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'perk-img-wrapper';
        const img = document.createElement('img');
        img.src = upg.icon;
        iconWrapper.appendChild(img);

        const info = document.createElement('div');
        info.className = 'perk-info';
        
        const title = document.createElement('h4');
        const levelTag = `<span class=\"badge\" style=\"color: ${isMaxed ? 'var(--accent-green)' : '#aaa'}\">POZ. ${currentLvl}/${maxLvl}</span>`;
        title.innerHTML = `${getLang(`perk_${upg.id}_name`) || upg.id.toUpperCase()} ${levelTag}`;
        
        let descText = getLang(`perk_${upg.id}_desc`) || "Ulepszenie startowe.";
        if (descText.includes('{val}')) {
            const val = perkData.formatVal ? perkData.formatVal(currentLvl) : (perkData.value || "");
            descText = descText.replace('{val}', val);
        }
        
        const desc = document.createElement('p');
        desc.textContent = descText;

        const costTag = document.createElement('div');
        costTag.style.marginTop = '5px';
        costTag.style.fontSize = '0.9rem';
        
        if (isMaxed) {
            costTag.innerHTML = `<span style=\"color:var(--accent-green);\">${getLang('ui_shop_maxed') || 'OSIĄGNIĘTO LIMIT'}</span>`;
        } else {
            const color = canBuy ? 'var(--accent-gold)' : 'var(--accent-red)';
            const costLbl = getLang('ui_shop_cost') || 'KOSZT:';
            costTag.innerHTML = `${costLbl} <span style=\"color:${color}; font-weight:bold;\">${nextCost.toLocaleString()} PKT</span>`;
            
            if (currentLvl === 0 && upg.dependsOn && shopManager.getUpgradeLevel(upg.dependsOn) === 0) {
                const depName = getLang(`perk_${upg.dependsOn}_name`) || upg.dependsOn;
                const reqLbl = getLang('ui_shop_requires') || 'WYMAGA:';
                costTag.innerHTML += `<br><span style=\"color:var(--accent-red); font-size:0.8rem;\">${reqLbl} ${depName}</span>`;
            }
        }

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(costTag);
        
        el.appendChild(iconWrapper);
        el.appendChild(info);

        el.onclick = () => {
            if (isMaxed) return;
            if (!canBuy) {
                playSound('Click');
                return;
            }
            if (shopManager.buyUpgrade(upg.id)) {
                playSound('ChestReward');
                generateShop();
            } else {
                console.warn("[ANTI-CHEAT] Purchase rejected by Manager logic.");
                if (window.lastGameRef) {
                    window.lastGameRef.isCheated = true;
                }
            }
        };

        container.appendChild(el);
    });
}

window.wrappedGenerateShop = generateShop;

function updateFlagHighlights() {
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
            <li style=\"margin-bottom:12px;\"><b>${getLang('ui_tutorial_ctrl_title')}</b><br>${getLang('ui_tutorial_ctrl_desc')}</li>
            <li style=\"margin-bottom:12px;\"><b>${getLang('ui_tutorial_hunger_title')}</b><br>${getLang('ui_tutorial_hunger_desc')}</li>
            <li style=\"margin-bottom:12px;\"><b>${getLang('ui_tutorial_prog_title')}</b><br>${getLang('ui_tutorial_prog_desc')}</li>
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
                        focusedElement = newLabel; newLabel.classList.add('focused'); newLabel.focus();
                    }
                }
            }, 0);
        };
        const span = document.createElement('span'); span.textContent = ` ${lang.name}`;
        label.appendChild(radio); label.appendChild(span); container.appendChild(label);
    });
}

async function fetchSupporters() {
    const listContainer = document.getElementById('supportersList');
    if (!listContainer) return;

    const lastFetch = sessionStorage.getItem('suppi_last_fetch');
    const cachedData = sessionStorage.getItem('suppi_data');
    if (lastFetch && cachedData && (Date.now() - lastFetch < 300000)) { 
        listContainer.innerHTML = cachedData; 
        return; 
    }

    listContainer.innerHTML = '<span class=\"pulse\">Łączenie z Suppi...</span>';
    const suppiUrl = 'https://suppi.pl/gregor'; 
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(suppiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Fetch failed");

        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const rows = doc.querySelectorAll('.contributor-row');
        
        let html = '';
        if (rows.length === 0) {
            html = '<div style=\"color:#888; font-style:italic; margin-top:10px;\">Brak widocznych wpłat na profilu.</div>';
        } else {
            html = '<ul style=\"list-style:none; padding:0; margin:0; width:100%;\">';
            rows.forEach((row) => {
                const nameEl = row.querySelector('.fund-contributor-name .wrap-ellipsis');
                const name = nameEl ? nameEl.innerText.trim() : "Anonim";
                const dataEls = row.querySelectorAll('.fund-contributor-data');
                let amount = "Darowizna", timeAgo = "";
                if (dataEls.length > 0) amount = dataEls[0].innerText.trim();
                if (dataEls.length > 1) timeAgo = dataEls[1].innerText.trim();
                html += `<li style=\"margin-bottom:8px; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;\">
                        <div style=\"text-align:left;\"><span style=\"color:#4CAF50; font-weight:bold; display:block;\">${name}</span><span style=\"font-size:0.8em; color:#666;\">${timeAgo}</span></div>
                        <span style=\"color:#FFD700; font-weight:bold; font-size:1.1em;\">${amount}</span></li>`;
            });
            html += '</ul>';
        }
        listContainer.innerHTML = html;
        sessionStorage.setItem('suppi_data', html); 
        sessionStorage.setItem('suppi_last_fetch', Date.now());

    } catch (e) {
        console.warn("[Supporters] Dane niedostępne.");
        listContainer.innerHTML = `
            <div style=\"color:#D32F2F; font-size:0.9em; margin-bottom: 10px;\">Błąd pobierania danych.</div>
            <button id=\"btnRetrySuppi\" class=\"menu-button\" style=\"padding: 5px 15px; font-size: 0.8em;\">PONÓW</button>
        `;
        const retryBtn = document.getElementById('btnRetrySuppi');
        if (retryBtn) {
            retryBtn.onclick = (event) => {
                event.stopPropagation();
                playSound('Click');
                fetchSupporters();
            };
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
        const desc = document.getElementById('coffeeDesc');
        if (desc) desc.innerHTML = getLang('ui_coffee_desc');
        // Aktualizacja stopki przy wejściu do menu kawy
        updateStaticTranslations();
    }
    else if (viewId === 'view-main') {
        playSound('MusicMenu'); updateFlagHighlights(); 
        setTimeout(() => {
            const btnStart = document.getElementById('btnStart');
            if (btnStart) { focusedElement = btnStart; btnStart.classList.add('focused'); btnStart.focus(); }
        }, 50);
    }
    if (viewId === 'view-scores') { if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard(); setTimeout(() => { updateStaticTranslations(); }, 100); }
    if (viewId === 'view-guide') generateGuide(); 
    if (viewId === 'view-shop') generateShop(); 
    if (viewId === 'view-config') {
        generateSkinSelector(); initLanguageSelector(); 
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const savedZoom = localStorage.getItem('szkeletal_zoom') || (window.lastGameRef ? Math.round((window.lastGameRef.zoomLevel || 1.0) * 100) : 100);
        if (zoomSlider && zoomValue) { zoomSlider.value = savedZoom; zoomValue.innerText = savedZoom + "%"; }
    }
    if (viewId === 'view-main') updateMainMenuStats();
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
    if (stats.unique_players !== undefined) valPlayers.textContent = stats.unique_players.toLocaleString();
    if (stats.games_played !== undefined) valGames.textContent = stats.games_played.toLocaleString();
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
    const unlocked = getUnlockedSkins(); const current = getCurrentSkin();
    SKINS_CONFIG.forEach(skin => {
        const option = document.createElement('div');
        option.className = 'skin-option'; option.tabIndex = 0; 
        const isLocked = skin.locked && !unlocked.includes(skin.id);
        const isSelected = (skin.id === current);
        if (isLocked) option.classList.add('locked');
        if (isSelected) option.classList.add('selected');
        const asset = getAsset(skin.assetIdle);
        const img = document.createElement('img');
        if (asset) img.src = asset.src; else img.alt = skin.name;
        option.appendChild(img);
        option.onclick = () => {
            if (isLocked) { playSound('Click'); switchView('view-coffee'); }
            else { setCurrentSkin(skin.id); playSound('Click'); generateSkinSelector(); }
        };
        option.title = isLocked ? "ZABLOKOWANE" : skin.name;
        container.appendChild(option);
    });
}

function getFocusableElements() {
    const priorityOverlays = [
        'confirmOverlay', 'nickInputOverlay', 'tutorialOverlay', 
        'chestOverlay', 'levelUpOverlay', 'pauseOverlay', 'gameOverOverlay', 'introOverlay'
    ];
    for (const ovId of priorityOverlays) {
        const ov = document.getElementById(ovId);
        if (ov && ov.style.display !== 'none' && ov.style.display !== '') {
             const items = Array.from(ov.querySelectorAll('button:not([disabled]), input:not([type=\"radio\"]), .perk, .skin-option, .lang-label-wrapper'))
                         .filter(el => el.offsetParent !== null || window.getComputedStyle(el).display !== 'none');
             if (items.length > 0) return items;
        }
    }
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay && menuOverlay.style.display !== 'none') {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView) {
            return Array.from(activeView.querySelectorAll('button:not([disabled]), input:not([type=\"radio\"]), .perk, .skin-option, .lang-label-wrapper'))
                         .filter(el => el.offsetParent !== null);
        }
    }
    return [];
}

function isGameplayActive() {
    const overlays = ['menuOverlay', 'pauseOverlay', 'levelUpOverlay', 'gameOverOverlay', 'introOverlay', 'chestOverlay', 'tutorialOverlay'];
    for (const id of overlays) {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none' && el.style.display !== '') return false;
    }
    return true;
}

export function forceFocusFirst() {
    focusedElement = null;
    document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
    navCooldown = 0; 
}

function updateGamepadMenu() {
    navCooldown--; if (navCooldown > 0) return;
    const gpState = getGamepadButtonState(); if (Object.keys(gpState).length === 0) return;
    if (gpState.A && !lastGpState.A) {
        const splash = document.getElementById('splashOverlay');
        if (splash && splash.style.display !== 'none' && !splash.classList.contains('fade-out')) {
             window.dispatchEvent(new Event('touchstart')); 
             navCooldown = 30; return;
        }
    }
    if (gpState.Start && !lastGpState.Start) {
        if (isGameplayActive()) { document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'})); navCooldown = 15; return; }
    }
    const rawGp = pollGamepad();
    if (rawGp && rawGp.axes) {
        const tutorial = document.getElementById('tutorialOverlay');
        if (tutorial && tutorial.style.display !== 'none') {
            const scrollY = rawGp.axes[3]; 
            if (Math.abs(scrollY) > 0.2) {
                const scrollBox = tutorial.querySelector('.retro-scroll-box');
                if (scrollBox) scrollBox.scrollTop += scrollY * 20;
            }
        }
    }
    if (isGameplayActive()) return;
    const focusables = getFocusableElements(); if (focusables.length === 0) return;
    if (!focusedElement || !focusables.includes(focusedElement)) {
        if (focusedElement) { focusedElement.classList.remove('focused'); focusedElement.blur(); }
        focusedElement = focusables[0];
        if (focusedElement) { focusedElement.classList.add('focused'); focusedElement.focus(); }
    }
    let moveDir = { up: false, down: false, left: false, right: false };
    if (gpState.Up) moveDir.up = true; if (gpState.Down) moveDir.down = true;
    if (gpState.Left) moveDir.left = true; if (gpState.Right) moveDir.right = true;
    if (rawGp && rawGp.axes) {
        if (rawGp.axes[1] < -0.5) moveDir.up = true; if (rawGp.axes[1] > 0.5) moveDir.down = true;
        if (rawGp.axes[0] < -0.5) moveDir.left = true; if (rawGp.axes[0] > 0.5) moveDir.right = true;
        if (rawGp.axes.length >= 4) {
            const scrollY = rawGp.axes[3];
            if (Math.abs(scrollY) > 0.2) {
                const activeView = document.querySelector('.menu-view.active');
                if (activeView) { const scrollBox = activeView.querySelector('.retro-scroll-box, .config-list, .menu-list'); if (scrollBox) scrollBox.scrollTop += scrollY * 15; }
            }
        }
    }
    const isRange = focusedElement && focusedElement.tagName === 'INPUT' && focusedElement.type === 'range';
    let index = focusables.indexOf(focusedElement); let moved = false;
    if (moveDir.down) { index++; moved = true; }
    else if (moveDir.up) { index--; moved = true; }
    else if (moveDir.right) {
        if (isRange) {
            focusedElement.value = Math.min(parseInt(focusedElement.max), parseInt(focusedElement.value) + 5);
            focusedElement.dispatchEvent(new Event('input')); navCooldown = 5; 
        } else { index++; moved = true; }
    }
    else if (moveDir.left) {
        if (isRange) {
            focusedElement.value = Math.max(parseInt(focusedElement.min), parseInt(focusedElement.value) - 5);
            focusedElement.dispatchEvent(new Event('input')); navCooldown = 5;
        } else { index--; moved = true; }
    }
    if (moved) {
        if (index >= focusables.length) index = 0;
        if (index < 0) index = focusables.length - 1;
        if (focusedElement) { focusedElement.classList.remove('focused'); focusedElement.blur(); }
        focusedElement = focusables[index];
        if (focusedElement) {
            focusedElement.classList.add('focused'); focusedElement.focus(); focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            playSound('Click'); updateFlagHighlights();
        }
        navCooldown = 12; 
    }
    if (gpState.A && !lastGpState.A) {
        if (focusedElement) {
            const el = focusedElement;
            if (el.id === 'btnLangPL') { setLanguage('pl'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangEN') { setLanguage('en'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangRO') { setLanguage('ro'); updateStaticTranslations(); playSound('Click'); }
            else { el.focus(); el.click(); navCooldown = 2; }
        }
        lastGpState = { ...gpState }; return;
    }
    if (gpState.B && !lastGpState.B) {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView && activeView.id !== 'view-main') { const backBtn = activeView.querySelector('.nav-back'); if (backBtn) backBtn.click(); }
        navCooldown = 15;
    }
    lastGpState = { ...gpState };
}

setInterval(updateGamepadMenu, 16); 

export function initRetroToggles(game, uiData) {
    window.lastGameRef = game; 
    const setupToggle = (btnId, chkId, callback) => {
        const btn = document.getElementById(btnId); const chk = document.getElementById(chkId);
        if(btn && chk) {
            const saved = localStorage.getItem('szkeletal_' + chkId);
            if(saved !== null) chk.checked = (saved === 'true');
            btn.onclick = () => { 
                chk.checked = !chk.checked; 
                localStorage.setItem('szkeletal_' + chkId, chk.checked);
                updateToggleVisual(btn, chk.checked); playSound('Click'); 
                if(callback) callback(); 
            };
            updateToggleVisual(btn, chk.checked);
        }
    };

    setupToggle('toggleHyper', 'chkHyper');
    setupToggle('toggleShake', 'chkShake', () => { game.screenShakeDisabled = !document.getElementById('chkShake').checked; });
    setupToggle('toggleFPS', 'chkFPS', () => { uiData.showFPS = !!document.getElementById('chkFPS').checked; });
    setupToggle('toggleLabels', 'chkPickupLabels', () => { uiData.pickupShowLabels = !!document.getElementById('chkPickupLabels').checked; });
    setupToggle('toggleTutorial', 'chkTutorial'); 
    
    const hb = document.getElementById('toggleHyper'); if(hb) updateToggleVisual(hb, game.hyper);
    const sb = document.getElementById('toggleShake'); if(sb) updateToggleVisual(sb, !game.screenShakeDisabled);
    const fb = document.getElementById('toggleFPS'); if(fb) updateToggleVisual(fb, uiData.showFPS);
    const lb = document.getElementById('toggleLabels'); if(lb) updateToggleVisual(lb, uiData.pickupShowLabels);
    const tb = document.getElementById('toggleTutorial'); if(tb) updateToggleVisual(tb, document.getElementById('chkTutorial').checked);

    const joyBtn = document.getElementById('toggleJoy');
    if(joyBtn) {
        const joyOpts = ['right', 'left', 'off']; let joyIdx = 0; updateStaticTranslations(); 
        joyBtn.onclick = () => { joyIdx = (joyIdx + 1) % joyOpts.length; currentJoyMode = joyOpts[joyIdx]; updateStaticTranslations(); setJoystickSide(currentJoyMode); playSound('Click'); };
    }

    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValueText = document.getElementById('zoomValue');
    if (zoomSlider && zoomValueText) {
        zoomSlider.value = Math.round((game.zoomLevel || 1.0) * 100);
        zoomValueText.innerText = zoomSlider.value + "%";
        zoomSlider.oninput = (e) => {
            const val = parseInt(e.target.value); const zoomFactor = val / 100;
            game.zoomLevel = zoomFactor; zoomValueText.innerText = val + "%";
            localStorage.setItem('szkeletal_zoom', val);
        };
    }

    const coffeeBtn = document.getElementById('coffeeBtn');
    if (coffeeBtn) {
        coffeeBtn.onclick = () => { 
            playSound('Click'); 
            setTimeout(() => { 
                unlockSkin('hot'); 
                playSound('ChestReward'); 
                // Zmiana tekstu i koloru na niebieski
                coffeeBtn.innerText = getLang('ui_coffee_unlocked') || "NIKT TEGO NIE SPRAWDZA - SKIN ODBLOKOWANY";
                coffeeBtn.style.backgroundColor = "#2196F3"; 
                coffeeBtn.style.borderColor = "#0D47A1";
            }, 2000); 
        };
    }

    const volMusic = document.getElementById('volMusic');
    if (volMusic) volMusic.oninput = (e) => { setMusicVolume(parseInt(e.target.value) / 100); }; 
    const volSFX = document.getElementById('volSFX');
    if (volSFX) volSFX.oninput = (e) => { setSfxVolume(parseInt(e.target.value) / 100); }; 
    
    const btnPL = document.getElementById('btnLangPL');
    const btnEN = document.getElementById('btnLangEN');
    const btnRO = document.getElementById('btnLangRO');
    const doSwitch = (lang) => { setLanguage(lang); updateStaticTranslations(); initLanguageSelector(); playSound('Click'); };
    if(btnPL) btnPL.onclick = () => doSwitch('pl');
    if(btnEN) btnEN.onclick = () => doSwitch('en');
    if(btnRO) btnRO.onclick = () => doSwitch('ro');

    initLeaderboardUI(); initLanguageSelector(); updateFlagHighlights();
}

export function generateGuide() {
    const gc = document.getElementById('guideContent'); if (!gc) return;
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
    let html = `<h4 style=\"color:#4caf50; margin-bottom:15px; text-align:center;\">📖 ${getLang('ui_guide_title')}</h4>`;
    guideData.forEach(item => {
        if (item.header) html += `<div class=\"guide-section-title\" style=\"margin-top:20px; border-bottom:1px solid #444; color:#FFD700; font-size:1.2em;\">${item.header}</div>`;
        else {
            let icon = item.customImg ? `<img src=\"${item.customImg}\" class=\"guide-icon\">` : (item.asset ? `<img src=\"${getAsset(item.asset).src}\" class=\"guide-icon\">` : '❓');
            html += `<div class=\"guide-entry\"><div class=\"guide-icon-wrapper\">${icon}</div><div class=\"guide-text-wrapper\"><strong style=\"color:#FFD700;\">${getLang(item.nameKey)}</strong><br><span style=\"color:#ccc; font-size:16px;\">${getLang(item.descKey)}</span></div></div>`;
        }
    });
    gc.innerHTML = html;
}

window.wrappedGenerateGuide = generateGuide;
window.wrappedDisplayScores = () => { if(window.wrappedResetLeaderboard) window.wrappedResetLeaderboard(); };