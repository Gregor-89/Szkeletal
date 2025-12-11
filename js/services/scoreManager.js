// ==============
// SCOREMANAGER.JS (v1.03 - Perfect Highlight & Rank)
// Lokalizacja: /js/services/scoreManager.js
// ==============

import { confirmOverlay, btnConfirmYes, btnConfirmNo } from '../ui/domElements.js';

const SCORES_KEY = 'szkeletal_scores';

export function getScores() {
    const str = localStorage.getItem(SCORES_KEY);
    return str ? JSON.parse(str) : [];
}

export function saveScore(runData, nick = "GRACZ") {
    const scores = getScores();
    
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
    
    // Dane przychodzą już posortowane wizualnie i z nadaną rangą (tempRank)
    let scores = onlineData || getScores(); // Fallback dla lokalnych jeśli nie przekazano
    
    // Jeśli to lokalne i nie przekazano onlineData, to 'scores' to surowe dane z localStorage
    // Musimy upewnić się, że mają tempRank, jeśli wywołano to spoza leaderboardUI (np. bezpośrednio)
    if (!onlineData && (!scores[0] || typeof scores[0].tempRank === 'undefined')) {
        // Szybki fallback dla rankingu lokalnego (Score Desc)
        scores.sort((a, b) => b.score - a.score);
        scores.forEach((e, i) => e.tempRank = i + 1);
    }
    
    tbody.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        return;
    }
    
    // Pobierz aktualny nick do porównania
    const currentNick = (localStorage.getItem('szkeletal_player_nick') || "GRACZ").toUpperCase();
    
    scores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        
        // --- LOGIKA PODŚWIETLANIA ---
        let isHighlight = false;
        
        if (currentRun) {
            // Sprawdzamy czy to "ten" wynik
            // 1. Wynik punktowy musi się zgadzać
            if (entry.score === currentRun.score) {
                // 2. Jeśli mamy imię, musi się zgadzać (dla Online)
                if (entry.name && entry.name.toUpperCase() === currentNick) {
                    // 3. Dla pewności sprawdźmy też czas gry (sekundy)
                    if (entry.time === currentRun.time) {
                        isHighlight = true;
                    }
                }
                // Fallback dla lokalnych (pełna zgodność obiektu daty)
                if (entry.date === currentRun.date) {
                    isHighlight = true;
                }
            }
        }
        
        const rowBg = isHighlight ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
        // Kolory: Złoty jeśli highlight, w przeciwnym razie standardowe palety
        const cCommon = isHighlight ? '#FFD700' : null;
        
        tr.style.backgroundColor = rowBg;
        if (isHighlight) tr.style.fontWeight = 'bold';
        
        const nick = entry.name || "Anonim";
        const cleanNick = nick.length > 20 ? nick.substring(0, 20) + "..." : nick;
        
        const timeDisplay = formatTime(entry.time || 0);
        
        let dateDisplay = "--/--/--";
        const rawDate = entry.date;
        if (rawDate) {
            if (rawDate instanceof Date) {
                const yyyy = rawDate.getFullYear();
                const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
                const dd = String(rawDate.getDate()).padStart(2, '0');
                const hh = String(rawDate.getHours()).padStart(2, '0');
                const min = String(rawDate.getMinutes()).padStart(2, '0');
                dateDisplay = `${yyyy}/${mm}/${dd} <span style="opacity:0.6; font-size:0.85em;">${hh}:${min}</span>`;
            }
            else if (typeof rawDate === 'string') {
                if (rawDate.includes('T') || rawDate.includes('-')) {
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const hh = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        dateDisplay = `${yyyy}/${mm}/${dd} <span style="opacity:0.6; font-size:0.85em;">${hh}:${min}</span>`;
                    } else {
                        dateDisplay = rawDate;
                    }
                } else {
                    const parts = rawDate.split(' ');
                    if (parts.length === 2) {
                        dateDisplay = `${parts[0]} <span style="opacity:0.6; font-size:0.85em;">${parts[1]}</span>`;
                    } else {
                        dateDisplay = rawDate;
                    }
                }
            }
        }
        
        // ZMIANA: Używamy tempRank (dynamicznie obliczony) zamiast indexu
        const rankDisplay = entry.tempRank || (index + 1);
        
        tr.innerHTML = `
            <td style="color:${cCommon || '#888'}">${rankDisplay}.</td>
            <td style="color:${cCommon || '#BBDEFB'}">${cleanNick}</td>
            <td style="color:${cCommon || '#4CAF50'}; font-weight:bold;">${entry.score}</td>
            <td style="color:${cCommon || '#FF5252'}">${entry.kills || 0}</td>
            <td style="color:${cCommon || '#eee'}">${entry.level}</td>
            <td style="color:${cCommon || '#FFD700'}">${timeDisplay}</td>
            <td style="color:${cCommon || '#888'}">${dateDisplay}</td>
        `;
        tbody.appendChild(tr);
    });
}

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