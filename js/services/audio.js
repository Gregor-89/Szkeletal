// ==============
// AUDIO.JS (v0.58 - Implementacja zasobów audio)
// Lokalizacja: /js/services/audio.js
// ==============

// --- Konfiguracja Web Audio API ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let master;
let isAudioInitialized = false;

// POPRAWKA v0.58: Lista zasobów audio i mapa na załadowane dźwięki
const loadedSounds = new Map();

const AUDIO_ASSET_LIST = [
    { id: 'Click', src: 'sounds/ui_click.wav' },
    { id: 'LevelUp', src: 'sounds/level_up.wav' },
    { id: 'PerkPick', src: 'sounds/perk_pick.wav' },
    { id: 'ChestOpen', src: 'sounds/chest_open.wav' },
    { id: 'ChestReward', src: 'sounds/chest_reward.wav' },
    { id: 'PlayerHurt', src: 'sounds/player_hurt.wav' },
    { id: 'Shoot', src: 'sounds/shoot.wav' },
    { id: 'Nova', src: 'sounds/nova.wav' },
    { id: 'XPPickup', src: 'sounds/xp_pickup.wav' },
    { id: 'HealPickup', src: 'sounds/heal.wav' },
    { id: 'MagnetPickup', src: 'sounds/magnet.wav' },
    { id: 'ShieldPickup', src: 'sounds/shield.wav' },
    { id: 'SpeedPickup', src: 'sounds/speed.wav' },
    { id: 'BombPickup', src: 'sounds/bomb.wav' },
    { id: 'FreezePickup', src: 'sounds/freeze.wav' },
    { id: 'EliteSpawn', src: 'sounds/elite_spawn.wav' },
];

/**
 * Inicjalizuje kontekst Web Audio.
 * Musi być wywołane przez zdarzenie użytkownika (np. kliknięcie).
 */
export function initAudio() {
    if (isAudioInitialized || !AudioCtx) return;
    
    try {
        audioCtx = new AudioCtx();
        master = audioCtx.createGain();
        master.gain.value = 0.09; // Domyślna głośność
        master.connect(audioCtx.destination);
        isAudioInitialized = true;
        console.log("Audio zinicjalizowane.");
    } catch (e) { 
        console.error("BŁĄD KRYTYCZNY: Nie można zainicjować Web Audio API.", e); 
    }
}

/**
 * NOWA FUNKCJA (v0.58): Ładuje pojedynczy plik audio.
 */
function loadSound(assetInfo) {
    return new Promise(async (resolve) => {
        if (!audioCtx) {
            console.warn(`[Audio] Kontekst audio niegotowy, pomijam ładowanie: ${assetInfo.id}`);
            loadedSounds.set(assetInfo.id, null);
            return resolve();
        }
        
        try {
            const response = await fetch(assetInfo.src);
            if (!response.ok) {
                throw new Error(`Nie znaleziono pliku (404): ${assetInfo.src}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            console.log(`[Audio] Załadowano: ${assetInfo.src}`);
            loadedSounds.set(assetInfo.id, audioBuffer);
            resolve();
            
        } catch (error) {
            console.warn(`[Audio] Nie można załadować: ${assetInfo.src}. Błąd: ${error.message}`);
            loadedSounds.set(assetInfo.id, null); // Ustaw na null, aby gra mogła użyć dźwięku proceduralnego
            resolve(); // Zawsze rozwiązuj, aby nie blokować gry
        }
    });
}

/**
 * NOWA FUNKCJA (v0.58): Ładuje wszystkie zasoby audio.
 */
export function loadAudio() {
    if (!isAudioInitialized) {
        console.warn("[Audio] Inicjalizacja audio pominięta przez użytkownika. Dźwięki nie zostaną załadowane.");
        return Promise.resolve(); // Zakończ natychmiast, jeśli audio nie jest włączone
    }
    
    console.log('[Audio] Rozpoczynam ładowanie zasobów audio...');
    const promises = AUDIO_ASSET_LIST.map(assetInfo => loadSound(assetInfo));
    
    return Promise.all(promises).then(() => {
        console.log(`[Audio] Zakończono ładowanie dźwięków.`);
    });
}

/**
 * Wewnętrzna funkcja do generowania dźwięków proceduralnych (Fallback).
 */
function tone(f = 440, type = 'sine', dur = 0.08, g = 0.12) {
    if (!audioCtx || !master || audioCtx.state !== 'running') {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.error("BŁĄD: Wznowienie kontekstu audio nie powiodło się:", e));
        }
        return; 
    }
    
    const now = audioCtx.currentTime;
    try {
        const o = audioCtx.createOscillator(); const gn = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, now); gn.gain.setValueAtTime(0, now);
        gn.gain.linearRampToValueAtTime(g, now + 0.005); gn.gain.linearRampToValueAtTime(0, now + dur);
        o.connect(gn); gn.connect(master); o.start(now); o.stop(now + dur + 0.01);
    } catch (e) { console.error("BŁĄD: Nie można odtworzyć dźwięku (tone):", e); }
}

/**
 * Odtwarza dźwięk na podstawie nazwy zdarzenia gry.
 * POPRAWKA v0.58: Najpierw próbuje odtworzyć załadowany plik, potem proceduralny.
 */
export function playSound(eventName) {
    if (!isAudioInitialized || !audioCtx) {
        initAudio();
        if (!isAudioInitialized) return; 
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // 1. Spróbuj odtworzyć załadowany zasób
    const buffer = loadedSounds.get(eventName);
    if (buffer) {
        try {
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(master);
            source.start(0);
            return; // Sukces, zakończ
        } catch (e) {
            console.error(`[Audio] Błąd odtwarzania ${eventName}:`, e);
            // Przejdź dalej, aby użyć dźwięku proceduralnego
        }
    }
    
    // 2. Jeśli nie ma załadowanego zasobu, użyj proceduralnego (tone) jako fallback
    switch (eventName) {
        // UI / Game
        case 'Click':
            tone(440, 'sine', 0.08, 0.12);
            break;
        case 'LevelUp':
            tone(700, 'triangle', 0.1, 0.1);
            break;
        case 'PerkPick':
            tone(520, 'square', 0.1, 0.08);
            break;
        case 'ChestOpen':
            tone(300, 'triangle', 0.18, 0.09);
            break;
        case 'ChestReward':
            tone(980, 'sawtooth', 0.16, 0.09);
            break;
            
        // Player / Weapon
        case 'PlayerHurt':
            tone(120, 'sawtooth', 0.08, 0.08);
            break;
        case 'Shoot':
            tone(900, 'triangle', 0.04, 0.06);
            break;
        case 'Nova':
            tone(680, 'square', 0.08, 0.07);
            break;

        // Pickups
        case 'XPPickup':
            tone(660, 'sine', 0.03, 0.05);
            break;
        case 'HealPickup':
            tone(500, 'square', 0.06, 0.06);
            break;
        case 'MagnetPickup':
            tone(300, 'triangle', 0.12, 0.07);
            break;
        case 'ShieldPickup':
            tone(360, 'sine', 0.1, 0.07);
            break;
        case 'SpeedPickup':
            tone(700, 'triangle', 0.08, 0.07);
            break;
        case 'BombPickup':
            tone(160, 'square', 0.12, 0.08);
            break;
        case 'FreezePickup':
            tone(260, 'sine', 0.12, 0.07);
            break;
            
        // Enemy
        case 'EliteSpawn':
            tone(300, 'sawtooth', 0.2, 0.1);
            break;
            
        default:
            console.warn(`AUDIO: Nieznane zdarzenie dźwiękowe (ani plik, ani tone): ${eventName}`);
            tone(200, 'square', 0.05, 0.05);
            break;
    }
}