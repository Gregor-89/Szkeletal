// ==============
// AUDIO.JS (v0.94m - FIX: Better Hit Sound)
// Lokalizacja: /js/services/audio.js
// ==============

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let master;
let isAudioInitialized = false;
let isLoadTriggered = false;
const loadedSounds = new Map();

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

function tone(f = 440, type = 'sine', dur = 0.08, g = 0.12, slideTo = null) {
    if (!audioCtx || !master || audioCtx.state !== 'running') {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        return; 
    }
    const now = audioCtx.currentTime;
    try {
        const o = audioCtx.createOscillator(); const gn = audioCtx.createGain();
        o.type = type; 
        o.frequency.setValueAtTime(f, now); 
        
        if (slideTo !== null) {
            o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + dur);
        }

        gn.gain.setValueAtTime(0, now);
        gn.gain.linearRampToValueAtTime(g, now + 0.01); 
        gn.gain.exponentialRampToValueAtTime(0.001, now + dur);
        
        o.connect(gn); gn.connect(master); o.start(now); o.stop(now + dur + 0.05);
    } catch (e) {}
}

export function playSound(eventName) {
    if (!isAudioInitialized || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = performance.now();
    const lastTime = lastPlayTime.get(eventName) || 0;
    const throttleTime = (eventName === 'Hit' || eventName === 'Nova') ? 50 : 100; 
    
    if (now - lastTime < throttleTime) return; 
    lastPlayTime.set(eventName, now);

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
    
    // ULEPSZONE FALLBACKI
    switch (eventName) {
        case 'Click': tone(440, 'sine', 0.08, 0.1); break;
        case 'LevelUp': tone(600, 'triangle', 0.3, 0.15, 880); break; 
        case 'PerkPick': tone(520, 'square', 0.1, 0.08); break;
        case 'ChestOpen': tone(300, 'triangle', 0.2, 0.1, 600); break;
        case 'ChestReward': tone(880, 'sawtooth', 0.2, 0.1); break;
        case 'PlayerHurt': tone(150, 'sawtooth', 0.1, 0.1, 50); break; 
        case 'Shoot': tone(800, 'triangle', 0.05, 0.05, 400); break; 
        case 'Nova': tone(600, 'square', 0.1, 0.05, 200); break;
        case 'Whip': tone(900, 'triangle', 0.1, 0.08, 100); break; 
        case 'ChainLightning': tone(1200, 'sawtooth', 0.15, 0.05, 400); break;
        
        case 'Gem':
        case 'XPPickup': tone(800, 'sine', 0.05, 0.05, 1200); break; 
        
        case 'HealPickup': tone(400, 'square', 0.1, 0.1, 600); break;
        case 'MagnetPickup': tone(300, 'triangle', 0.15, 0.1); break;
        case 'ShieldPickup': tone(200, 'sine', 0.2, 0.1, 400); break;
        case 'SpeedPickup': tone(600, 'triangle', 0.1, 0.1); break;
        case 'BombPickup': tone(100, 'square', 0.2, 0.1); break;
        case 'FreezePickup': tone(1000, 'sine', 0.2, 0.05, 200); break;
        case 'EliteSpawn': tone(200, 'sawtooth', 0.5, 0.2, 50); break; 
        
        // FIX: Nowy dźwięk trafienia (głębszy i krótszy)
        case 'Hit': 
            tone(100 + Math.random()*50, 'sawtooth', 0.04, 0.08, 50); 
            break;
            
        case 'Explosion':
            tone(150, 'sawtooth', 0.4, 0.3, 10); 
            break;
            
        default: break;
    }
}