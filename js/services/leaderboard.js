// ==============
// LEADERBOARD.JS (v0.110e - Robust Pagination & Multi-Page Fetch)
// Lokalizacja: /js/services/leaderboard.js
// ==============

const _t_parts = [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
    "eyJzdWIiOjEwMjcsImFwaSI6dHJ1ZSwiaWF0IjoxNzY1NzkwMzM5fQ.",
    "woH9UddSHHOusNui335r_I4MRNPK143nbpt_VarDEaA"
];
const getApiKey = () => _t_parts.join('');

const API_URL = "https://api.trytalo.com/v1";
const LEADERBOARD_NAME = "Szkeletal"; 
const SHADOW_BAN_KEY = "szkeletal_shadow_entry"; 
const PLAYER_ID_KEY = "szkeletal_player_id"; 
const LOCAL_STATS_KEY = "szkeletal_local_stats";

const MAX_SCORE_PER_SECOND = 3000;
const MAX_KILLS_PER_SECOND = 25;

let cache = {
  data: null,
  lastFetch: 0,
  CACHE_DURATION: 60000 
};

let statsCache = {
    data: null,
    lastFetch: 0,
    CACHE_DURATION: 60000
};

let sessionStats = {};

let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 30000; 
let cachedAliasId = null;
let cachedPlayerId = null;
let cachedSessionToken = null;

// --- FUNKCJA NAPRAWCZA JSON ---
function safeJsonParse(str, fallback) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn("[Leaderboard] Wykryto uszkodzony JSON, naprawiam...", e);
        try {
            const sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            return JSON.parse(sanitized);
        } catch (e2) {
            return fallback;
        }
    }
}

function getPlayerIdentifier() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
        id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
}

function updatePlayerIdentifierWithNick(nick) {
    const currentId = getPlayerIdentifier();
    const parts = currentId.split('_');
    const suffix = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
    const safeNick = nick.replace(/\s+/g, '-');
    const newId = `${safeNick}_${suffix}`;
    
    if (currentId !== newId) {
        localStorage.setItem(PLAYER_ID_KEY, newId);
        cachedAliasId = null;
        cachedPlayerId = null;
        cachedSessionToken = null;
    }
}

async function authenticateTalo() {
    if (cachedAliasId && cachedSessionToken) return cachedAliasId;

    const identifier = getPlayerIdentifier();
    const service = 'username';
    const url = `${API_URL}/players/identify?identifier=${encodeURIComponent(identifier)}&service=${encodeURIComponent(service)}`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.alias && data.alias.id) cachedAliasId = data.alias.id;
        else if (data.aliases && Array.isArray(data.aliases)) {
            const alias = data.aliases.find(a => a.service === service);
            if (alias) cachedAliasId = alias.id;
            if (!cachedAliasId && data.aliases.length > 0) cachedAliasId = data.aliases[0].id;
        } else if (data.player && data.player.aliases) {
            const alias = data.player.aliases.find(a => a.service === service);
            if (alias) cachedAliasId = alias.id;
        }

        if (data.player && data.player.id) cachedPlayerId = data.player.id;

        if (data.session && data.session.token) cachedSessionToken = data.session.token;
        else if (data.token) cachedSessionToken = data.token; 

        return cachedAliasId;

    } catch (e) {
        return null;
    }
}

function updateLocalStats(statName, value) {
    let stats = safeJsonParse(localStorage.getItem(LOCAL_STATS_KEY), {});

    if (!stats[statName]) stats[statName] = 0;
    stats[statName] += value;
    
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
}

function getTaloHeaders() {
    const headers = {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json'
    };
    if (cachedAliasId) headers['x-talo-alias'] = cachedAliasId;
    if (cachedPlayerId) headers['x-talo-player'] = cachedPlayerId;
    if (cachedSessionToken) headers['x-talo-session'] = cachedSessionToken;
    return headers;
}

export const LeaderboardService = {
  
  clearCache: () => {
    cache.data = null;
    cache.lastFetch = 0;
    statsCache.data = null;
  },
  
  trackStat: (statName, amount = 1) => {
    updateLocalStats(statName, amount);
    if (!sessionStats[statName]) sessionStats[statName] = 0;
    sessionStats[statName] += amount;
  },

  syncSessionStats: async () => {
      const statsToSend = { ...sessionStats };
      const keys = Object.keys(statsToSend);
      if (keys.length === 0) return;
      
      sessionStats = {}; 

      try {
          await authenticateTalo();
          
          if (!cachedAliasId) return;

          const promises = keys.map(async (key) => {
              const amount = statsToSend[key];
              const url = `${API_URL}/game-stats/${key}`;
              
              try {
                  await fetch(url, {
                      method: 'PUT',
                      headers: getTaloHeaders(), 
                      body: JSON.stringify({ change: amount })
                  });
              } catch (err) {}
          });

          await Promise.all(promises);
          statsCache.data = null; 

      } catch (e) {
          console.error("Stats Sync Critical Error:", e);
      }
  },

  getGlobalStats: async () => {
    const now = Date.now();
    if (statsCache.data && (now - statsCache.lastFetch < statsCache.CACHE_DURATION)) {
        return statsCache.data;
    }

    try {
        const url = `${API_URL}/game-stats`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        let statsMap = {};
        const list = data.gameStats || data.stats || (Array.isArray(data) ? data : []);
        
        if (Array.isArray(list)) {
            list.forEach(stat => {
                const key = stat.internalName || stat.internal_name;
                const val = stat.globalValue || stat.global_value || 0;
                if (key) statsMap[key] = val;
            });
        }
        
        statsCache.data = statsMap;
        statsCache.lastFetch = now;
        return statsMap;
    } catch (e) {
        return {};
    }
  },

  getLocalStats: () => {
      return safeJsonParse(localStorage.getItem(LOCAL_STATS_KEY), {});
  },

  trackUniquePlayer: () => {
      if (!localStorage.getItem('szkeletal_stat_unique_tracked')) {
          LeaderboardService.trackStat('unique_players', 1);
          setTimeout(() => LeaderboardService.syncSessionStats(), 2000);
          localStorage.setItem('szkeletal_stat_unique_tracked', 'true');
      }
  },

  submitScore: async (nick, score, level, timeVal, kills, isCheated = false) => {
    const now = Date.now();
    if (!nick || nick.trim() === "") return { success: false, msg: "Brak nicku" };
    const cleanNick = nick.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').substring(0, 20).trim();
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) return { success: false, msg: "Za często" };
    lastSubmissionTime = now;
    
    updatePlayerIdentifierWithNick(cleanNick);
    
    let cheatDetected = isCheated;
    if (!cheatDetected && timeVal > 5 && score > 0) {
      const scoreRatio = score / timeVal;
      const killRatio = kills / timeVal;
      if (scoreRatio > MAX_SCORE_PER_SECOND || killRatio > MAX_KILLS_PER_SECOND) cheatDetected = true;
    }
    
    if (cheatDetected) {
      const shadowEntry = { name: cleanNick, score, time: timeVal, level, kills, date: new Date().toISOString() };
      let shadowHistory = [];
      const stored = localStorage.getItem(SHADOW_BAN_KEY);
      if (stored) {
          const parsed = safeJsonParse(stored, []);
          shadowHistory = Array.isArray(parsed) ? parsed : [parsed];
      }
      shadowHistory.push(shadowEntry);
      if (shadowHistory.length > 50) shadowHistory.shift();
      localStorage.setItem(SHADOW_BAN_KEY, JSON.stringify(shadowHistory));
      LeaderboardService.clearCache();
      return { success: true, msg: "Wysłano pomyślnie!" }; 
    }
    
    try {
        await authenticateTalo();
        if (!cachedAliasId) {
            return { success: false, msg: "Błąd autoryzacji" };
        }

        const entryUrl = `${API_URL}/leaderboards/${LEADERBOARD_NAME}/entries`;
        const propsArray = [
            { key: "nickname", value: cleanNick },
            { key: "level", value: level.toString() },
            { key: "kills", value: kills.toString() },
            { key: "time", value: timeVal.toString() }
        ];

        const response = await fetch(entryUrl, {
            method: 'POST',
            headers: getTaloHeaders(), 
            body: JSON.stringify({ score: score, props: propsArray })
        });

        if (response.ok) {
            LeaderboardService.clearCache();
            return { success: true };
        } else {
            return { success: false, msg: "Błąd serwera" };
        }
    } catch (e) {
        return { success: false, msg: "Błąd sieci" };
    }
  },
  
  getScores: async (period = 'all') => {
    const now = Date.now();
    let entries = [];
    
    if (cache.data && (now - cache.lastFetch < cache.CACHE_DURATION)) {
        entries = cache.data;
    } else {
      // ZMIANA v0.110e: Pętla pobierania wszystkich stron wyników (Talo ma limit 50 na stronę)
      let page = 0;
      const limitPerPage = 50; 
      let hasMore = true;
      let allFetchedEntries = [];

      try {
        while (hasMore && page < 20) { // Limit bezpieczeństwa: 1000 rekordów (20 stron po 50)
          let url = `${API_URL}/leaderboards/${LEADERBOARD_NAME}/entries?page=${page}&limit=${limitPerPage}&withDeleted=false`;
          
          const response = await fetch(url, { 
              headers: { 
                  'Authorization': `Bearer ${getApiKey()}`, 
                  'Content-Type': 'application/json' 
              } 
          });
          
          const data = await response.json();
          
          if (data.entries && Array.isArray(data.entries) && data.entries.length > 0) {
              const mapped = data.entries.map(e => {
                  let propsMap = {};
                  if (Array.isArray(e.props)) e.props.forEach(p => { propsMap[p.key] = p.value; });
                  else if (typeof e.props === 'object') propsMap = e.props; 
                  
                  let dateStr = e.created_at || e.createdAt || e.updatedAt;
                  let entryDate = dateStr ? new Date(dateStr) : null;

                  return {
                      name: propsMap.nickname || "Anonim",
                      score: parseFloat(e.score),
                      time: parseInt(propsMap.time) || 0,
                      level: parseInt(propsMap.level) || 1,
                      kills: parseInt(propsMap.kills) || 0,
                      date: entryDate
                  };
              }).filter(e => e.date !== null);

              allFetchedEntries = allFetchedEntries.concat(mapped);
              
              // Jeśli Talo zwróciło mniej rekordów niż limit strony, oznacza to koniec danych
              if (data.entries.length < limitPerPage) {
                  hasMore = false;
              } else {
                  page++;
              }
          } else {
              hasMore = false;
          }
        }
        
        entries = allFetchedEntries;
        cache.data = entries;
        cache.lastFetch = now;
        
        console.log(`[Leaderboard] Pobrano łącznie ${entries.length} wyników (Strony: ${page + 1}).`);
        
      } catch (e) { 
          console.error("[Leaderboard] Błąd pobierania wielu stron:", e);
          entries = []; 
      }
    }
    
    // FILTROWANIE CLIENT-SIDE (Działa na pełnym pobranym zestawie danych)
    let filteredEntries = [...entries];
    if (period !== 'all') {
        const dateNow = new Date();
        const startOfDay = new Date(dateNow.setHours(0,0,0,0));
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        filteredEntries = entries.filter(e => {
            if (!e.date) return false;
            if (period === 'today') return e.date >= startOfDay;
            if (period === 'weekly') return e.date >= oneWeekAgo;
            if (period === 'monthly') return e.date >= oneMonthAgo;
            return true;
        });
    }

    let displayEntries = [...filteredEntries];
    const shadowString = localStorage.getItem(SHADOW_BAN_KEY);
    if (shadowString) {
        const parsed = safeJsonParse(shadowString, []);
        let shadowList = Array.isArray(parsed) ? parsed : [parsed];
        shadowList.forEach(item => {
          const itemDate = new Date(item.date);
          const dateNow = new Date();
          let show = true;
          if (period === 'today' && itemDate < new Date(dateNow.setHours(0,0,0,0))) show = false;
          if (show) displayEntries.push({ ...item, date: itemDate });
        });
    }
    
    displayEntries.sort((a, b) => b.score - a.score);
    // Zwracamy Top 200 do tabeli interfejsu
    return displayEntries.slice(0, 200);
  }
};