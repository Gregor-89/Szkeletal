// ==============
// MENUS.JS (v1.33z8b - Suppi Retry & Robust Resume Fix)
// Lokalizacja: /js/ui/menus.js
// ==============

import { getLang, setLanguage } from '../services/i18n.js';
import { playSound, setMusicVolume, setSfxVolume } from '../services/audio.js';
import { get as getAsset } from '../services/assets.js';
import { setJoystickSide } from './input.js';
import { initLeaderboardUI } from './leaderboardUI.js';
import { SKINS_CONFIG, SHOP_CONFIG } from '../config/gameData.js';
import { getUnlockedSkins, unlockSkin, setCurrentSkin, getCurrentSkin } from '../services/skinManager.js';
import { shopManager } from '../services/shopManager.js';
import { perkPool } from '../config/perks.js';

// Importy z nowych modułów
import {
    updateStaticTranslations,
    initLanguageSelector,
    updateJoystickToggleLabel,
    updateToggleLabels
} from './menuTranslations.js';

import { forceFocusFirst, setFocusedElement } from './menuNavigation.js';

// Re-eksporty funkcji, aby nie psuć importów w innych plikach projektu
export { updateStaticTranslations, forceFocusFirst, setFocusedElement };
export { getFocusableElements, isGameplayActive, updateGamepadMenu } from './menuNavigation.js';

// Przypięcie managera do window dla łatwego dostępu z modułów
window.shopManager = shopManager;
window.currentJoyMode = 'right';

export function generateShop() {
    const container = document.getElementById('shopContainer');
    const walletText = document.getElementById('shopWalletPoints');
    if (!container || !shopManager) return;

    // Pobranie i sformatowanie salda (Etap 1 Fix)
    const currentBalance = shopManager.getWalletBalance();
    if (walletText) walletText.textContent = currentBalance.toLocaleString();

    container.innerHTML = '';

    const nextCost = shopManager.calculateNextCost();
    const currency = getLang('ui_shop_currency') || "PKT";

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
        const levelTag = `<span class="badge" style="color: ${isMaxed ? 'var(--accent-green)' : '#aaa'}">${getLang('ui_hud_level').toUpperCase()} ${currentLvl}/${maxLvl}</span>`;
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
            costTag.innerHTML = `<span style="color:var(--accent-green);">${getLang('ui_shop_maxed') || 'OSIĄGNIĘTO LIMIT'}</span>`;
        } else {
            const color = canBuy ? 'var(--accent-gold)' : 'var(--accent-red)';
            const costLbl = getLang('ui_shop_cost') || 'KOSZT:';
            costTag.innerHTML = `${costLbl} <span style="color:${color}; font-weight:bold;">${nextCost.toLocaleString()} ${currency}</span>`;

            if (currentLvl === 0 && upg.dependsOn && shopManager.getUpgradeLevel(upg.dependsOn) === 0) {
                const depName = getLang(`perk_${upg.dependsOn}_name`) || upg.dependsOn;
                const reqLbl = getLang('ui_shop_requires') || 'WYMAGA:';
                costTag.innerHTML += `<br><span style="color:var(--accent-red); font-size:0.8rem;">${reqLbl} ${depName}</span>`;
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
                console.warn("[ANTI-CHEAT] Purchase rejected.");
                if (window.lastGameRef) window.lastGameRef.isCheated = true;
            }
        };

        container.appendChild(el);
    });
}

window.wrappedGenerateShop = generateShop;

async function fetchSupporters() {
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
        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const rows = doc.querySelectorAll('.contributor-row');

        let html = '';
        if (rows.length === 0) {
            html = '<div style="color:#888; font-style:italic; margin-top:10px;">Brak widocznych wpłat na profilu.</div>';
        } else {
            html = '<ul style="list-style:none; padding:0; margin:0; width:100%;">';
            rows.forEach((row) => {
                const nameEl = row.querySelector('.fund-contributor-name .wrap-ellipsis');
                const name = nameEl ? nameEl.innerText.trim() : "Anonim";
                const dataEls = row.querySelectorAll('.fund-contributor-data');
                let amount = "Darowizna", timeAgo = "";
                if (dataEls.length > 0) amount = dataEls[0].innerText.trim();
                if (dataEls.length > 1) timeAgo = dataEls[1].innerText.trim();
                html += `<li style="margin-bottom:8px; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="text-align:left;"><span style="color:#4CAF50; font-weight:bold; display:block;">${name}</span><span style="font-size:0.8em; color:#666;">${timeAgo}</span></div>
                        <span style="color:#FFD700; font-weight:bold; font-size:1.1em;">${amount}</span></li>`;
            });
            html += '</ul>';
        }
        listContainer.innerHTML = html;
        sessionStorage.setItem('suppi_data', html);
        sessionStorage.setItem('suppi_last_fetch', Date.now());

    } catch (e) {
        console.warn("[Supporters] Dane niedostępne.");
        // FIX Ad 1: Zmieniono napis na "PONÓW PRÓBĘ"
        listContainer.innerHTML = `<div style="color:#D32F2F; font-size:0.9em; margin-bottom: 10px;">Błąd pobierania danych.</div>
                                   <button class="retro-btn small" onclick="window.retrySuppiFetch()">PONÓW PRÓBĘ</button>`;
    }
}

window.retrySuppiFetch = () => {
    sessionStorage.removeItem('suppi_last_fetch');
    fetchSupporters();
};

/**
 * FIX Ad 3 & 4: Naprawa wznowienia gry (Back na gamepadzie oraz przycisk Kontynuuj)
 * Dodano game.inMenu = false, aby odblokować logikę pauzy w eventManager.js
 */
export function handleMenuBack() {
    const overlay = document.getElementById('menuOverlay');
    const isVisible = overlay.style.display === 'flex';
    const isMainView = document.getElementById('view-main').classList.contains('active');
    const continueBtn = document.getElementById('btnContinue');

    if (isVisible && isMainView && continueBtn && continueBtn.style.display !== 'none') {
        playSound('Click');

        if (window.gameStateRef) {
            window.gameStateRef.game.manualPause = false;
            // FIX: Musimy ustawić inMenu na false, inaczej Escape/Start nie będą działać po wznowieniu
            window.gameStateRef.game.inMenu = false;
            window.gameStateRef.game.running = true;
        }
        overlay.style.display = 'none';

        if (window.wrappedResumeGame) {
            window.wrappedResumeGame();
        }
    }
}

window.handleMenuBack = handleMenuBack;

export function switchView(viewId) {
    document.querySelectorAll('.menu-view').forEach(el => { el.classList.remove('active'); });
    const target = document.getElementById(viewId);
    if (target) { target.classList.add('active'); playSound('Click'); }

    forceFocusFirst();

    if (viewId === 'view-coffee') {
        playSound('MusicIntro');
        fetchSupporters();
        updateStaticTranslations();
    }
    else if (viewId === 'view-main') {
        playSound('MusicMenu');
        import('./menuTranslations.js').then(m => m.updateFlagHighlights());
    }
    if (viewId === 'view-scores') { if (window.wrappedResetLeaderboard) window.wrappedResetLeaderboard(); setTimeout(() => { updateStaticTranslations(); }, 100); }
    if (viewId === 'view-guide') generateGuide();
    if (viewId === 'view-shop') { generateShop(); updateStaticTranslations(); }
    if (viewId === 'view-config') {
        generateSkinSelector(); initLanguageSelector();
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const savedZoom = localStorage.getItem('szkeletal_zoom') || (window.lastGameRef ? Math.round((window.lastGameRef.zoomLevel || 1.0) * 100) : 100);
        if (zoomSlider && zoomValue) { zoomSlider.value = savedZoom; zoomValue.innerText = savedZoom + "%"; }
        updateStaticTranslations();
    }
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
        container.appendChild(option);
    });
}

export function initRetroToggles(game, uiData) {
    window.lastGameRef = game;
    const setupToggle = (btnId, chkId, callback) => {
        const btn = document.getElementById(btnId); const chk = document.getElementById(chkId);
        if (btn && chk) {
            const saved = localStorage.getItem('szkeletal_' + chkId);
            if (saved !== null) chk.checked = (saved === 'true');
            btn.onclick = () => {
                chk.checked = !chk.checked;
                localStorage.setItem('szkeletal_' + chkId, chk.checked);
                updateToggleVisual(btn, chk.checked); playSound('Click');
                if (callback) callback();
            };
            updateToggleVisual(btn, chk.checked);
        }
    };

    setupToggle('toggleHyper', 'chkHyper');
    setupToggle('toggleShake', 'chkShake', () => { game.screenShakeDisabled = !document.getElementById('chkShake').checked; });
    setupToggle('toggleFPS', 'chkFPS', () => { uiData.showFPS = !!document.getElementById('chkFPS').checked; });
    setupToggle('toggleLabels', 'chkPickupLabels', () => { uiData.pickupShowLabels = !!document.getElementById('chkPickupLabels').checked; });
    setupToggle('toggleTutorial', 'chkTutorial');

    const joyBtn = document.getElementById('toggleJoy');
    if (joyBtn) {
        const joyOpts = ['right', 'left', 'off']; let joyIdx = 0;
        joyBtn.onclick = () => {
            joyIdx = (joyIdx + 1) % joyOpts.length;
            window.currentJoyMode = joyOpts[joyIdx];
            updateJoystickToggleLabel();
            setJoystickSide(window.currentJoyMode);
            playSound('Click');
        };
    }

    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) {
        zoomSlider.oninput = (e) => {
            const val = parseInt(e.target.value);
            game.zoomLevel = val / 100;
            document.getElementById('zoomValue').innerText = val + "%";
            localStorage.setItem('szkeletal_zoom', val);
        };
    }

    initLeaderboardUI(); initLanguageSelector();
}

function updateToggleVisual(btn, isOn) {
    const onTxt = getLang('ui_on') || "WŁ";
    const offTxt = getLang('ui_off') || "WYŁ";
    if (isOn) { btn.textContent = onTxt; btn.className = "retro-toggle on"; } else { btn.textContent = offTxt; btn.className = "retro-toggle off"; }
}

export function generateGuide() {
    const gc = document.getElementById('guideContent'); if (!gc) return;
    const guideData = [
        { customImg: 'img/drakul.png', nameKey: 'ui_player_name', descKey: 'ui_guide_intro' },
        { asset: 'gem', nameKey: 'ui_gem_name', descKey: 'ui_gem_desc' },
        { asset: 'chest', nameKey: 'pickup_chest_name', descKey: 'pickup_chest_desc' },
        { header: getLang('ui_guide_pickups_title') || "Pickups" },
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
        if (item.header) html += `<div class="guide-section-title" style="margin-top:20px; border-bottom:1px solid #444; color:#FFD700; font-size:1.2em;">${item.header}</div>`;
        else {
            let icon = item.customImg ? `<img src="${item.customImg}" class="guide-icon">` : (item.asset ? `<img src="${getAsset(item.asset).src}" class="guide-icon">` : '❓');
            html += `<div class="guide-entry"><div class="guide-icon-wrapper">${icon}</div><div class="guide-text-wrapper"><strong style="color:#FFD700;">${getLang(item.nameKey)}</strong><br><span style="color:#ccc; font-size:16px;">${getLang(item.descKey)}</span></div></div>`;
        }
    });
    gc.innerHTML = html;
}

window.wrappedGenerateGuide = generateGuide;
window.wrappedDisplayScores = () => { if (window.wrappedResetLeaderboard) window.wrappedResetLeaderboard(); };