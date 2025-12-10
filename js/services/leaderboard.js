// ==============
// LEADERBOARD.JS (v0.99c - Nick Validation Update)
// Lokalizacja: /js/services/leaderboard.js
// ==============

const PRIVATE_CODE = "Rk_e_q710UCvW1GYzvME3QcKYKhi6V50mA5sW-9traiQ";
const PUBLIC_CODE = "693982968f40bb18648a3aab";
const BASE_URL = "http://dreamlo.com/lb/";

let cache = {
  data: null,
  lastFetch: 0,
  CACHE_DURATION: 60000 // 60s
};

export const LeaderboardService = {
  
  clearCache: () => {
    cache.data = null;
    cache.lastFetch = 0;
  },
  
  submitScore: async (nick, score, level, timeVal, kills) => {
    if (!nick || nick.trim() === "") return { success: false, msg: "Brak nicku" };
    
    // ZMIANA: Walidacja - dopuszczamy polskie znaki i spacje, limit 20
    // Wycinamy wszystko co NIE jest literą (PL/EN), cyfrą, spacją, _ lub -
    const cleanNick = nick.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').substring(0, 20).trim();
    
    if (cleanNick.length === 0) return { success: false, msg: "Niepoprawny nick" };
    
    // Dreamlo wymaga zakodowania URL (spacje jako %20 itp.)
    const safeNick = encodeURIComponent(cleanNick);
    
    const extraData = `${level}|${kills}`;
    const url = `${BASE_URL}${PRIVATE_CODE}/add/${safeNick}/${score}/${timeVal}/${extraData}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        LeaderboardService.clearCache();
        return { success: true };
      } else {
        return { success: false, msg: "Błąd sieci" };
      }
    } catch (e) {
      console.error("Leaderboard Submit Error:", e);
      return { success: false, msg: "Błąd sieci" };
    }
  },
  
  getScores: async (period = 'all') => {
    const now = Date.now();
    let entries = [];
    
    if (cache.data && (now - cache.lastFetch < cache.CACHE_DURATION)) {
      entries = cache.data;
    } else {
      const url = `${BASE_URL}${PUBLIC_CODE}/json`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        let rawEntries = [];
        if (data && data.dreamlo && data.dreamlo.leaderboard) {
          const lb = data.dreamlo.leaderboard.entry;
          if (Array.isArray(lb)) {
            rawEntries = lb;
          } else if (lb) {
            rawEntries = [lb];
          }
        }
        
        entries = rawEntries.map(entry => {
          let level = 1;
          let kills = 0;
          
          if (entry.text && entry.text.includes('|')) {
            const parts = entry.text.split('|');
            level = parseInt(parts[0]) || 1;
            kills = parseInt(parts[1]) || 0;
          }
          
          const dateStr = entry.date;
          let entryDate = new Date(dateStr);
          if (isNaN(entryDate.getTime())) entryDate = new Date();
          
          // Dekodujemy nick z URL (np. spacje)
          let decodedName = entry.name;
          try {
            decodedName = decodeURIComponent(entry.name);
          } catch (e) {}
          
          return {
            name: decodedName,
            score: parseInt(entry.score) || 0,
            time: parseInt(entry.seconds) || 0,
            level: level,
            kills: kills,
            date: entryDate
          };
        });
        
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, i) => e.originalRank = i + 1);
        
        cache.data = entries;
        cache.lastFetch = now;
        
      } catch (e) {
        console.error("Leaderboard Fetch Error:", e);
        return [];
      }
    }
    
    let filteredScores = [...entries];
    const dateNow = new Date();
    const startOfDay = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());
    
    if (period === 'today') {
      filteredScores = filteredScores.filter(s => s.date >= startOfDay);
    } else if (period === 'weekly') {
      const weekAgo = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredScores = filteredScores.filter(s => s.date >= weekAgo);
    } else if (period === 'monthly') {
      const monthAgo = new Date(dateNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredScores = filteredScores.filter(s => s.date >= monthAgo);
    }
    
    return filteredScores.slice(0, 100);
  }
};