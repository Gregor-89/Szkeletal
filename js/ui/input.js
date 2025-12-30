// ==============
// INPUT.JS (v1.14 - Precision Deadzone & Menu Stick Support)
// Lokalizacja: /js/ui/input.js
// ==============

import { initAudio, playSound } from '../services/audio.js';

const joyZone = document.getElementById('joystickZone');
const joy = document.getElementById('joystick');

export const keys = {};

let onEscapePress = () => {};
let onJoyStart = () => {};
let onJoyEnd = () => {};
let jActive = false, jStartX = 0, jStartY = 0, jMoveX = 0, jMoveY = 0;

let gamepadIndex = null;
const GAMEPAD_DEADZONE = 0.25; // ZWIĘKSZONO dla stabilności menu

export function initInput(escapeFn, joyStartFn, joyEndFn) {
    onEscapePress = escapeFn;
    onJoyStart = joyStartFn;
    onJoyEnd = joyEndFn;
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

export function pollGamepad() {
    if (gamepadIndex === null) return null;
    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp) return null;
    return gp;
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

    const gp = pollGamepad();
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

    const len = Math.hypot(dx, dy);
    if (len > 1.0) {
        dx /= len;
        dy /= len;
    }

    return { x: dx, y: dy };
}

export function getGamepadButtonState() {
    const gp = pollGamepad();
    if (!gp) return {};

    const state = {
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
    return state;
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
    
    playSound('Click');
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
    if (k === 'escape') {
        onEscapePress();
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