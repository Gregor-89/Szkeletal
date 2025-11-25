// ==============
// AUDIO.JS (v0.94f - FIX: Audio Throttling)
// Lokalizacja: /js/services/audio.js
// ==============

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let master;
let isAudioInitialized = false;
let isLoadTriggered = false;
const loadedSounds = new Map();

// FIX: Mapa do śledzenia ostatniego czasu odtworzenia dźwięku
const lastPlayTime = new Map();

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
    { id: 'Whip', src: 'sounds/whip_crack.wav' },
    { id: 'ChainLightning', src: 'sounds/lightning.wav' },
    { id: 'Hit', src: 'sounds/hit.wav' },
    { id: 'Explosion', src: 'sounds/explosion.wav' }
];

export function initAudio() {
    if (isAudioInitialized || !AudioCtx) return;
    
    try {
        audioCtx = new AudioCtx();
        master = audioCtx.createGain();
        master.gain.value = 0.3; 
        master.connect(audioCtx.destination);
        isAudioInitialized = true;
        
        if (!isLoadTriggered) {
            loadAudio();
        }
    } catch (e) { 
        console.error("BŁĄD KRYTYCZNY AUDIO:", e); 
    }
}

function loadSound(assetInfo) {
    return new Promise(async (resolve) => {
        if (!audioCtx) {
            loadedSounds.set(assetInfo.id, null);
            return resolve();
        }
        try {
            const response = await fetch(assetInfo.src);
            if (!response.ok) throw new Error(`404: ${assetInfo.src}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            loadedSounds.set(assetInfo.id, audioBuffer);
            resolve();
        } catch (error) {
            loadedSounds.set(assetInfo.id, null);
            resolve();
        }
    });
}

export function loadAudio() {
    if (!isAudioInitialized) return Promise.resolve();
    if (isLoadTriggered) return Promise.resolve();
    isLoadTriggered = true;
    const promises = AUDIO_ASSET_LIST.map(assetInfo => loadSound(assetInfo));
    return Promise.all(promises);
}

function tone(f = 440, type = 'sine', dur = 0.08, g = 0.12) {
    if (!audioCtx || !master || audioCtx.state !== 'running') {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        return; 
    }
    const now = audioCtx.currentTime;
    try {
        const o = audioCtx.createOscillator(); const gn = audioCtx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, now); gn.gain.setValueAtTime(0, now);
        gn.gain.linearRampToValueAtTime(g, now + 0.005); gn.gain.linearRampToValueAtTime(0, now + dur);
        o.connect(gn); gn.connect(master); o.start(now); o.stop(now + dur + 0.01);
    } catch (e) {}
}

export function playSound(eventName) {
    if (!isAudioInitialized || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // FIX: Throttling (ograniczenie częstotliwości)
    const now = performance.now();
    const lastTime = lastPlayTime.get(eventName) || 0;
    const throttleTime = (eventName === 'Hit' || eventName === 'Nova') ? 50 : 100; // 50ms dla częstych, 100ms dla reszty
    
    if (now - lastTime < throttleTime) return; // Pomiń, jeśli za szybko
    lastPlayTime.set(eventName, now);

    // Mapowanie (jeśli potrzeba)
    let targetAsset = eventName;
    if (eventName === 'Gem') targetAsset = 'XPPickup';

    const buffer = loadedSounds.get(targetAsset);
    if (buffer) {
        try {
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(master);
            source.start(0);
            return; 
        } catch (e) {}
    }
    
    // Fallbacki
    switch (eventName) {
        case 'Click': tone(440, 'sine', 0.08, 0.12); break;
        case 'LevelUp': tone(700, 'triangle', 0.1, 0.1); break;
        case 'PerkPick': tone(520, 'square', 0.1, 0.08); break;
        case 'ChestOpen': tone(300, 'triangle', 0.18, 0.09); break;
        case 'ChestReward': tone(980, 'sawtooth', 0.16, 0.09); break;
        case 'PlayerHurt': tone(120, 'sawtooth', 0.08, 0.08); break;
        case 'Shoot': tone(900, 'triangle', 0.04, 0.06); break;
        case 'Nova': tone(680, 'square', 0.08, 0.07); break;
        case 'Whip': tone(1200, 'triangle', 0.06, 0.08); break;
        case 'ChainLightning': tone(1500, 'sawtooth', 0.1, 0.1); break;
        case 'Gem':
        case 'XPPickup': tone(660, 'sine', 0.03, 0.05); break;
        case 'HealPickup': tone(500, 'square', 0.06, 0.06); break;
        case 'MagnetPickup': tone(300, 'triangle', 0.12, 0.07); break;
        case 'ShieldPickup': tone(360, 'sine', 0.1, 0.07); break;
        case 'SpeedPickup': tone(700, 'triangle', 0.08, 0.07); break;
        case 'BombPickup': tone(160, 'square', 0.12, 0.08); break;
        case 'FreezePickup': tone(260, 'sine', 0.12, 0.07); break;
        case 'EliteSpawn': tone(300, 'sawtooth', 0.2, 0.1); break;
        case 'Hit': tone(150 + Math.random()*50, 'square', 0.05, 0.05); break;
        case 'Explosion': tone(60, 'sawtooth', 0.3, 0.2); break;
        default: break;
    }
}