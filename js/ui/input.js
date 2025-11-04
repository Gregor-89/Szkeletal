// ==============
// INPUT.JS (v0.55 - Reorganizacja folderów)
// Lokalizacja: /js/ui/input.js
// ==============

// POPRAWKA v0.55: Aktualizacja ścieżki importu
import { initAudio, playSound } from '../services/audio.js';

// === Referencje do DOM ===
const joyZone = document.getElementById('joystickZone');
const joy = document.getElementById('joystick');

// === Stan eksportowany ===
export const keys = {};

// === Stan wewnętrzny ===
let onEscapePress = () => {};
let onJoyStart = () => {};
let onJoyEnd = () => {};
let jActive = false, jStartX = 0, jStartY = 0, jMoveX = 0, jMoveY = 0;

// === Funkcje eksportowane ===

/**
 * Inicjalizuje moduł input, "wstrzykując" funkcje zwrotne z main.js.
 */
export function initInput(escapeFn, joyStartFn, joyEndFn) {
    onEscapePress = escapeFn;
    onJoyStart = joyStartFn;
    onJoyEnd = joyEndFn;
}

/**
 * Zwraca znormalizowany wektor ruchu joysticka (w zakresie -1 do 1).
 */
export function jVec() {
    if (!jActive || !joyZone || joyZone.classList.contains('off')) return { x: 0, y: 0 };
    let dx = jMoveX - jStartX, dy = jMoveY - jStartY;
    const max = 50;
    let d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    return { x: dx / max, y: dy / max };
}

/**
 * Ustawia pozycję joysticka (lewo/prawo/wyłączony).
 */
export function setJoystickSide(side) {
    if (!joyZone) return;
    joyZone.classList.remove('off');
    if (side === 'off') { joyZone.classList.add('off'); }
    if (side === 'left') { joyZone.style.right = ''; joyZone.style.left = '10px'; }
    if (side === 'right') { joyZone.style.left = ''; joyZone.style.right = '10px'; }
}

// === Funkcje wewnętrzne (Logika joysticka) ===

/**
 * Wewnętrzna funkcja do wizualnej aktualizacji pozycji dżojstika.
 */
function jSet(dx, dy) {
    if (!joy) return;
    const max = 50;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.style.left = (40 + dx) + 'px';
    joy.style.top = (40 + dy) + 'px';
}

/**
 * Handler zdarzenia startu joysticka.
 */
function jStart(e) {
    if (!joyZone || joyZone.classList.contains('off')) return;
    jActive = true;
    
    initAudio();
    onJoyStart();
    
    const p = e.touches ? e.touches[0] : e;
    const r = joyZone.getBoundingClientRect();
    jStartX = p.clientX - r.left - 70; jStartY = p.clientY - r.top - 70;
    jMoveX = jStartX; jMoveY = jStartY; jSet(0, 0);
    e.preventDefault();
    
    playSound('Click');
}

/**
 * Handler zdarzenia ruchu joysticka.
 */
function jMove(e) {
    if (!jActive || !joyZone || joyZone.classList.contains('off')) return;
    const p = e.touches ? e.touches[0] : e;
    const r = joyZone.getBoundingClientRect();
    jMoveX = p.clientX - r.left - 70; jMoveY = p.clientY - r.top - 70;
    jSet(jMoveX - jStartX, jMoveY - jStartY);
    e.preventDefault();
}

/**
 * Handler zdarzenia puszczenia joysticka.
 */
function jEnd(e) {
    if (!jActive) return;
    jActive = false; jSet(0, 0); e.preventDefault();
    onJoyEnd();
}

// === Nasłuchiwanie zdarzeń (Listenery) ===

// Klawiatura
document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    
    initAudio();
    playSound('Click');

    if (k === 'escape') {
        onEscapePress();
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Joystick (mysz + dotyk)
if (joyZone) {
    joyZone.addEventListener('touchstart', jStart, { passive: false });
    joyZone.addEventListener('touchmove', jMove, { passive: false });
    joyZone.addEventListener('touchend', jEnd, { passive: false });
    joyZone.addEventListener('mousedown', jStart);
}
window.addEventListener('mousemove', jMove);
window.addEventListener('mouseup', jEnd);