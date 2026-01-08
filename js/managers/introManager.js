// ==============
// INTROMANAGER.JS (v1.01b - Intro Controls Localization)
// Lokalizacja: /js/managers/introManager.js
// ==============

import { get as getAsset } from '../services/assets.js';
import { playSound } from '../services/audio.js';
import { introOverlay, introImage, btnIntroNext, btnIntroSkip, btnIntroPrev } from '../ui/domElements.js';
import { getLang } from '../services/i18n.js';

const INTRO_SLIDES = [
    'intro_1',
    'intro_2',
    'intro_3'
];

let currentSlideIndex = 0;
let gameStateRef = null;

function markIntroAsSeen() {
    if (gameStateRef && gameStateRef.game) {
        gameStateRef.game.introSeen = true;
        localStorage.setItem('szkeletalIntroSeen', 'true');
    }
}

function loadSlide(index) {
    if (index < 0 || index >= INTRO_SLIDES.length) {
        finishIntro();
        return;
    }
    
    currentSlideIndex = index;
    const imageKey = INTRO_SLIDES[index];
    
    const asset = getAsset(imageKey);
    if (asset) {
        introImage.src = asset.src;
    } else {
        introImage.src = '';
    }
    
    if (btnIntroPrev) {
        btnIntroPrev.style.display = (index === 0) ? 'none' : 'inline-block';
        // ZMIANA v0.110f: Lokalizacja przycisku Wstecz
        btnIntroPrev.textContent = getLang('ui_intro_prev') || "WSTECZ";
    }
    
    if (btnIntroNext) {
        if (index === INTRO_SLIDES.length - 1) {
            btnIntroNext.textContent = getLang('ui_intro_finish') || "MENU";
        } else {
            btnIntroNext.textContent = getLang('ui_intro_next') || "DALEJ";
        }
    }
    
    // ZMIANA v0.110f: Lokalizacja przycisku Pomiń
    if (btnIntroSkip) {
        btnIntroSkip.textContent = getLang('ui_intro_skip') || "POMIŃ";
    }
    
    if (index > 0) playSound('Click');
}

function nextSlide() {
    currentSlideIndex++;
    loadSlide(currentSlideIndex);
}

function prevSlide() {
    currentSlideIndex--;
    loadSlide(currentSlideIndex);
}

function finishIntro() {
    markIntroAsSeen();
    introOverlay.style.display = 'none';
    
    if (window.wrappedShowMenu) {
        window.wrappedShowMenu(false);
    }
}

export function initializeIntro(stateRef) {
    gameStateRef = stateRef;
    
    gameStateRef.game.introSeen = localStorage.getItem('szkeletalIntroSeen') === 'true';
    
    if (btnIntroNext) {
        btnIntroNext.onclick = nextSlide;
    }
    if (btnIntroPrev) {
        btnIntroPrev.onclick = prevSlide;
    }
    if (btnIntroSkip) {
        btnIntroSkip.onclick = finishIntro;
    }
    
    document.addEventListener('keydown', (e) => {
        if (gameStateRef.game.paused && introOverlay.style.display === 'flex') {
            if (e.key === 'Escape') {
                finishIntro();
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        }
    });
    
    console.log(`[IntroManager] Stan introSeen: ${gameStateRef.game.introSeen}`);
    
    if (!gameStateRef.game.introSeen) {
        displayIntro();
    } else {
        window.wrappedShowMenu(false);
    }
}

export function displayIntro() {
    if (!gameStateRef) return;
    
    gameStateRef.game.paused = true;
    introOverlay.style.display = 'flex';
    
    playSound('MusicIntro');
    
    currentSlideIndex = 0;
    loadSlide(currentSlideIndex);
}

window.wrappedDisplayIntro = displayIntro;