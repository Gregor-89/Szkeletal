// ==============
// INPUT.JS (v1.05 - Gamepad Support)
// Lokalizacja: /js/ui/input.js
// ==============

export const keys = {};
export let joystickVector = { x: 0, y: 0 };
let joystickSide = 'right';

// --- GAMEPAD STATE ---
let activeGamepadIndex = null;
const AXIS_THRESHOLD = 0.2; // Martwa strefa gałki

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Wykrywanie podłączenia pada
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad.id);
    activeGamepadIndex = e.gamepad.index;
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected");
    if (activeGamepadIndex === e.gamepad.index) {
        activeGamepadIndex = null;
    }
});

// Funkcja pomocnicza dla Menus.js do pobierania stanu przycisków
// Mapowanie standardowe (Xbox/PlayStation): 0=A/X, 1=B/O, 12=Up, 13=Down, 14=Left, 15=Right
export function getGamepadState() {
    if (activeGamepadIndex === null) return null;
    const gp = navigator.getGamepads()[activeGamepadIndex];
    if (!gp) return null;

    return {
        a: gp.buttons[0].pressed,      // A / Cross
        b: gp.buttons[1].pressed,      // B / Circle
        up: gp.buttons[12].pressed || gp.axes[1] < -0.5,
        down: gp.buttons[13].pressed || gp.axes[1] > 0.5,
        left: gp.buttons[14].pressed || gp.axes[0] < -0.5,
        right: gp.buttons[15].pressed || gp.axes[0] > 0.5,
        start: gp.buttons[9].pressed,  // Start / Options
        select: gp.buttons[8].pressed  // Select / Share
    };
}

export function setJoystickSide(side) {
    joystickSide = side;
    const zone = document.getElementById('joystickZone');
    const base = document.getElementById('joystickBase');
    const stick = document.getElementById('joystick');
    
    if (side === 'off') {
        if(zone) zone.classList.add('off');
        return;
    }
    
    if(zone) {
        zone.classList.remove('off');
        if (side === 'left') {
            zone.style.left = '20px';
            zone.style.right = 'auto';
        } else {
            zone.style.left = 'auto';
            zone.style.right = '20px';
        }
    }
    
    // Reset pozycji
    joystickVector = { x:0, y:0 };
    if(stick) {
        stick.style.top = '45px';
        stick.style.left = '45px';
    }
}

// Inicjalizacja dotykowego joysticka
const zone = document.getElementById('joystickZone');
if (zone) {
    const base = document.getElementById('joystickBase');
    const stick = document.getElementById('joystick');
    
    let touchId = null;
    let startX = 0, startY = 0;
    
    zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;
        
        // Wyśrodkowanie pod palcem dla lepszego UX
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Opcjonalnie: przesunięcie joysticka pod palec (tu: uproszczone, bazujemy na środku)
    }, {passive: false});
    
    zone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i=0; i<e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                const touch = e.changedTouches[i];
                let dx = touch.clientX - startX;
                let dy = touch.clientY - startY;
                
                const maxDist = 45; 
                const dist = Math.hypot(dx, dy);
                
                if (dist > maxDist) {
                    const ratio = maxDist / dist;
                    dx *= ratio;
                    dy *= ratio;
                }
                
                joystickVector.x = dx / maxDist; 
                joystickVector.y = dy / maxDist;
                
                stick.style.left = (45 + dx) + 'px';
                stick.style.top = (45 + dy) + 'px';
            }
        }
    }, {passive: false});
    
    const endTouch = (e) => {
        e.preventDefault();
        for (let i=0; i<e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                joystickVector = { x: 0, y: 0 };
                stick.style.left = '45px';
                stick.style.top = '45px';
            }
        }
    };
    
    zone.addEventListener('touchend', endTouch);
    zone.addEventListener('touchcancel', endTouch);
}

// ZMIANA: jVec teraz łączy klawiaturę, dotyk ORAZ gamepad
export function jVec() {
    let dx = 0;
    let dy = 0;

    // 1. Klawiatura
    if (keys['ArrowUp'] || keys['w']) dy -= 1;
    if (keys['ArrowDown'] || keys['s']) dy += 1;
    if (keys['ArrowLeft'] || keys['a']) dx -= 1;
    if (keys['ArrowRight'] || keys['d']) dx += 1;

    // 2. Dotykowy Joystick
    if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        dx = joystickVector.x;
        dy = joystickVector.y;
    }

    // 3. Gamepad (Analog)
    if (activeGamepadIndex !== null) {
        const gp = navigator.getGamepads()[activeGamepadIndex];
        if (gp) {
            // Lewa gałka (axes 0 i 1)
            const axisX = gp.axes[0];
            const axisY = gp.axes[1];
            
            if (Math.abs(axisX) > AXIS_THRESHOLD) dx = axisX;
            if (Math.abs(axisY) > AXIS_THRESHOLD) dy = axisY;
            
            // D-Pad (jako przyciski)
            if (gp.buttons[12].pressed) dy = -1;
            if (gp.buttons[13].pressed) dy = 1;
            if (gp.buttons[14].pressed) dx = -1;
            if (gp.buttons[15].pressed) dx = 1;
        }
    }

    // Normalizacja wektora (żeby po skosie nie było szybciej, chyba że to analog)
    // Jeśli sterowanie jest cyfrowe (klawiatura/dpad), normalizujemy do długości 1
    // Jeśli analogowe (gałka), zachowujemy wychylenie (np. wolny chód)
    const len = Math.hypot(dx, dy);
    if (len > 1.0) {
        dx /= len;
        dy /= len;
    }

    return { x: dx, y: dy };
}