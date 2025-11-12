// ==============
// INTROMANAGER.JS (v0.87b - Refaktoryzacja: Tylko Obrazy, Nawigacja, Przejście do Menu)
// Lokalizacja: /js/managers/introManager.js
// ==============

import { get as getAsset } from '../services/assets.js';
import { playSound } from '../services/audio.js';
// POPRAWKA v0.87b: Dodano btnIntroPrev, usunięto introText
import { introOverlay, introImage, btnIntroNext, btnIntroSkip, btnIntroPrev } from '../ui/domElements.js';

// Definicja slajdów (tylko klucze obrazów)
const INTRO_SLIDES = [
    'intro_1',
    'intro_2',
    'intro_3'
];

let currentSlideIndex = 0;
let gameStateRef = null;
// Usunięto startRunCallback

/**
 * Ustawia stan gry jako 'Intro widziane'.
 */
function markIntroAsSeen() {
    if (gameStateRef && gameStateRef.game) {
        gameStateRef.game.introSeen = true;
        // Opcjonalnie: zapisz stan w Local Storage, aby przetrwał odświeżenia przeglądarki
        localStorage.setItem('szkeletalIntroSeen', 'true');
    }
}

/**
 * Wczytuje i wyświetla pojedynczy slajd.
 */
function loadSlide(index) {
    if (index < 0 || index >= INTRO_SLIDES.length) {
        // Jeśli wyjdziemy poza zakres (np. z ostatniego slajdu), zakończ
        finishIntro();
        return;
    }
    
    currentSlideIndex = index;
    const imageKey = INTRO_SLIDES[index];
    
    // Ustawienie obrazu (używa klucza z assets.js)
    const asset = getAsset(imageKey);
    if (asset) {
        // POPRAWKA v0.87b: Ustawienie 'src' tagu <img> (dla pinch-to-zoom)
        introImage.src = asset.src;
    } else {
        introImage.src = ''; // Wyczyść obraz, jeśli go nie ma
    }
    
    // Aktualizacja widoczności przycisków nawigacji
    if (btnIntroPrev) {
        btnIntroPrev.style.display = (index === 0) ? 'none' : 'inline-block';
    }
    
    // Zmiana tekstu przycisku "Dalej"
    if (btnIntroNext) {
        if (index === INTRO_SLIDES.length - 1) {
            btnIntroNext.textContent = 'Do Menu Głównego ▶️';
        } else {
            btnIntroNext.textContent = 'Dalej';
        }
    }
    
    // Odtwórz dźwięk przejścia (jeśli nie jest to pierwszy slajd)
    if (index > 0) playSound('Click');
}

/**
 * Przechodzi do następnego slajdu lub kończy.
 */
function nextSlide() {
    currentSlideIndex++;
    loadSlide(currentSlideIndex);
}

/**
 * Przechodzi do poprzedniego slajdu.
 */
function prevSlide() {
    currentSlideIndex--;
    loadSlide(currentSlideIndex);
}

/**
 * Kończy sekwencję intro i przechodzi do Menu Głównego.
 */
function finishIntro() {
    markIntroAsSeen();
    introOverlay.style.display = 'none';
    
    // POPRAWKA v0.87b: Zawsze przechodź do menu głównego
    if (window.wrappedShowMenu) {
        window.wrappedShowMenu(false); // Pokaż menu główne (bez opcji "Kontynuuj")
    }
}

/**
 * Inicjalizuje modal intro i sprawdza, czy ma być wyświetlone.
 */
export function initializeIntro(stateRef) {
    gameStateRef = stateRef;
    
    // Sprawdź stan (czy intro zostało już kiedykolwiek obejrzane)
    gameStateRef.game.introSeen = localStorage.getItem('szkeletalIntroSeen') === 'true';
    
    // Podepnij eventy do przycisków
    if (btnIntroNext) {
        btnIntroNext.onclick = nextSlide;
    }
    if (btnIntroPrev) {
        btnIntroPrev.onclick = prevSlide;
    }
    if (btnIntroSkip) {
        btnIntroSkip.onclick = finishIntro; // Przycisk "Pomiń" teraz zamyka i idzie do menu
    }
    
    // Umożliwienie nawigacji klawiszami
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
        // Jeśli intro nie było widziane, wyświetl je.
        displayIntro();
    } else {
        // Jeśli było widziane, po prostu pokaż menu główne.
        window.wrappedShowMenu(false);
    }
}

/**
 * Wyświetla modal intro (może być wywołane z menu).
 */
export function displayIntro() {
    if (!gameStateRef) return;
    
    // Pauzuj grę i pokaż modal
    gameStateRef.game.paused = true;
    introOverlay.style.display = 'flex';
    
    currentSlideIndex = 0;
    loadSlide(currentSlideIndex);
}

// Udostępnienie na zewnątrz dla menu
window.wrappedDisplayIntro = displayIntro;