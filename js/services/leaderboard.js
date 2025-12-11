// ==============
// LEADERBOARD.JS (v1.0 - Anti-Cheat Security)
// Lokalizacja: /js/services/leaderboard.js
// ==============

// Rozbity klucz, aby utrudnić proste wyszukiwanie (Ctrl+F) w kodzie źródłowym
const _k_parts = ["Rk_e_q710U", "CvW1GYzvME", "3QcKYKhi6V", "50mA5sW-9t", "raiQ"];
const getKey = () => _k_parts.join('');

const PUBLIC_CODE = "693982968f40bb18648a3aab";
const BASE_URL = "http://dreamlo.com/lb/";

// Limity Sanity Check (Teoretyczne maksima)
const MAX_SCORE_PER_SECOND = 3000; // Bardzo liberalny limit
const MAX_KILLS_PER_SECOND = 25; // Limit zabójstw na sekundę

let cache = {
  data: null,
  lastFetch: 0,
  CACHE_DURATION: 60000 // 60s
};

let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 30000; // 30 sekund odstępu między wysyłkami

export const LeaderboardService = {
  
  clearCache: () => {
    cache.data = null;
    cache.lastFetch = 0;
  },
  
  submitScore: async (nick, score, level, timeVal, kills, isCheated = false) => {
    // 1. Flood Protection
    const now = Date.now();
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      return { success: false, msg: "Za często wysyłasz (odczekaj 30s)" };
    }
    lastSubmissionTime = now;
    
    // 2. Podstawowa walidacja danych
    if (!nick || nick.trim() === "") return { success: false, msg: "Brak nicku" };
    const cleanNick = nick.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').substring(0, 20).trim();
    if (cleanNick.length === 0) return { success: false, msg: "Niepoprawny nick" };
    
    // 3. Fake Submit (Dla oflagowanych oszustów)
    // Jeśli flaga jest true, udajemy sukces, ale nie wysyłamy requestu.
    if (isCheated) {
      console.warn("[Leaderboard] Cheater detected via Flag. Simulating submit.");
      return { success: true, msg: "Wysłano pomyślnie!" }; // Kłamstwo w dobrej wierze ;)
    }
    
    // 4. Sanity Check (Dla modyfikatorów pamięci bez flagi)
    // Pomijamy sprawdzenie dla bardzo krótkich gier (<5s) lub zerowych wyników
    if (timeVal > 5 && score > 0) {
      const scoreRatio = score / timeVal;
      const killRatio = kills / timeVal;
      
      if (scoreRatio > MAX_SCORE_PER_SECOND) {
        console.warn(`[Leaderboard] Sanity Check Fail: Score Ratio ${scoreRatio.toFixed(1)}`);
        return { success: true }; // Fake success
      }
      if (killRatio > MAX_KILLS_PER_SECOND) {
        console.warn(`[Leaderboard] Sanity Check Fail: Kill Ratio ${killRatio.toFixed(1)}`);
        return { success: true }; // Fake success
      }
    }
    
    // 5. Właściwe wysłanie (tylko jeśli przeszło powyższe)
    const safeNick = encodeURIComponent(cleanNick);
    const extraData = `${level}|${kills}`;
    const privateKey = getKey(); // Składamy klucz w locie
    
    const url = `${BASE_URL}${privateKey}/add/${safeNick}/${score}/${timeVal}/${extraData}`;
    
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
          
          let decodedName = entry.name;
          try { decodedName = decodeURIComponent(entry.name); } catch (e) {}
          
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