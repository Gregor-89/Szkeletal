// ==============
// INPUT.JS (v0.95k - FIX: Center 75px/45px)
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

export function initInput(escapeFn, joyStartFn, joyEndFn) {
    onEscapePress = escapeFn;
    onJoyStart = joyStartFn;
    onJoyEnd = joyEndFn;
}

export function jVec() {
    if (!jActive || !joyZone || joyZone.classList.contains('off')) return { x: 0, y: 0 };
    let dx = jMoveX - jStartX, dy = jMoveY - jStartY;
    const max = 50;
    let d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    return { x: dx / max, y: dy / max };
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
    // FIX: 45 to środek dla joysticka 60px w kontenerze 150px (75 - 30)
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
    
    // FIX: 75 to połowa szerokości strefy (150/2)
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
    // FIX: 75 to połowa szerokości strefy
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
    // playSound('Click'); // Opcjonalnie, może być irytujące przy każdym klawiszu
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