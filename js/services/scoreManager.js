// ==============
// SCOREMANAGER.JS (v1.12 - Full Date & Shop Integration)
// Lokalizacja: /js/services/scoreManager.js
// ==============

import { confirmOverlay, btnConfirmYes, btnConfirmNo } from '../ui/domElements.js';
import { shopManager } from './shopManager.js';

const SCORES_KEY = 'szkeletal_scores';

/**
 * Bezpieczne parsowanie JSON z usuwaniem znaków sterujących.
 */
function safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn("[ScoreManager] Naprawa uszkodzonego JSON...");
        try {
            const sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            return JSON.parse(sanitized);
        } catch (e2) {
            return fallback;
        }
    }
}

export function getScores() {
    const str = localStorage.getItem(SCORES_KEY);
    return safeJsonParse(str, []);
}

/**
 * Zapisuje wynik rozgrywki i synchronizuje sklep.
 */
export function saveScore(runData, nick = "GRACZ") {
    const scores = getScores();
    
    // Synchronizacja z portfelem sklepu
    if (runData && runData.score !== undefined) {
        shopManager.updateMaxScore(runData.score);
    }
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    // FIX Ad Data: Pełny format z godziną
    const formattedDate = `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    
    const entry = {
        ...runData,
        name: nick,
        date: formattedDate
    };
    
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
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

/**
 * Renderuje tabelę wyników.
 */
export function displayScores(tableBodyId, currentRun = null, onlineData = null) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    let scores = onlineData || getScores();
    
    if (!onlineData && (!scores[0] || typeof scores[0].tempRank === 'undefined')) {
        scores.sort((a, b) => b.score - a.score);
        scores.forEach((e, i) => e.tempRank = i + 1);
    }
    
    tbody.innerHTML = '';
    if (!scores || scores.length === 0) return;
    
    const currentNick = (localStorage.getItem('szkeletal_player_nick') || "GRACZ").toUpperCase();
    
    scores.forEach((entry, index) => {
        const tr = document.createElement('tr');
        let isHighlight = false;
        
        if (currentRun && entry.score === currentRun.score && entry.date === currentRun.date) {
            isHighlight = true;
        }
        
        const rowBg = isHighlight ? 'rgba(255, 215, 0, 0.15)' : 'transparent';
        const cCommon = isHighlight ? '#FFD700' : null;
        
        tr.style.backgroundColor = rowBg;
        if (isHighlight) tr.style.fontWeight = 'bold';
        
        const nick = entry.name || "Anonim";
        const cleanNick = nick.length > 20 ? nick.substring(0, 20) + "..." : nick;
        
        // FIX Ad Data: Wyświetlanie godziny
        let dateStr = "---";
        if (entry.date) {
            if (entry.date instanceof Date) {
                const d = entry.date;
                const hh = String(d.getHours()).padStart(2, '0');
                const mi = String(d.getMinutes()).padStart(2, '0');
                dateStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${hh}:${mi}`;
            } else {
                dateStr = entry.date; // String sformatowany w saveScore
            }
        }
        
        tr.innerHTML = `
            <td style="color:${cCommon || '#888'}">${entry.tempRank || (index + 1)}.</td>
            <td style="color:${cCommon || '#BBDEFB'}">${cleanNick}</td>
            <td style="color:${cCommon || '#4CAF50'}; font-weight:bold;">${entry.score}</td>
            <td style="color:${cCommon || '#FF5252'}">${entry.kills || 0}</td>
            <td style="color:${cCommon || '#eee'}">${entry.level}</td>
            <td style="color:${cCommon || '#FFD700'}">${formatTime(entry.time || 0)}</td>
            <td style="color:${cCommon || '#888'}">${dateStr}</td>
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
    if (btnConfirmNo) btnConfirmNo.onclick = () => { if (confirmOverlay) confirmOverlay.style.display = 'none'; };
    if (btnConfirmYes) {
        btnConfirmYes.onclick = () => {
            clearScores();
            if (confirmOverlay) confirmOverlay.style.display = 'none';
            if (window.wrappedDisplayScores) window.wrappedDisplayScores();
        };
    }
}