// ==============
// LEADERBOARDUI.JS (v1.11c - Robust Tab Focus & Logic)
// Lokalizacja: /js/ui/leaderboardUI.js
// ==============

import { getLang } from '../services/i18n.js';
import { playSound } from '../services/audio.js';
import { displayScores } from '../services/scoreManager.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { finalScore, finalLevel, finalTime } from './domElements.js';
import { ENEMY_STATS } from '../config/gameData.js'; 

let lastRunData = null;
let gameRef = null; 

export function setLastRun(runData) { lastRunData = runData; }
export function setGameRef(gameInstance) { gameRef = gameInstance; }

// --- STAN LEADERBOARD ---
let currentLeaderboardMode = 'local';
let currentFilterPeriod = 'today';
let cachedOnlineScores = [];
let currentSortColumn = 'score';
let currentSortDir = 'desc';

let goMode = 'local';
let goFilter = 'today';
let cachedGOOnlineScores = [];
let currentGOSortColumn = 'score';
let currentGOSortDir = 'desc';

function sortData(data, column, dir) {
    if(!data) return [];
    return data.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (column === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        if (column === 'tempRank') {
            valA = a.tempRank || 0;
            valB = b.tempRank || 0;
        }
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    });
}

function assignRanks(data) {
    if (!data) return [];
    const ranked = [...data].sort((a, b) => b.score - a.score);
    ranked.forEach((item, index) => { item.tempRank = index + 1; });
    return data;
}

function formatPlaytime(seconds) {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    let parts = [];
    if (d > 0) parts.push(d + "d");
    if (h > 0) parts.push(h + "h");
    if (m > 0) parts.push(m + "m");
    if (s > 0 || parts.length === 0) parts.push(s + "s");
    
    return parts.join(" ");
}

// POMOCNICZA: Aktualizacja wizualna nagłówków (strzałki)
function updateHeaderVisuals(tableId, activeCol, activeDir) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        let baseText = th.innerText.replace(/[▲▼]/g, '').trim();
        const col = th.dataset.sort === 'rank' ? 'tempRank' : th.dataset.sort;
        
        if (col === activeCol) {
            th.innerText = baseText + (activeDir === 'asc' ? ' ▲' : ' ▼');
            th.classList.add('sorted-column');
        } else {
            th.innerText = baseText;
            th.classList.remove('sorted-column');
        }
    });
}

function setupTableSorting(tableId, callback) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        const newTh = th.cloneNode(true);
        th.parentNode.replaceChild(newTh, th);
        newTh.onclick = () => {
            let col = newTh.dataset.sort;
            if (col === 'rank' || newTh.innerText.includes('#')) col = 'tempRank';
            callback(col);
            playSound('Click');
        };
    });
}

/**
 * Agresywna synchronizacja fokusu dla dotyku (Fix Ad 2)
 */
function syncGamepadFocus(element) {
    if (!element) return;
    document.querySelectorAll('.focused').forEach(el => {
        el.classList.remove('focused');
        el.blur();
    });
    element.classList.add('focused');
    element.focus();
    if (window.setFocusedElement) window.setFocusedElement(element);
}

// --- MENU GŁÓWNE ---

export function initLeaderboardUI() {
    const tabLocal = document.getElementById('tabLocalScores');
    const tabOnline = document.getElementById('tabOnlineScores');
    
    const tabsContainer = document.querySelector('.score-tabs-container');
    let tabStats = document.getElementById('tabStats');
    if (tabsContainer && !tabStats) {
        tabStats = document.createElement('button');
        tabStats.id = 'tabStats';
        tabStats.className = 'score-tab';
        tabStats.textContent = getLang('ui_tab_stats') || 'STATYSTYKI';
        tabsContainer.appendChild(tabStats);
    }

    const filtersDiv = document.getElementById('onlineFilters');
    const clearBtn = document.getElementById('btnClearScoresMenu');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const tableHeader = document.querySelector('#retroScoreTable thead tr');

    const updateView = async () => {
        const tableBody = document.getElementById('scoresBodyMenu');
        const emptyMsg = document.getElementById('scoresEmptyMsg');
        const loadingMsg = document.getElementById('scoreLoading');
        
        if(tableBody) tableBody.innerHTML = '';
        if(emptyMsg) emptyMsg.style.display = 'none';

        if (currentLeaderboardMode === 'stats') {
            if(filtersDiv) filtersDiv.style.display = 'none';
            if(clearBtn) clearBtn.style.display = 'none';
            
            if(tableHeader) tableHeader.innerHTML = `
                <th>${getLang('ui_stat_header_name') || 'METRYKA'}</th>
                <th style="color:#4CAF50">${getLang('ui_stat_header_local') || 'TY'}</th>
                <th style="color:#FFD700">${getLang('ui_stat_header_global') || 'ŚWIAT'}</th>
            `;
            
            if(loadingMsg) loadingMsg.style.display = 'block';
            const globalStats = await LeaderboardService.getGlobalStats();
            const localStats = LeaderboardService.getLocalStats();
            if(loadingMsg) loadingMsg.style.display = 'none';
            
            let statRows = [
                { key: 'games_played', label: getLang('stat_games_played') },
                { key: 'unique_players', label: getLang('stat_unique_players') },
                { key: 'total_playtime_seconds', label: getLang('stat_total_playtime') },
                { key: 'deaths', label: getLang('stat_deaths') },
                { key: 'enemies_killed', label: getLang('stat_enemies_killed') },
                { key: 'potatoes_collected', label: getLang('stat_potatoes_collected') }
            ];

            Object.keys(ENEMY_STATS).forEach(type => {
                statRows.push({
                    key: `killed_${type}`,
                    label: getLang(`stat_killed_${type}`) || `${type} (Kills)`
                });
            });
            
            statRows.forEach(def => {
                const tr = document.createElement('tr');
                let localVal = localStats[def.key] || 0;
                let globalVal = globalStats[def.key] || 0;
                
                if (def.key === 'total_playtime_seconds') {
                    localVal = formatPlaytime(localVal);
                    globalVal = formatPlaytime(globalVal);
                } else {
                    localVal = localVal.toLocaleString();
                    globalVal = globalVal.toLocaleString();
                }
                
                tr.innerHTML = `
                    <td style="text-align:left; padding-left:20px;">${def.label || def.key}</td>
                    <td style="color:#81C784">${localVal}</td>
                    <td style="color:#FFD700">${globalVal}</td>
                `;
                tableBody.appendChild(tr);
            });
            return;
        }
        
        if(tableHeader) {
             tableHeader.innerHTML = `
                <th data-sort="tempRank">${getLang('ui_scores_col_rank') || '#'}</th>
                <th data-sort="name">${getLang('ui_scores_col_nick') || 'NICK'}</th>
                <th data-sort="score">${getLang('ui_scores_col_score') || 'PKT'}</th>
                <th data-sort="kills">${getLang('ui_scores_col_kills') || 'ZAB'}</th>
                <th data-sort="level">${getLang('ui_scores_col_level') || 'LVL'}</th>
                <th data-sort="time">${getLang('ui_scores_col_time') || 'CZAS'}</th>
                <th data-sort="date">${getLang('ui_scores_col_date') || 'DATA'}</th>
             `;
             setupTableSorting('retroScoreTable', onSortClick);
             updateHeaderVisuals('retroScoreTable', currentSortColumn, currentSortDir);
        }

        let rawData = [];
        if (currentLeaderboardMode === 'local') {
            if(filtersDiv) filtersDiv.style.display = 'none';
            if(clearBtn) clearBtn.style.display = 'inline-block';
            if(loadingMsg) loadingMsg.style.display = 'none';
            rawData = JSON.parse(localStorage.getItem('szkeletal_scores')) || [];
        } else {
            if(filtersDiv) filtersDiv.style.display = 'flex';
            if(clearBtn) clearBtn.style.display = 'none';
            if (cachedOnlineScores.length === 0) {
                if(loadingMsg) loadingMsg.style.display = 'block';
                cachedOnlineScores = await LeaderboardService.getScores(currentFilterPeriod);
                if(loadingMsg) loadingMsg.style.display = 'none';
            }
            rawData = cachedOnlineScores;
        }
        assignRanks(rawData);
        const sortedScores = sortData([...rawData], currentSortColumn, currentSortDir);
        displayScores('scoresBodyMenu', null, sortedScores); 
        if (tableBody && tableBody.children.length === 0 && emptyMsg) emptyMsg.style.display = 'block';
    };

    const onSortClick = (col) => {
        if (currentLeaderboardMode === 'stats') return; 
        if (col === currentSortColumn) currentSortDir = currentSortDir === 'desc' ? 'asc' : 'desc';
        else { currentSortColumn = col; currentSortDir = 'desc'; if (col === 'tempRank') currentSortDir = 'asc'; }
        updateView();
    };

    window.wrappedResetLeaderboard = () => {
        if(tabLocal) tabLocal.click();
        else { currentLeaderboardMode = 'local'; updateView(); }
    };

    if (tabLocal && tabOnline) {
        tabLocal.onclick = () => {
            currentLeaderboardMode = 'local';
            tabLocal.classList.add('active'); tabOnline.classList.remove('active');
            if(tabStats) tabStats.classList.remove('active');
            syncGamepadFocus(tabLocal); // FIX Ad 2
            playSound('Click'); updateView();
        };
        tabOnline.onclick = () => {
            currentLeaderboardMode = 'online';
            tabOnline.classList.add('active'); tabLocal.classList.remove('active');
            if(tabStats) tabStats.classList.remove('active');
            syncGamepadFocus(tabOnline); // FIX Ad 2
            cachedOnlineScores = []; playSound('Click'); updateView();
        };
        if(tabStats) {
            tabStats.onclick = () => {
                currentLeaderboardMode = 'stats';
                tabStats.classList.add('active'); 
                if(tabLocal) tabLocal.classList.remove('active'); 
                if(tabOnline) tabOnline.classList.remove('active');
                syncGamepadFocus(tabStats); // FIX Ad 2
                playSound('Click'); updateView();
            };
        }
    }

    if(filterBtns) {
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilterPeriod = btn.dataset.period;
                syncGamepadFocus(btn);
                cachedOnlineScores = []; playSound('Click'); updateView();
            };
        });
    }

    const inpNick = document.getElementById('inpPlayerNick');
    if (inpNick) {
        const savedNick = localStorage.getItem('szkeletal_player_nick');
        if (savedNick) inpNick.value = savedNick;
        inpNick.addEventListener('change', () => {
            let val = inpNick.value.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').toUpperCase();
            if(val.length > 20) val = val.substring(0, 20); 
            inpNick.value = val;
            localStorage.setItem('szkeletal_player_nick', val);
        });
    }
    
    initSubmitButtonLogic();
}

function initSubmitButtonLogic() {
    const btnSubmit = document.getElementById('btnSubmitScore');
    const overlay = document.getElementById('nickInputOverlay');
    const inpQuick = document.getElementById('inpQuickNick');
    const btnConfirm = document.getElementById('btnConfirmNick');
    const btnCancel = document.getElementById('btnCancelNick');
    
    const performSubmit = async (nickToUse) => {
        const msgDiv = document.getElementById('submitMsg');
        if(msgDiv) msgDiv.textContent = "Wysyłanie...";
        if(btnSubmit) btnSubmit.style.display = 'none';

        const score = parseInt(finalScore.textContent) || 0;
        const level = parseInt(finalLevel.textContent) || 1;
        const timeStr = finalTime.textContent;
        const parts = timeStr.split(':');
        const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const kills = parseInt(document.getElementById('totalKillsSpanGO').textContent) || 0;
        const isCheated = (gameRef && gameRef.isCheated === true);

        const result = await LeaderboardService.submitScore(nickToUse, score, level, seconds, kills, isCheated);
        
        if (result.success) {
            if(msgDiv) {
                msgDiv.style.color = '#00E676';
                msgDiv.textContent = getLang('ui_gameover_sent') || "WYSŁANO!";
            }
            playSound('LevelUp');
            cachedGOOnlineScores = [];
            const tabGOOnline = document.getElementById('tabGOOnline');
            if(tabGOOnline) tabGOOnline.click();
        } else {
            if(msgDiv) {
                msgDiv.style.color = '#FF5252';
                msgDiv.textContent = (getLang('ui_gameover_error') || "BŁĄD") + ": " + (result.msg || "Sieć");
            }
            if(btnSubmit) btnSubmit.style.display = 'inline-block';
        }
    };

    if (btnSubmit) {
        btnSubmit.onclick = null;
        btnSubmit.onclick = () => {
            let currentNick = localStorage.getItem('szkeletal_player_nick') || "";
            if (!currentNick || currentNick === "GRACZ" || currentNick === "") currentNick = "ANON";
            if(overlay) {
                overlay.style.zIndex = "2147483647"; 
                overlay.style.display = 'flex';
                setTimeout(() => { if(inpQuick) { inpQuick.value = currentNick; inpQuick.focus(); } }, 100);
            }
        };
    }

    if (btnConfirm && inpQuick && overlay) {
        btnConfirm.onclick = () => {
            let val = inpQuick.value.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').toUpperCase();
            if(val.length === 0) val = "ANON";
            if(val.length > 20) val = val.substring(0, 20); 
            localStorage.setItem('szkeletal_player_nick', val);
            const inpMain = document.getElementById('inpPlayerNick');
            if(inpMain) inpMain.value = val;
            overlay.style.display = 'none';
            performSubmit(val);
        };
    }

    if (btnCancel && overlay) {
        btnCancel.onclick = () => { overlay.style.display = 'none'; };
    }
}

// --- GAME OVER SCREEN ---
export function initGameOverTabs() {
    const tabLocal = document.getElementById('tabGOLocal');
    const tabOnline = document.getElementById('tabGOOnline');
    const filtersDiv = document.getElementById('goOnlineFilters');
    const loadingMsg = document.getElementById('goScoreLoading');
    const clearBtn = document.getElementById('btnClearScoresGO');
    const filterBtns = document.querySelectorAll('#goOnlineFilters .filter-btn');

    const onGOSortClick = (col) => {
        if (col === currentGOSortColumn) currentGOSortDir = currentGOSortDir === 'asc' ? 'desc' : 'asc';
        else { currentGOSortColumn = col; currentGOSortDir = 'desc'; if (col === 'tempRank') currentGOSortDir = 'asc'; }
        updateGOView();
    };

    const updateGOView = async () => {
        const tableBody = document.getElementById('scoresBodyGameOver');
        const tableHeader = document.querySelector('#goScoreTable thead tr');
        
        if(tableBody) tableBody.innerHTML = '';
        
        if(tableHeader) {
            tableHeader.innerHTML = `
                <th data-sort="tempRank">${getLang('ui_scores_col_rank') || '#'}</th>
                <th data-sort="name">${getLang('ui_scores_col_nick') || 'NICK'}</th>
                <th data-sort="score">${getLang('ui_scores_col_score') || 'PKT'}</th>
                <th data-sort="kills">${getLang('ui_scores_col_kills') || 'ZAB'}</th>
                <th data-sort="level">${getLang('ui_scores_col_level') || 'LVL'}</th>
                <th data-sort="time">${getLang('ui_scores_col_time') || 'CZAS'}</th>
                <th data-sort="date">${getLang('ui_scores_col_date') || 'DATA'}</th>
            `;
            setupTableSorting('goScoreTable', onGOSortClick);
            updateHeaderVisuals('goScoreTable', currentGOSortColumn, currentGOSortDir);
        }

        let rawData = [];
        if (goMode === 'local') {
            if(filtersDiv) filtersDiv.style.display = 'none';
            if(clearBtn) clearBtn.style.display = 'inline-block';
            if(loadingMsg) loadingMsg.style.display = 'none';
            rawData = JSON.parse(localStorage.getItem('szkeletal_scores')) || [];
        } else {
            if(filtersDiv) filtersDiv.style.display = 'flex';
            if(clearBtn) clearBtn.style.display = 'none';
            if (cachedGOOnlineScores.length === 0) {
                if(loadingMsg) loadingMsg.style.display = 'block';
                cachedGOOnlineScores = await LeaderboardService.getScores(goFilter);
                if(loadingMsg) loadingMsg.style.display = 'none';
            }
            rawData = cachedGOOnlineScores;
        }
        assignRanks(rawData);
        const sortedData = sortData([...rawData], currentGOSortColumn, currentGOSortDir);
        displayScores('scoresBodyGameOver', lastRunData, sortedData); 
    };

    if (tabLocal && tabOnline) {
        tabLocal.onclick = () => {
            goMode = 'local';
            tabLocal.classList.add('active'); tabOnline.classList.remove('active');
            syncGamepadFocus(tabLocal); // FIX Ad 2
            playSound('Click'); updateGOView();
        };
        tabOnline.onclick = () => {
            goMode = 'online';
            tabOnline.classList.add('active'); tabLocal.classList.remove('active');
            syncGamepadFocus(tabOnline); // FIX Ad 2
            cachedGOOnlineScores = []; playSound('Click'); updateGOView();
        };
    }

    if(filterBtns) {
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                goFilter = btn.dataset.period;
                syncGamepadFocus(btn);
                cachedGOOnlineScores = []; playSound('Click'); updateGOView();
            };
        });
    }
    
    currentGOSortColumn = 'score'; currentGOSortDir = 'desc';
    
    if(tabLocal) {
        if (goMode === 'local') { tabLocal.classList.add('active'); if(tabOnline) tabOnline.classList.remove('active'); } 
        else { if(tabOnline) tabOnline.classList.add('active'); tabLocal.classList.remove('active'); }
    }
    
    initSubmitButtonLogic();
    updateGOView();
}