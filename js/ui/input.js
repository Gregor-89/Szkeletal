// ==============
// INPUT.JS (v1.14d - Clean Polling & Gamepad API Fix)
// Lokalizacja: /js/ui/input.js
// ==============

import { initAudio, playSound } from '../services/audio.js';
import { pauseGame, resumeGame } from './ui.js';

const joyZone = document.getElementById('joystickZone');
const joy = document.getElementById('joystick');

export const keys = {};

let onEscapePress = () => { };
let onJoyStart = () => { };
let onJoyEnd = () => { };
let jActive = false, jStartX = 0, jStartY = 0, jMoveX = 0, jMoveY = 0;

let gamepadIndex = null;
const GAMEPAD_DEADZONE = 0.25;
let lastBtnTime = 0;

export function initInput(escapeFn, joyStartFn, joyEndFn) {
    onEscapePress = escapeFn;
    onJoyStart = joyStartFn;
    onJoyEnd = joyEndFn;

    // FIX ETAP 5: Auto-Joystick Configuration
    // Domyślnie: Mobile -> Right, Desktop -> Off.
    // Tylko przy pierwszym uruchomieniu (brak zapisanego ustawienia).
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasSavedSetting = localStorage.getItem('szkeletal_joy_side');

    if (!hasSavedSetting && !localStorage.getItem('szkeletal_joystick_setup')) {
        const defaultSide = isMobile ? 'right' : 'off';
        setJoystickSide(defaultSide);

        // Aktualizacja globalnej zmiennej UI (jeśli istnieje)
        if (typeof window !== 'undefined') window.currentJoyMode = defaultSide;

        // Zapisz, aby było to trwałe ustawienie użytkownika
        localStorage.setItem('szkeletal_joy_side', defaultSide);
        localStorage.setItem('szkeletal_joystick_setup', 'true');

        console.log(`[Input] Auto-configured Joystick: ${defaultSide} (Mobile: ${isMobile})`);
    } else if (hasSavedSetting) {
        // Przywrócenie zapisanego stanu (na wypadek gdyby wrappedLoadConfig tego nie zrobił jeszcze)
        setJoystickSide(hasSavedSetting);
    }
}

window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id,
        e.gamepad.buttons.length, e.gamepad.axes.length);
    gamepadIndex = e.gamepad.index;
    playSound('Click');
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected from index %d: %s",
        e.gamepad.index, e.gamepad.id);
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
    }
});

// POPRAWKA: pollGamepad teraz tylko zwraca czyste dane osi i obsługuje Start
export function pollGamepad(game, uiData) {
    if (gamepadIndex === null) return { x: 0, y: 0, axes: [] };
    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp) return { x: 0, y: 0, axes: [] };

    let gx = gp.axes[0];
    let gy = gp.axes[1];
    if (Math.abs(gx) < GAMEPAD_DEADZONE) gx = 0;
    if (Math.abs(gy) < GAMEPAD_DEADZONE) gy = 0;

    const now = performance.now();

    // OBSŁUGA PRZYCISKU START (PAUZA) - Pozostawiona tutaj dla szybkości reakcji
    if (gp.buttons[9].pressed && now - lastBtnTime > 500) {
        lastBtnTime = now;
        if (game && game.paused && !game.inMenu) {
            resumeGame(game);
        } else if (game && !game.paused && !game.inMenu) {
            pauseGame(game, uiData.settings, uiData.player.weapons, uiData.player);
        }
    }

    // Zwracamy surowe dane dla menus.js
    return {
        x: gx,
        y: gy,
        axes: Array.from(gp.axes),
        buttons: Array.from(gp.buttons).map(b => b.pressed)
    };
}

// PRZYWRÓCONO: Niezbędna funkcja eksportowana do sprawdzania stanów przycisków
export function getGamepadButtonState() {
    if (gamepadIndex === null) return {};
    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp) return {};

    return {
        A: gp.buttons[0].pressed,
        B: gp.buttons[1].pressed,
        X: gp.buttons[2].pressed,
        Y: gp.buttons[3].pressed,
        LB: gp.buttons[4].pressed,
        RB: gp.buttons[5].pressed,
        LT: gp.buttons[6].pressed,
        RT: gp.buttons[7].pressed,
        Select: gp.buttons[8].pressed,
        Start: gp.buttons[9].pressed,
        Up: gp.buttons[12].pressed,
        Down: gp.buttons[13].pressed,
        Left: gp.buttons[14].pressed,
        Right: gp.buttons[15].pressed
    };
}

export function jVec() {
    let dx = 0, dy = 0;

    if (jActive && joyZone && !joyZone.classList.contains('off')) {
        let jx = jMoveX - jStartX;
        let jy = jMoveY - jStartY;
        const max = 50;
        let d = Math.hypot(jx, jy);
        if (d > max) { jx = jx / d * max; jy = jy / d * max; }
        dx += jx / max;
        dy += jy / max;
    }

    if (gamepadIndex !== null) {
        const gp = navigator.getGamepads()[gamepadIndex];
        if (gp) {
            let lx = gp.axes[0];
            let ly = gp.axes[1];
            if (Math.abs(lx) < GAMEPAD_DEADZONE) lx = 0;
            if (Math.abs(ly) < GAMEPAD_DEADZONE) ly = 0;
            dx += lx;
            dy += ly;

            if (gp.axes.length >= 4) {
                let rx = gp.axes[2];
                let ry = gp.axes[3];
                if (Math.abs(rx) < GAMEPAD_DEADZONE) rx = 0;
                if (Math.abs(ry) < GAMEPAD_DEADZONE) ry = 0;
                dx += rx;
                dy += ry;
            }

            if (gp.buttons[12] && gp.buttons[12].pressed) dy -= 1.0;
            if (gp.buttons[13] && gp.buttons[13].pressed) dy += 1.0;
            if (gp.buttons[14] && gp.buttons[14].pressed) dx -= 1.0;
            if (gp.buttons[15] && gp.buttons[15].pressed) dx += 1.0;
        }
    }

    const len = Math.hypot(dx, dy);
    if (len > 1.0) { dx /= len; dy /= len; }

    return { x: dx, y: dy };
}

export function setJoystickSide(side) {
    if (!joyZone) return;
    joyZone.classList.remove('off');
    if (side === 'off') { joyZone.classList.add('off'); }
    if (side === 'left') { joyZone.style.right = ''; joyZone.style.left = '20px'; }
    if (side === 'right') { joyZone.style.left = ''; joyZone.style.right = '20px'; }
}

function jSet(dx, dy) {
    if (!joy) return;
    const max = 50;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.style.left = (45 + dx) + 'px';
    joy.style.top = (45 + dy) + 'px';
}

function jStart(e) {
    if (!joyZone || joyZone.classList.contains('off')) return;
    jActive = true;
    initAudio();
    onJoyStart();
    const p = e.touches ? e.touches[0] : e;
    const r = joyZone.getBoundingClientRect();
    jStartX = p.clientX - r.left - 75;
    jStartY = p.clientY - r.top - 75;
    jMoveX = jStartX; jMoveY = jStartY; jSet(0, 0);
    e.preventDefault();
}

function jMove(e) {
    if (!jActive || !joyZone || joyZone.classList.contains('off')) return;
    const p = e.touches ? e.touches[0] : e;
    const r = joyZone.getBoundingClientRect();
    jMoveX = p.clientX - r.left - 75;
    jMoveY = p.clientY - r.top - 75;
    jSet(jMoveX - jStartX, jMoveY - jStartY);
    e.preventDefault();
}

function jEnd(e) {
    if (!jActive) return;
    jActive = false; jSet(0, 0); e.preventDefault();
    onJoyEnd();
}

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    initAudio();
    if (k === 'escape') onEscapePress();

    // FIX: Blokada domyślnych akcji przeglądarki
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', ' '].includes(k)) {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        const type = document.activeElement ? document.activeElement.type : '';

        // Zawsze blokuj ENTER i SPACE na przyciskach (blokada podwójnego kliku)
        // ORAZ blokuj strzałki Góra/Dół na suwakach (Range), żeby służyły do nawigacji, a nie zmiany wartości
        if ((tag !== 'INPUT' && tag !== 'TEXTAREA') || (tag === 'INPUT' && type === 'range' && (k === 'arrowup' || k === 'arrowdown'))) {
            e.preventDefault();
        }
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

if (joyZone) {
    joyZone.addEventListener('touchstart', jStart, { passive: false });
    joyZone.addEventListener('touchmove', jMove, { passive: false });
    joyZone.addEventListener('touchend', jEnd, { passive: false });
    joyZone.addEventListener('mousedown', jStart);
}
window.addEventListener('mousemove', jMove);
window.addEventListener('mouseup', jEnd);

export function getKeyboardForMenu() {
    return {
        Up: keys['arrowup'] || keys['w'],
        Down: keys['arrowdown'] || keys['s'],
        Left: keys['arrowleft'] || keys['a'],
        Right: keys['arrowright'] || keys['d'],
        A: keys['enter'] || keys[' '],
        B: keys['escape'] || keys['backspace']
    };
}