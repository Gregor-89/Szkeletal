// ==============
// SCOREMANAGER.JS (v0.96q - FIX: Kills Column)
// Lokalizacja: /js/services/scoreManager.js
// ==============

const SCORES_KEY = 'szkeletal_scores';

export function getScores() {
    const str = localStorage.getItem(SCORES_KEY);
    return str ? JSON.parse(str) : [];
}

export function saveScore(runData) {
    const scores = getScores();
    // runData zawiera teraz: { score, level, time, kills }
    scores.push(runData);
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 10) scores.length = 10;
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

export function clearScores() {
    localStorage.removeItem(SCORES_KEY);
}

export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function displayScores(tableBodyId, currentRun = null) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    let scores = getScores();
    
    // Jeśli to ekran Game Over i mamy currentRun, wyświetlamy go jako pierwszy (podświetlony), jeśli wszedł do topki
    // Ale logika "top 10" w saveScore już go zapisała. 
    // Tutaj po prostu wyświetlamy zapisaną listę. 
    // Opcjonalnie: Podświetlenie aktualnego wyniku (jeśli jest na liście).
    
    tbody.innerHTML = '';
    
    scores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        
        // Highlight current run if matches (simple check by reference wont work after JSON parse, check props)
        if (currentRun &&
            entry.score === currentRun.score &&
            entry.time === currentRun.time &&
            entry.kills === currentRun.kills) {
            tr.style.color = '#FFD700';
            tr.style.fontWeight = 'bold';
            tr.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
        }
        
        // FIX v0.96q: Dodano kolumnę Kills
        tr.innerHTML = `
            <td>${index + 1}.</td>
            <td style="color:#4CAF50">${entry.score}</td>
            <td style="color:#FF5252">${entry.kills || 0}</td>
            <td>${entry.level}</td>
            <td>${formatTime(entry.time)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Funkcje obsługi modala potwierdzenia
import { confirmOverlay, btnConfirmYes, btnConfirmNo } from '../ui/domElements.js';

export function attachClearScoresListeners() {
    const btnMenu = document.getElementById('btnClearScoresMenu');
    const btnGO = document.getElementById('btnClearScoresGO');
    
    const showConfirm = () => {
        if (confirmOverlay) confirmOverlay.style.display = 'flex';
    };
    
    if (btnMenu) btnMenu.onclick = showConfirm;
    if (btnGO) btnGO.onclick = showConfirm;
    
    if (btnConfirmNo) {
        btnConfirmNo.onclick = () => {
            if (confirmOverlay) confirmOverlay.style.display = 'none';
        };
    }
    
    if (btnConfirmYes) {
        btnConfirmYes.onclick = () => {
            clearScores();
            if (confirmOverlay) confirmOverlay.style.display = 'none';
            // Odśwież widoczne tabele
            displayScores('scoresBodyMenu');
            displayScores('scoresBodyGameOver');
            
            // Ukryj/Pokaż komunikat "Brak wyników" w menu
            const emptyMsg = document.getElementById('scoresEmptyMsg');
            if (emptyMsg) emptyMsg.style.display = 'block';
        };
    }
}