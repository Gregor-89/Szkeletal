// ==============
// SCOREMANAGER.JS (v0.95e - FIX: Retro Table Support)
// Lokalizacja: /js/services/scoreManager.js
// ==============

import {
    confirmOverlay, confirmText, btnConfirmYes, btnConfirmNo
} from '../ui/domElements.js';

export function formatTime(totalSeconds) {
    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

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
    const scoresBody = document.getElementById(targetId);
    const emptyMsg = document.getElementById('scoresEmptyMsg');
    
    if (!scoresBody) return;

    try {
        const scores = JSON.parse(localStorage.getItem('szketalScores') || '[]');

        scoresBody.innerHTML = '';
        
        if (scores.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return; 
        } 
        
        if (emptyMsg) emptyMsg.style.display = 'none';

        scores.forEach((s, idx) => {
            const tr = document.createElement('tr');
            
            if (highlightRun && 
                s.score === highlightRun.score && 
                s.level === highlightRun.level && 
                s.time === highlightRun.time) {
                tr.style.color = '#4CAF50'; 
                tr.style.fontWeight = 'bold';
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
    const overlay = document.getElementById('confirmOverlay');
    const txt = document.getElementById('confirmText');
    const yes = document.getElementById('btnConfirmYes');
    const no = document.getElementById('btnConfirmNo');

    if (!overlay || !txt || !yes || !no) {
        if (confirm(text)) onConfirm();
        return;
    }
    
    txt.textContent = text;
    overlay.style.display = 'flex';

    yes.onclick = () => {
        overlay.style.display = 'none';
        onConfirm(); 
    };
    
    no.onclick = () => {
        overlay.style.display = 'none';
    };
}

export function attachClearScoresListeners() {
    const btns = document.querySelectorAll('#btnClearScoresMenu, #btnClearScoresGO');
    btns.forEach(button => {
        button.onclick = () => {
            const clearScoresAction = () => {
                try {
                    localStorage.removeItem('szketalScores');
                    displayScores('scoresBodyMenu');
                    displayScores('scoresBodyGameOver');
                } catch (e) {
                    console.error("BŁĄD:", e);
                }
            };

            showConfirmModal(
                "Czy na pewno chcesz wyzerować tablicę wyników?",
                clearScoresAction
            );
        };
    });
}