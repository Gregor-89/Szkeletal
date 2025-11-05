// ==============
// SCOREMANAGER.JS (v0.70 - Refaktoryzacja: Wydzielenie logiki wyników z ui.js)
// Lokalizacja: /js/services/scoreManager.js
// ==============

// Import referencji DOM potrzebnych do wyświetlania wyników i modali
import {
    confirmOverlay, confirmText, btnConfirmYes, btnConfirmNo
} from '../ui/domElements.js';

// --- FUNKCJE POMOCNICZE (PRZENIESIONE Z UI.JS) ---

/**
 * Formatuje czas na "Xm Ys"
 */
export function formatTime(totalSeconds) {
    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

// --- TABLICA WYNIKÓW (PRZENIESIONE Z UI.JS) ---

export function saveScore(currentRun) {
    try {
        const scores = JSON.parse(localStorage.getItem('szketalScores') || '[]');
        scores.push(currentRun);
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10);
        localStorage.setItem('szketalScores', JSON.stringify(scores));
    } catch (e) {
        console.error("BŁĄD: Nie można zapisać wyniku:", e);
    }
}

export function displayScores(targetId, highlightRun = null) {
    // UWAGA: Ta funkcja jest teraz zależna od DOM ładowanego dynamicznie.
    // Działa, ponieważ jest wywoływana dopiero po załadowaniu menu (w showMenu)
    // lub na ekranie game over (który jest zawsze załadowany).
    const scoresBody = document.getElementById(targetId);
    const scoresContainer = scoresBody ? scoresBody.closest('.scores-container') : null; 

    if (!scoresBody || !scoresContainer) {
        // Cicha awaria, jeśli DOM jeszcze nie istnieje (np. podczas testów)
        return;
    }

    try {
        const scores = JSON.parse(localStorage.getItem('szketalScores') || '[]');

        if (scores.length === 0) {
            scoresContainer.style.display = 'none';
            return; 
        } else {
            scoresContainer.style.display = 'block'; 
        }

        scoresBody.innerHTML = '';
        scores.forEach((s, idx) => {
            const tr = document.createElement('tr');
            
            if (highlightRun && 
                s.score === highlightRun.score && 
                s.level === highlightRun.level && 
                s.time === highlightRun.time) {
                tr.className = 'highlight-score';
                highlightRun = null; 
            }
            
            const formattedTime = formatTime(s.time);
            tr.innerHTML = `<td>${idx + 1}</td><td>${s.score}</td><td>${s.level}</td><td>${formattedTime}</td>`;
            scoresBody.appendChild(tr);
        });
    } catch (e) {
        console.error("BŁĄD: Nie można wyświetlić wyników:", e);
    }
}

function showConfirmModal(text, onConfirm) {
    if (!confirmOverlay || !confirmText || !btnConfirmYes || !btnConfirmNo) {
        console.error("BŁĄD: Brakuje elementów DOM dla modala potwierdzenia.");
        // Fallback na natywny alert, jeśli DOM zawiedzie
        if (confirm(text)) {
            onConfirm();
        }
        return;
    }
    
    confirmText.textContent = text;
    confirmOverlay.style.display = 'flex';

    btnConfirmYes.onclick = () => {
        confirmOverlay.style.display = 'none';
        onConfirm(); 
    };
    
    btnConfirmNo.onclick = () => {
        confirmOverlay.style.display = 'none';
    };
}

export function attachClearScoresListeners() {
    // Ta funkcja musi być wywoływana PO załadowaniu dynamicznego HTML menu
    document.querySelectorAll('.btn-clear-scores').forEach(button => {
        button.onclick = () => {
            const clearScoresAction = () => {
                try {
                    localStorage.removeItem('szketalScores');
                    console.log("Tablica wyników wyczyszczona.");
                    displayScores('scoresBodyMenu');
                    displayScores('scoresBodyGameOver');
                } catch (e) {
                    console.error("BŁĄD: Nie można wyczyścić tablicy wyników:", e);
                    alert("Wystąpił błąd podczas czyszczenia wyników.");
                }
            };

            showConfirmModal(
                "Czy na pewno chcesz wyzerować tablicę wyników? Tej operacji nie można cofnąć.",
                clearScoresAction
            );
        };
    });
}

// LOG DIAGNOSTYCZNY
console.log('[DEBUG-v0.70] js/services/scoreManager.js: Załadowano moduł Menedżera Wyników.');