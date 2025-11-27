// ==============
// AUDIO.JS (v0.98 - Loading Progress)
// Lokalizacja: /js/services/audio.js
// ==============

import { MUSIC_CONFIG } from '../config/gameData.js';

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let master; 
let musicGain; 
let isAudioInitialized = false;
let isLoadTriggered = false;
const loadedSounds = new Map();
const lastPlayTime = new Map(); 

// SFX ASSETS
const AUDIO_ASSET_LIST = [
    { id: 'Click', src: 'sounds/ui_click.mp3' },
    { id: 'LevelUp', src: 'sounds/level_up.mp3' },
    { id: 'PerkPick', src: 'sounds/perk_pick.mp3' },
    { id: 'ChestOpen', src: 'sounds/chest_open.mp3' },
    { id: 'ChestReward', src: 'sounds/chest_reward.mp3' },
    { id: 'PlayerHurt', src: 'sounds/player_hurt.mp3' },
    { id: 'Shoot', src: 'sounds/shoot.mp3' },
    { id: 'Nova', src: 'sounds/nova.mp3' },
    { id: 'XPPickup', src: 'sounds/xp_pickup.mp3' },
    { id: 'HealPickup', src: 'sounds/heal.mp3' },
    { id: 'MagnetPickup', src: 'sounds/magnet.mp3' },
    { id: 'ShieldPickup', src: 'sounds/shield.mp3' },
    { id: 'SpeedPickup', src: 'sounds/speed.mp3' },
    { id: 'BombPickup', src: 'sounds/bomb.mp3' },
    { id: 'FreezePickup', src: 'sounds/freeze.mp3' },
    { id: 'EliteSpawn', src: 'sounds/elite_spawn.mp3' },
    { id: 'Whip', src: 'sounds/whip_crack.mp3' },
    { id: 'ChainLightning', src: 'sounds/lightning.mp3' },
    { id: 'Hit', src: 'sounds/hit.mp3' },
    { id: 'Explosion', src: 'sounds/explosion.mp3' }
];

// --- MUSIC MANAGER SYSTEM ---
const MusicManager = {
    currentContext: null, 
    currentSource: null,
    currentGain: null,
    playRequestId: 0, 
    
    bags: {
        menu: [],
        gameplay: []
    },

    init() {
        this.bags.menu = [];
        this.bags.gameplay = [];
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    getNextTrack(context) {
        let bag = this.bags[context];
        const masterList = (context === 'menu') ? MUSIC_CONFIG.MENU_PLAYLIST : MUSIC_CONFIG.GAMEPLAY_PLAYLIST;

        if (!masterList || masterList.length === 0) return null;

        if (bag.length === 0) {
            console.log(`[Audio] Tasowanie playlisty dla: ${context}`);
            bag = [...masterList]; 
            if (masterList.length > 1) {
                this.shuffleArray(bag);
            }
            this.bags[context] = bag;
        }

        return this.bags[context].pop();
    },

    async play(context) {
        if (!audioCtx) return;
        
        if (context === this.currentContext && this.currentSource) return; 

        const myRequestId = ++this.playRequestId;
        this.stop(MUSIC_CONFIG.FADE_TIME, false); 

        this.currentContext = context;
        const trackName = this.getNextTrack(context);
        
        if (!trackName) {
            console.warn(`[Audio] Brak piosenek w playliście: ${context}`);
            return;
        }

        const folder = (context === 'menu') ? 'sounds/menu/' : 'sounds/gameplay/';
        const src = folder + trackName;

        console.log(`[Audio] Odtwarzanie: ${src} (ReqID: ${myRequestId})`);

        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error('404');
            const arrayBuffer = await response.arrayBuffer();
            
            if (this.playRequestId !== myRequestId) return;

            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            if (this.playRequestId !== myRequestId) {
                console.log(`[Audio] Anulowano odtwarzanie ${src} (Zestarzałe żądanie)`);
                return;
            }

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0; 
            
            source.connect(gainNode);
            gainNode.connect(musicGain); 

            source.start(0);
            
            gainNode.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + MUSIC_CONFIG.FADE_TIME);

            this.currentSource = source;
            this.currentGain = gainNode;

            source.onended = () => {
                if (this.currentSource === source && this.playRequestId === myRequestId) { 
                    console.log('[Audio] Utwór zakończony, losuję następny...');
                    this.currentSource = null; 
                    const savedContext = this.currentContext;
                    this.currentContext = null; 
                    this.play(savedContext);
                }
            };

        } catch (e) {
            console.error(`[Audio] Błąd ładowania muzyki: ${src}`, e);
            if (this.playRequestId === myRequestId) {
                setTimeout(() => {
                    if (this.playRequestId === myRequestId) {
                        this.currentContext = null;
                        this.play(context);
                    }
                }, 1000);
            }
        }
    },

    stop(fadeTime = 0.5, incrementId = true) {
        if (incrementId) {
            this.playRequestId++;
            this.currentContext = null;
        }

        if (this.currentSource && this.currentGain) {
            const oldSource = this.currentSource;
            const oldGain = this.currentGain;
            
            this.currentSource = null; 

            try {
                oldGain.gain.cancelScheduledValues(audioCtx.currentTime);
                oldGain.gain.setValueAtTime(oldGain.gain.value, audioCtx.currentTime);
                oldGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeTime);
                
                setTimeout(() => {
                    try {
                        oldSource.stop();
                        oldSource.disconnect();
                    } catch(e) {}
                }, fadeTime * 1000 + 50);
            } catch(e) {}
        }
    }
};

// --- CORE AUDIO FUNCTIONS ---

export function initAudio() {
    if (isAudioInitialized || !AudioCtx) return;
    
    try {
        audioCtx = new AudioCtx();
        
        master = audioCtx.createGain();
        master.gain.value = 0.3; 
        master.connect(audioCtx.destination);

        musicGain = audioCtx.createGain();
        musicGain.gain.value = MUSIC_CONFIG.VOLUME || 0.4;
        musicGain.connect(audioCtx.destination); 

        MusicManager.init();
        isAudioInitialized = true;
        
        if (!isLoadTriggered) {
            // Jeśli initAudio jest wołane ręcznie później (np. przez user interaction), 
            // a nie było loadingu, odpalamy teraz (bez progressu)
            loadAudio(); 
        }
    } catch (e) { 
        console.error("BŁĄD KRYTYCZNY AUDIO:", e); 
    }
}

export function setMusicVolume(val) {
    if (musicGain) musicGain.gain.value = val;
    MUSIC_CONFIG.VOLUME = val; 
}

export function setSfxVolume(val) {
    if (master) master.gain.value = val;
}

function loadSound(assetInfo) {
    return new Promise(async (resolve) => {
        // Jeśli brak AudioContext, udajemy że załadowano (cicha gra)
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

// FIX v0.98: loadAudio z obsługą onProgress
export function loadAudio(onProgress) {
    if (!isAudioInitialized) return Promise.resolve();
    if (isLoadTriggered) return Promise.resolve();
    isLoadTriggered = true;
    
    // Eksportuj liczbę dźwięków dla loadera
    loadAudio.totalSounds = AUDIO_ASSET_LIST.length;

    const promises = AUDIO_ASSET_LIST.map(assetInfo => {
        return loadSound(assetInfo).then(() => {
            if (onProgress) onProgress();
        });
    });
    
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
        if (slideTo !== null) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + dur);
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

    if (eventName === 'MusicMenu') { MusicManager.play('menu'); return; }
    if (eventName === 'MusicGameplay') { MusicManager.play('gameplay'); return; }
    if (eventName === 'MusicStop') { MusicManager.stop(); return; }

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
        case 'Hit': tone(100 + Math.random()*50, 'sawtooth', 0.04, 0.08, 50); break;
        case 'Explosion': tone(150, 'sawtooth', 0.4, 0.3, 10); break;
        default: break;
    }
}