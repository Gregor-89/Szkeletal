// ==============
// LEADERBOARD.JS (v1.10 - Dynamic Nick ID)
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

const MAX_SCORE_PER_SECOND = 3000;
const MAX_KILLS_PER_SECOND = 25;

let cache = {
  data: null,
  lastFetch: 0,
  CACHE_DURATION: 60000 
};

let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 30000; 
let cachedAliasId = null;

function getPlayerIdentifier() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
        // Domyślny format: user_LOSOWE
        id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
}

// ZMIANA: Funkcja aktualizująca ID gracza o jego nick (np. user_123 -> Koczkodan_123)
function updatePlayerIdentifierWithNick(nick) {
    const currentId = getPlayerIdentifier();
    
    // Rozbijamy ID na części (zakładamy separator '_')
    const parts = currentId.split('_');
    
    // Bierzemy wszystko po pierwszym podkreślniku jako "unikalny sufiks"
    // Jeśli nie ma podkreślnika (stare ID?), traktujemy całe ID jako sufiks
    const suffix = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
    
    // Nowe ID: Nick + '_' + stary sufiks
    // Zamieniamy spacje w nicku na myślniki dla bezpieczeństwa URL
    const safeNick = nick.replace(/\s+/g, '-');
    const newId = `${safeNick}_${suffix}`;
    
    if (currentId !== newId) {
        console.log(`[Leaderboard] Aktualizacja ID: ${currentId} -> ${newId}`);
        localStorage.setItem(PLAYER_ID_KEY, newId);
        
        // Resetujemy cachedAliasId, aby wymusić ponowną autoryzację z nowym ID
        cachedAliasId = null;
    }
}

async function authenticateTalo() {
    if (cachedAliasId) return cachedAliasId;

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
            console.error(`Talo Auth Failed (${response.status})`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.alias && data.alias.id) {
             cachedAliasId = data.alias.id;
        } else if (data.aliases && Array.isArray(data.aliases)) {
            const alias = data.aliases.find(a => a.service === service);
            if (alias) cachedAliasId = alias.id;
            if (!cachedAliasId && data.aliases.length > 0) cachedAliasId = data.aliases[0].id;
        } else if (data.player && data.player.aliases) {
            const alias = data.player.aliases.find(a => a.service === service);
            if (alias) cachedAliasId = alias.id;
        }

        return cachedAliasId;

    } catch (e) {
        console.error("Talo Auth Network Error:", e);
        return null;
    }
}

export const LeaderboardService = {
  
  clearCache: () => {
    cache.data = null;
    cache.lastFetch = 0;
  },
  
  submitScore: async (nick, score, level, timeVal, kills, isCheated = false) => {
    const now = Date.now();
    
    if (!nick || nick.trim() === "") return { success: false, msg: "Brak nicku" };
    const cleanNick = nick.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').substring(0, 20).trim();
    
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      return { success: false, msg: "Za często (czekaj 30s)" };
    }
    lastSubmissionTime = now;
    
    // ZMIANA: Aktualizujemy ID gracza PRZED autoryzacją
    updatePlayerIdentifierWithNick(cleanNick);
    
    let cheatDetected = isCheated;
    if (!cheatDetected && timeVal > 5 && score > 0) {
      const scoreRatio = score / timeVal;
      const killRatio = kills / timeVal;
      if (scoreRatio > MAX_SCORE_PER_SECOND || killRatio > MAX_KILLS_PER_SECOND) cheatDetected = true;
    }
    
    if (cheatDetected) {
      const shadowEntry = {
        name: cleanNick, score, time: timeVal, level, kills,
        date: new Date().toISOString()
      };
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
        let aliasId = await authenticateTalo();
        
        if (!aliasId) {
            aliasId = await authenticateTalo();
            if (!aliasId) return { success: false, msg: "Błąd autoryzacji" };
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
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json',
                'x-talo-alias': aliasId
            },
            body: JSON.stringify({
                score: score,
                props: propsArray
            })
        });

        if (response.ok) {
            LeaderboardService.clearCache();
            return { success: true };
        } else {
            return { success: false, msg: "Błąd serwera" };
        }

    } catch (e) {
        console.error("Network Error:", e);
        return { success: false, msg: "Błąd sieci" };
    }
  },
  
  getScores: async (period = 'all') => {
    const now = Date.now();
    let entries = [];
    
    if (cache.data && (now - cache.lastFetch < cache.CACHE_DURATION)) {
      entries = cache.data;
    } else {
      let url = `${API_URL}/leaderboards/${LEADERBOARD_NAME}/entries?page=0&limit=50&withDeleted=false`;
      
      if (period !== 'all') {
          const dateNow = new Date();
          let startDate;
          if (period === 'today') startDate = new Date(dateNow.setHours(0,0,0,0)).toISOString();
          else if (period === 'weekly') startDate = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          else if (period === 'monthly') startDate = new Date(dateNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          if(startDate) url += `&startDate=${startDate}`;
      }

      try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.entries && Array.isArray(data.entries)) {
            entries = data.entries.map(e => {
                let propsMap = {};
                if (Array.isArray(e.props)) e.props.forEach(p => { propsMap[p.key] = p.value; });
                else if (typeof e.props === 'object') propsMap = e.props; 

                let nick = propsMap.nickname || "Anonim";
                let lvl = parseInt(propsMap.level) || 1;
                let kls = parseInt(propsMap.kills) || 0;
                let tm = parseInt(propsMap.time) || 0;

                let dateStr = e.createdAt || e.created_at || e.updatedAt || new Date().toISOString();
                let entryDate = new Date(dateStr);
                if (isNaN(entryDate.getTime())) entryDate = new Date(); 

                return {
                    name: nick,
                    score: parseFloat(e.score),
                    time: tm,
                    level: lvl,
                    kills: kls,
                    date: entryDate
                };
            });
        }
        cache.data = entries;
        cache.lastFetch = now;
      } catch (e) {
        console.error("Leaderboard Fetch Error:", e);
        entries = [];
      }
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