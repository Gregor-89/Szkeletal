// ==============
// LEADERBOARD.JS (v1.16 - Date Filter Fix)
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

        if (!response.ok) {
            console.error(`Talo Auth Failed: ${response.status} ${response.statusText}`);
            return null;
        }
        
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
        console.error("Talo Auth Network Error:", e);
        return null;
    }
}

function updateLocalStats(statName, value) {
    let stats = {};
    try {
        stats = JSON.parse(localStorage.getItem(LOCAL_STATS_KEY) || "{}");
    } catch (e) { stats = {}; }

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
      
      console.log("[Stats] Wysyłanie do Talo...", keys);
      sessionStats = {}; 

      try {
          await authenticateTalo();
          
          if (!cachedAliasId) {
             console.warn("[Stats] Brak autoryzacji (aliasId). Pomijam wysyłkę.");
             return;
          }

          const promises = keys.map(async (key) => {
              const amount = statsToSend[key];
              const url = `${API_URL}/game-stats/${key}`;
              
              try {
                  const res = await fetch(url, {
                      method: 'PUT',
                      headers: getTaloHeaders(), 
                      body: JSON.stringify({ change: amount })
                  });
                  if (!res.ok) {
                      const txt = await res.text();
                      console.warn(`[Stats] Błąd wysyłania ${key}: ${res.status}`, txt);
                  }
                  return res;
              } catch (err) {
                  console.warn(`[Stats] Błąd sieci dla ${key}`, err);
              }
          });

          await Promise.all(promises);
          console.log("[Stats] Synchronizacja zakończona.");
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
        console.error("Stats Fetch Error:", e);
        return {};
    }
  },

  getLocalStats: () => {
      try {
          return JSON.parse(localStorage.getItem(LOCAL_STATS_KEY) || "{}");
      } catch (e) { return {}; }
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
      try {
        const stored = localStorage.getItem(SHADOW_BAN_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          shadowHistory = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {}
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
            const txt = await response.text();
            console.error("Talo Submit Error:", txt);
            return { success: false, msg: "Błąd serwera" };
        }
    } catch (e) {
        return { success: false, msg: "Błąd sieci" };
    }
  },
  
  getScores: async (period = 'all') => {
    const now = Date.now();
    let entries = [];
    if (cache.data && (now - cache.lastFetch < cache.CACHE_DURATION)) entries = cache.data;
    else {
      // Pobieramy więcej wyników (200), żeby móc je filtrować client-side
      let url = `${API_URL}/leaderboards/${LEADERBOARD_NAME}/entries?page=0&limit=200&withDeleted=false`;
      
      // Dodajemy filtr startDate dla API, ale z marginesem bezpieczeństwa (np. -1 dzień) lub wcale
      // Lepiej wysłać request bez filtru daty (lub szeroki) i filtrować precyzyjnie w JS
      if (period !== 'all') {
          // Dla pewności wysyłamy do API prośbę o szerszy zakres, a w JS docinamy
          // Jeśli Talo obsługuje startDate, użyjmy go, ale nie ufajmy mu w 100% przy granicach dni
          const dateNow = new Date();
          let startDate;
          if (period === 'today') startDate = new Date(dateNow.setHours(0,0,0,0)).toISOString();
          else if (period === 'weekly') startDate = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          else if (period === 'monthly') startDate = new Date(dateNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          
          if(startDate) url += `&startDate=${startDate}`;
      }

      try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.entries && Array.isArray(data.entries)) {
            entries = data.entries.map(e => {
                let propsMap = {};
                if (Array.isArray(e.props)) e.props.forEach(p => { propsMap[p.key] = p.value; });
                else if (typeof e.props === 'object') propsMap = e.props; 
                
                // FIX DATY: Szukamy created_at lub createdAt, bez fallbacku do new Date()
                let dateStr = e.created_at || e.createdAt || e.updatedAt;
                let entryDate = dateStr ? new Date(dateStr) : null;

                return {
                    name: propsMap.nickname || "Anonim",
                    score: parseFloat(e.score),
                    time: parseInt(propsMap.time) || 0,
                    level: parseInt(propsMap.level) || 1,
                    kills: parseInt(propsMap.kills) || 0,
                    date: entryDate // Może być null
                };
            }).filter(e => e.date !== null); // Odsiewamy błędne daty
        }
        cache.data = entries;
        cache.lastFetch = now;
      } catch (e) { entries = []; }
    }
    
    // FILTROWANIE CLIENT-SIDE (Precyzyjne)
    if (period !== 'all') {
        const dateNow = new Date();
        const startOfDay = new Date(dateNow.setHours(0,0,0,0));
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        entries = entries.filter(e => {
            if (period === 'today') return e.date >= startOfDay;
            if (period === 'weekly') return e.date >= oneWeekAgo;
            if (period === 'monthly') return e.date >= oneMonthAgo;
            return true;
        });
    }

    let displayEntries = [...entries];
    const shadowString = localStorage.getItem(SHADOW_BAN_KEY);
    if (shadowString) {
      try {
        const parsed = JSON.parse(shadowString);
        let shadowList = Array.isArray(parsed) ? parsed : [parsed];
        shadowList.forEach(item => {
          const itemDate = new Date(item.date);
          const dateNow = new Date();
          let show = true;
          if (period === 'today' && itemDate < new Date(dateNow.setHours(0,0,0,0))) show = false;
          if (show) displayEntries.push({ ...item, date: itemDate });
        });
      } catch (e) { }
    }
    displayEntries.sort((a, b) => b.score - a.score);
    return displayEntries.slice(0, 100);
  }
};