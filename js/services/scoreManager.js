// ==============
// SCOREMANAGER.JS (v0.99d - Date Crash Fix)
// Lokalizacja: /js/services/scoreManager.js
// ==============

const SCORES_KEY = 'szkeletal_scores';

export function getScores() {
    const str = localStorage.getItem(SCORES_KEY);
    return str ? JSON.parse(str) : [];
}

export function saveScore(runData, nick = "GRACZ") {
    const scores = getScores();
    
    // Generowanie daty: YYYY/MM/DD HH:MM
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    
    const entry = {
        ...runData,
        name: nick,
        date: formattedDate
    };
    
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    
    if (scores.length > 20) scores.length = 20;
    
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

export function displayScores(tableBodyId, currentRun = null, onlineData = null) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    let scores = [];
    if (onlineData) {
        scores = onlineData;
    } else {
        scores = getScores();
        scores.forEach((e, i) => e.originalRank = i + 1);
    }
    
    tbody.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        return;
    }
    
    scores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        
        // Podświetlenie (lokalne)
        if (!onlineData && currentRun &&
            entry.score === currentRun.score &&
            entry.time === currentRun.time &&
            entry.date === currentRun.date) {
            tr.style.color = '#FFD700';
            tr.style.fontWeight = 'bold';
            tr.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
        }
        
        const nick = entry.name || "Anonim";
        const cleanNick = nick.length > 15 ? nick.substring(0, 15) + "..." : nick;
        
        // --- FIX BŁĘDU DATY ---
        let dateDisplay = "--/--/--";
        const rawDate = entry.date;
        
        if (rawDate) {
            // Jeśli to obiekt Date (z online)
            if (rawDate instanceof Date) {
                const yyyy = rawDate.getFullYear();
                const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
                const dd = String(rawDate.getDate()).padStart(2, '0');
                const hh = String(rawDate.getHours()).padStart(2, '0');
                const min = String(rawDate.getMinutes()).padStart(2, '0');
                dateDisplay = `${yyyy}/${mm}/${dd} <span style="opacity:0.6; font-size:0.85em;">${hh}:${min}</span>`;
            }
            // Jeśli to string (z local storage)
            else if (typeof rawDate === 'string') {
                // Jeśli to format ISO z Dreamlo
                if (rawDate.includes('T') || rawDate.includes('-')) {
                    // Próbujemy parsować
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const hh = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        dateDisplay = `${yyyy}/${mm}/${dd} <span style="opacity:0.6; font-size:0.85em;">${hh}:${min}</span>`;
                    } else {
                        dateDisplay = rawDate; // Fallback
                    }
                } else {
                    // Nasz format YYYY/MM/DD HH:MM
                    const parts = rawDate.split(' ');
                    if (parts.length === 2) {
                        dateDisplay = `${parts[0]} <span style="opacity:0.6; font-size:0.85em;">${parts[1]}</span>`;
                    } else {
                        dateDisplay = rawDate;
                    }
                }
            }
        }
        
        const rankDisplay = entry.originalRank || (index + 1);
        
        tr.innerHTML = `
            <td>${rankDisplay}.</td>
            <td style="color:#BBDEFB">${cleanNick}</td>
            <td style="color:#4CAF50; font-weight:bold;">${entry.score}</td>
            <td style="color:#FF5252">${entry.kills || 0}</td>
            <td>${entry.level}</td>
            <td>${dateDisplay}</td>
        `;
        tbody.appendChild(tr);
    });
}

import { confirmOverlay, btnConfirmYes, btnConfirmNo } from '../ui/domElements.js';

export function attachClearScoresListeners() {
    const btnMenu = document.getElementById('btnClearScoresMenu');
    const btnGO = document.getElementById('btnClearScoresGO');
    
    const showConfirm = () => { if (confirmOverlay) confirmOverlay.style.display = 'flex'; };
    
    if (btnMenu) btnMenu.onclick = showConfirm;
    if (btnGO) btnGO.onclick = showConfirm;
    
    if (btnConfirmNo) {
        btnConfirmNo.onclick = () => { if (confirmOverlay) confirmOverlay.style.display = 'none'; };
    }
    
    if (btnConfirmYes) {
        btnConfirmYes.onclick = () => {
            clearScores();
            if (confirmOverlay) confirmOverlay.style.display = 'none';
            if (window.wrappedDisplayScores) window.wrappedDisplayScores();
            const emptyMsgMenu = document.getElementById('scoresEmptyMsg');
            if (emptyMsgMenu) emptyMsgMenu.style.display = 'block';
        };
    }
}