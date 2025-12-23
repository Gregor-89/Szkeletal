// ==============
// SCOREMANAGER.JS (v1.06 - JSON Fix & Original UI Preserved)
// Lokalizacja: /js/services/scoreManager.js
// ==============

import { confirmOverlay, btnConfirmYes, btnConfirmNo } from '../ui/domElements.js';

const SCORES_KEY = 'szkeletal_scores';

// NOWOŚĆ: Funkcja naprawcza do JSON-a (usuwa znaki sterujące)
function safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn("[ScoreManager] Wykryto uszkodzony JSON, próbuję naprawić...", e);
        try {
            // Usuwamy znaki sterujące (ASCII 0-31), które psują JSON.parse
            const sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            return JSON.parse(sanitized);
        } catch (e2) {
            console.error("[ScoreManager] Nie udało się naprawić danych. Zwracam fallback.", e2);
            return fallback;
        }
    }
}

export function getScores() {
    const str = localStorage.getItem(SCORES_KEY);
    // ZMIANA: Użycie bezpiecznego parsera
    return safeJsonParse(str, []);
}

export function saveScore(runData, nick = "GRACZ") {
    // Pobieramy bezpiecznie wyniki
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
    
    // Limit do 50 wyników (zwiększyłem z 20 na 50, standardowo bezpieczniej)
    if (scores.length > 50) scores.length = 50;
    
    try {
        localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    } catch (e) {
        console.error("[ScoreManager] Błąd zapisu wyniku:", e);
    }
}

export function clearScores() {
    localStorage.removeItem(SCORES_KEY);
    console.log("[ScoreManager] Wyniki wyczyszczone.");
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
    // Musimy upewnić się, że mają tempRank, jeśli wywołano to spoza leaderboardUI
    if (!onlineData && (!scores[0] || typeof scores[0].tempRank === 'undefined')) {
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
            if (entry.score === currentRun.score) {
                // Dla Online: sprawdzamy imię
                if (entry.name && entry.name.toUpperCase() === currentNick) {
                    if (entry.time === currentRun.time) {
                        isHighlight = true;
                    }
                }
                // Fallback dla lokalnych (zgodność daty)
                if (entry.date === currentRun.date) {
                    isHighlight = true;
                }
            }
        }
        
        const rowBg = isHighlight ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
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