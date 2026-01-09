// ==============
// MENUNAVIGATION.JS (v1.0.8b - Precise Gamepad Scroll Fix)
// Lokalizacja: /js/ui/menuNavigation.js
// ==============

import { playSound } from '../services/audio.js';
import { getGamepadButtonState, pollGamepad, getKeyboardForMenu } from './input.js';
import { updateFlagHighlights, updateStaticTranslations } from './menuTranslations.js';
import { setLanguage } from '../services/i18n.js';

let lastGpState = {};
let navCooldown = 0;
let focusedElement = null;

// Re-eksport dla kompatybilności z window w menuTranslations
export const setFocusedElement = (el) => { focusedElement = el; };
window.setFocusedElement = setFocusedElement;

export function isGameplayActive() {
    const overlays = ['menuOverlay', 'pauseOverlay', 'levelUpOverlay', 'gameOverOverlay', 'introOverlay', 'chestOverlay', 'tutorialOverlay'];
    for (const id of overlays) {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none' && el.style.display !== '') return false;
    }
    return true;
}

export function getFocusableElements() {
    const priorityOverlays = [
        'confirmOverlay', 'nickInputOverlay', 'tutorialOverlay',
        'chestOverlay', 'levelUpOverlay', 'pauseOverlay', 'gameOverOverlay', 'introOverlay'
    ];

    for (const ovId of priorityOverlays) {
        const ov = document.getElementById(ovId);
        if (ov && ov.style.display !== 'none' && ov.style.display !== '') {
            let items = Array.from(ov.querySelectorAll('button:not([disabled]), input:not([type="radio"]), a, .perk, .skin-option, .lang-label-wrapper'))
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
                });

            if (ovId === 'introOverlay') {
                items.sort((a, b) => (b.id === 'btnIntroNext') - (a.id === 'btnIntroNext'));
            } else if (ovId === 'gameOverOverlay') {
                const goOrder = ['tabGOLocal', 'tabGOOnline', 'btnSubmitScore', 'btnClearScoresGO', 'btnRetry', 'btnMenu'];
                let sorted = [];
                goOrder.forEach(id => {
                    const found = items.find(it => it.id === id);
                    if (found) sorted.push(found);
                });
                items.forEach(el => { if (!sorted.includes(el)) sorted.push(el); });
                return sorted;
            } else if (ovId === 'pauseOverlay') {
                items.sort((a, b) => (b.id === 'btnResume') - (a.id === 'btnResume'));
            }

            if (items.length > 0) return items;
        }
    }

    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay && menuOverlay.style.display !== 'none') {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView) {
            let all = Array.from(activeView.querySelectorAll('button:not([disabled]), input, a, .perk, .skin-option, .lang-label-wrapper'))
                .filter(el => el.offsetParent !== null);

            if (activeView.id === 'view-main') {
                const order = [
                    'btnLangPL', 'btnLangEN', 'btnLangRO',
                    'btnStart', 'btnContinue', 'navShop',
                    'navScores', 'navConfig', 'navGuide',
                    'btnReplayIntroMain', 'navCoffee', 'navDev'
                ];
                let sorted = [];
                order.forEach(id => {
                    const el = all.find(item => item.id === id);
                    if (el && window.getComputedStyle(el).display !== 'none') sorted.push(el);
                });
                all.forEach(el => { if (!sorted.includes(el)) sorted.push(el); });
                return sorted;
            }

            if (activeView.id === 'view-config') {
                let skins = all.filter(el => el.classList.contains('skin-option'));
                let rest = all.filter(el => !el.classList.contains('skin-option'));
                return [...skins, ...rest];
            }

            // FIX: Zmiana priorytetu fokusu dla menu Coffee, aby domyślnie zaznaczać POWRÓT (uniknięcie autoscrolla)
            if (activeView.id === 'view-coffee') {
                all.sort((a, b) => (b.classList.contains('nav-back')) - (a.classList.contains('nav-back')));
            }

            return all;
        }
    }
    return [];
}

export function forceFocusFirst() {
    const focusables = getFocusableElements();
    document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
    focusedElement = null;

    if (focusables.length > 0) {
        const activeView = document.querySelector('.menu-view.active');
        let priority = null;

        if (activeView && activeView.id === 'view-main') {
            priority = focusables.find(el => el.id === 'btnStart') || focusables.find(el => el.id === 'btnContinue');
        } else if (activeView && activeView.id === 'view-config') {
            priority = focusables.find(el => el.classList.contains('skin-option') && el.classList.contains('selected')) || focusables.find(el => el.classList.contains('skin-option'));
        } else if (activeView && activeView.id === 'view-coffee') {
            // FIX: Wymuszenie fokusu na przycisku powrotu w menu kawy
            priority = focusables.find(el => el.classList.contains('nav-back'));
        }

        focusedElement = priority || focusables[0];
        if (focusedElement) {
            focusedElement.classList.add('focused');
            focusedElement.focus();
        }
    }
    navCooldown = 20;
}

export function updateGamepadMenu() {
    const rawGp = pollGamepad(window.lastGameRef, { settings: {}, player: { weapons: [] } });
    if (!rawGp || !rawGp.axes) return;

    // FIX: Blokada inputu menu podczas Splash Screenów (również podczas fade-out)
    const splash = document.getElementById('splashOverlay');
    if (splash && splash.style.display !== 'none') return;

    // FIX Ad 5: Poprawione scrollowanie gamepadem (Obniżony próg czułości do 0.1, zwiększona prędkość)
    if (rawGp.axes.length >= 3) {
        const scrollY = rawGp.axes[3] || rawGp.axes[2] || 0;
        if (Math.abs(scrollY) > 0.1) {
            const activeView = document.querySelector('.menu-view.active');
            const overlays = ['tutorialOverlay', 'levelUpOverlay', 'pauseOverlay', 'gameOverOverlay', 'chestOverlay'];
            let scrollBox = null;

            // Priorytet dla nakładek (statystyki pauzy/levelup)
            for (const id of overlays) {
                const el = document.getElementById(id);
                if (el && el.style.display !== 'none' && el.style.display !== '') {
                    scrollBox = el.querySelector('.stats-grid') || el.querySelector('.retro-scroll-box') || el.querySelector('.perk-grid');
                    if (scrollBox) break;
                }
            }

            // Jeśli nie ma nakładki, szukamy w aktywnym widoku menu
            if (!scrollBox && activeView) {
                if (activeView.id === 'view-scores') {
                    scrollBox = document.getElementById('scoreScrollBox');
                } else if (activeView.id === 'view-guide') {
                    scrollBox = document.getElementById('guideContent');
                } else {
                    scrollBox = activeView.querySelector('.retro-scroll-box, .perk-grid, .menu-list');
                }
            }

            if (scrollBox) {
                scrollBox.scrollTop += scrollY * 40;
            }
        }
    }

    navCooldown--;
    if (navCooldown > 0) return;

    const gpState = getGamepadButtonState();
    const kbState = getKeyboardForMenu();

    // Scalenie wejścia (Gamepad + Klawiatura)
    const input = {
        Up: gpState.Up || kbState.Up,
        Down: gpState.Down || kbState.Down,
        Left: gpState.Left || kbState.Left,
        Right: gpState.Right || kbState.Right,
        A: gpState.A || kbState.A,
        B: gpState.B || kbState.B
    };

    if (input.A && !lastGpState.A) {
        const splash = document.getElementById('splashOverlay');
        if (splash && splash.style.display !== 'none' && !splash.classList.contains('fade-out')) {
            window.dispatchEvent(new Event('touchstart'));
            navCooldown = 30;
            // Aktualizacja lastGpState, żeby nie zapętlić
            lastGpState = { ...input };
            return;
        }
    }

    if (isGameplayActive()) {
        lastGpState = { ...input };
        return;
    }

    // FIX ETAP 5: Blokada nawigacji klawiszami, gdy wpisujemy tekst (np. Nick)
    // FIX ETAP 5: Blokada nawigacji klawiszami, gdy wpisujemy tekst (np. Nick)
    // ALE pozwalamy na nawigację, gdy focus jest na suwaku (range), bo inaczej user utknie
    if (document.activeElement &&
        ((document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'range') ||
            document.activeElement.tagName === 'TEXTAREA')) {
        lastGpState = { ...input };
        return;
    }

    const focusables = getFocusableElements(); if (focusables.length === 0) return;

    if (!focusedElement || !focusables.includes(focusedElement)) {
        if (focusedElement) { focusedElement.classList.remove('focused'); focusedElement.blur(); }
        forceFocusFirst();
    }

    const curr = focusedElement;
    let moveDir = { up: false, down: false, left: false, right: false };

    if (input.Up || rawGp.axes[1] < -0.5) moveDir.up = true;
    if (input.Down || rawGp.axes[1] > 0.5) moveDir.down = true;
    if (input.Left || rawGp.axes[0] < -0.5) moveDir.left = true;
    if (input.Right || rawGp.axes[0] > 0.5) moveDir.right = true;

    if (curr && (curr.type === 'range' || curr.classList.contains('retro-range'))) {
        if (moveDir.left || moveDir.right) {
            const step = parseFloat(curr.step) || 5;
            const val = parseFloat(curr.value);
            curr.value = moveDir.left ? val - step : val + step;
            curr.dispatchEvent(new Event('input', { bubbles: true }));
            curr.dispatchEvent(new Event('change', { bubbles: true }));
            navCooldown = 5;
            curr.dispatchEvent(new Event('change', { bubbles: true }));
            navCooldown = 5;
            lastGpState = { ...input };
            return;
        }
    }

    let index = focusables.indexOf(focusedElement); let moved = false;

    if (moveDir.down || moveDir.right) { index++; moved = true; }
    else if (moveDir.up || moveDir.left) { index--; moved = true; }

    if (moved) {
        if (index >= focusables.length) index = 0;
        if (index < 0) index = focusables.length - 1;
        if (focusedElement) { focusedElement.classList.remove('focused'); focusedElement.blur(); }
        focusedElement = focusables[index];
        if (focusedElement) {
            focusedElement.classList.add('focused'); focusedElement.focus();
            focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            playSound('Click'); updateFlagHighlights();
        }
        navCooldown = 15;
    }

    if (input.A && !lastGpState.A) {
        if (focusedElement) {
            const el = focusedElement;
            if (el.id === 'btnLangPL') { setLanguage('pl'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangEN') { setLanguage('en'); updateStaticTranslations(); playSound('Click'); }
            else if (el.id === 'btnLangRO') { setLanguage('ro'); updateStaticTranslations(); playSound('Click'); }
            else { el.click(); navCooldown = 10; }
        }
    }

    if (input.B && !lastGpState.B) {
        const activeView = document.querySelector('.menu-view.active');
        if (activeView) {
            const backBtn = activeView.querySelector('.nav-back');
            if (backBtn) {
                backBtn.click();
            } else if (activeView.id === 'view-main' && window.handleMenuBack) {
                window.handleMenuBack();
            }
        }
        navCooldown = 15;
    }
    lastGpState = { ...input };
}

// Rejestracja pętli obsługi pada
setInterval(updateGamepadMenu, 16);