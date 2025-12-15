// ==============
// LEADERBOARDUI.JS (v1.06 - Z-Index & Log Fix)
// Lokalizacja: /js/ui/leaderboardUI.js
// ==============

import { getLang } from '../services/i18n.js';
import { playSound } from '../services/audio.js';
import { displayScores } from '../services/scoreManager.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { finalScore, finalLevel, finalTime } from './domElements.js';

let lastRunData = null;
let gameRef = null; 

export function setLastRun(runData) {
    lastRunData = runData;
}

export function setGameRef(gameInstance) {
    gameRef = gameInstance;
}

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

function setupTableSorting(tableId, callback) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        th.onclick = () => {
            let col = th.dataset.sort;
            if (col === 'rank' || th.innerText.includes('#')) col = 'tempRank';
            callback(col);
            playSound('Click');
        };
    });
}

// --- MENU GŁÓWNE ---

export function initLeaderboardUI() {
    const tabLocal = document.getElementById('tabLocalScores');
    const tabOnline = document.getElementById('tabOnlineScores');
    const filtersDiv = document.getElementById('onlineFilters');
    const clearBtn = document.getElementById('btnClearScoresMenu');
    const filterBtns = document.querySelectorAll('.filter-btn');

    setupTableSorting('retroScoreTable', (col) => {
        if (col === currentSortColumn) currentSortDir = currentSortDir === 'desc' ? 'asc' : 'desc';
        else { currentSortColumn = col; currentSortDir = 'desc'; if (col === 'tempRank') currentSortDir = 'asc'; }
        updateView();
    });

    const updateView = async () => {
        const tableBody = document.getElementById('scoresBodyMenu');
        const emptyMsg = document.getElementById('scoresEmptyMsg');
        const loadingMsg = document.getElementById('scoreLoading');
        if(tableBody) tableBody.innerHTML = '';
        if(emptyMsg) emptyMsg.style.display = 'none';

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

    window.wrappedResetLeaderboard = () => {
        if(tabLocal) tabLocal.click();
        else { currentLeaderboardMode = 'local'; updateView(); }
    };

    if (tabLocal && tabOnline) {
        tabLocal.onclick = () => {
            currentLeaderboardMode = 'local';
            tabLocal.classList.add('active'); tabOnline.classList.remove('active');
            playSound('Click'); updateView();
        };
        tabOnline.onclick = () => {
            currentLeaderboardMode = 'online';
            tabOnline.classList.add('active'); tabLocal.classList.remove('active');
            cachedOnlineScores = []; playSound('Click'); updateView();
        };
    }

    if(filterBtns) {
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilterPeriod = btn.dataset.period;
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
    
    // Inicjalizacja przycisku Submit w menu (rzadko używane, ale niech będzie)
    initSubmitButtonLogic();
}

// --- LOGIKA PRZYCISKU WYŚLIJ WYNIK ---
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
        // Czyścimy poprzedni listener
        btnSubmit.onclick = null;
        
        btnSubmit.onclick = (e) => {
            console.log("[LeaderboardUI] Kliknięto WYŚLIJ WYNIK"); // DEBUG LOG
            
            let currentNick = localStorage.getItem('szkeletal_player_nick') || "";
            if (!currentNick || currentNick === "GRACZ" || currentNick === "") currentNick = "ANON";
            
            if(overlay) {
                console.log("[LeaderboardUI] Otwieram modal...");
                // FIX: Max Int Z-Index, żeby na pewno było na wierzchu
                overlay.style.zIndex = "2147483647"; 
                overlay.style.display = 'flex';
                
                setTimeout(() => {
                    if(inpQuick) {
                        inpQuick.value = currentNick;
                        inpQuick.focus();
                    }
                }, 100);
            } else {
                console.error("[LeaderboardUI] Błąd: Brak elementu overlay (nickInputOverlay)!");
            }
        };
    } else {
        console.warn("[LeaderboardUI] Błąd: Brak przycisku btnSubmitScore!");
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
        btnCancel.onclick = () => {
            overlay.style.display = 'none';
        };
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

    setupTableSorting('goScoreTable', (col) => {
        if (col === currentGOSortColumn) currentGOSortDir = currentGOSortDir === 'desc' ? 'asc' : 'desc';
        else { currentGOSortColumn = col; currentGOSortDir = 'desc'; if (col === 'tempRank') currentGOSortDir = 'asc'; }
        updateGOView();
    });

    const updateGOView = async () => {
        const tableBody = document.getElementById('scoresBodyGameOver');
        if(tableBody) tableBody.innerHTML = '';
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
            playSound('Click'); updateGOView();
        };
        tabOnline.onclick = () => {
            goMode = 'online';
            tabOnline.classList.add('active'); tabLocal.classList.remove('active');
            cachedGOOnlineScores = []; playSound('Click'); updateGOView();
        };
    }

    if(filterBtns) {
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                goFilter = btn.dataset.period;
                cachedGOOnlineScores = []; playSound('Click'); updateGOView();
            };
        });
    }
    
    currentGOSortColumn = 'score'; currentGOSortDir = 'desc';
    
    if(tabLocal) {
        if (goMode === 'local') { tabLocal.classList.add('active'); if(tabOnline) tabOnline.classList.remove('active'); } 
        else { if(tabOnline) tabOnline.classList.add('active'); tabLocal.classList.remove('active'); }
    }
    
    // FIX: Ponowna inicjalizacja przycisku przy otwieraniu Game Over
    initSubmitButtonLogic();
    
    updateGOView();
}