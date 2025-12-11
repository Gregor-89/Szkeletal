// ==============
// LEADERBOARD.JS (v1.02 - Multi-Entry Shadow Ban)
// Lokalizacja: /js/services/leaderboard.js
// ==============

// Rozbity klucz, aby utrudnić proste wyszukiwanie (Ctrl+F) w kodzie źródłowym
const _k_parts = ["Rk_e_q710U", "CvW1GYzvME", "3QcKYKhi6V", "50mA5sW-9t", "raiQ"];
const getKey = () => _k_parts.join('');

const PUBLIC_CODE = "693982968f40bb18648a3aab";
const BASE_URL = "http://dreamlo.com/lb/";
const SHADOW_BAN_KEY = "szkeletal_shadow_entry"; // Klucz lokalny dla oszusta

// Limity Sanity Check (Teoretyczne maksima)
const MAX_SCORE_PER_SECOND = 3000;
const MAX_KILLS_PER_SECOND = 25;

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
    const now = Date.now();
    
    // 1. Walidacja podstawowa
    if (!nick || nick.trim() === "") return { success: false, msg: "Brak nicku" };
    const cleanNick = nick.replace(/[^a-zA-Z0-9_\- ąęćżźńłóśĄĘĆŻŹŃŁÓŚ]/g, '').substring(0, 20).trim();
    if (cleanNick.length === 0) return { success: false, msg: "Niepoprawny nick" };
    
    // 2. Flood Protection (symulujemy też dla czitera, żeby było realistycznie)
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      return { success: false, msg: "Za często wysyłasz (odczekaj 30s)" };
    }
    lastSubmissionTime = now;
    
    // 3. Wykrywanie oszustwa (Flag & Sanity)
    let cheatDetected = isCheated;
    
    // Sanity Check (jeśli flaga jeszcze nie została podniesiona)
    if (!cheatDetected && timeVal > 5 && score > 0) {
      const scoreRatio = score / timeVal;
      const killRatio = kills / timeVal;
      
      if (scoreRatio > MAX_SCORE_PER_SECOND || killRatio > MAX_KILLS_PER_SECOND) {
        console.warn(`[Leaderboard] Sanity Check Fail. ScoreRatio: ${scoreRatio.toFixed(1)}, KillRatio: ${killRatio.toFixed(1)}`);
        cheatDetected = true;
      }
    }
    
    // 4. SHADOW BAN / FAKE SUBMIT
    if (cheatDetected) {
      console.warn("[Leaderboard] Cheater detected. Performing Shadow Ban submit.");
      
      const shadowEntry = {
        name: cleanNick,
        score: score,
        time: timeVal,
        level: level,
        kills: kills,
        date: new Date().toISOString()
      };
      
      // --- ZMIANA: Obsługa historii wyników czitera ---
      let shadowHistory = [];
      try {
        const stored = localStorage.getItem(SHADOW_BAN_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Kompatybilność: Jeśli stary zapis był pojedynczym obiektem, zamień na tablicę
          if (Array.isArray(parsed)) {
            shadowHistory = parsed;
          } else if (typeof parsed === 'object') {
            shadowHistory = [parsed];
          }
        }
      } catch (e) {
        console.error("Shadow History Parse Error", e);
        shadowHistory = [];
      }
      
      // Dodajemy nowy wynik do historii
      shadowHistory.push(shadowEntry);
      
      // Opcjonalnie: Limit np. 50 ostatnich oszustw, żeby nie zapchać localStorage
      if (shadowHistory.length > 50) {
        shadowHistory.shift(); // Usuń najstarszy
      }
      
      // Zapisz z powrotem
      localStorage.setItem(SHADOW_BAN_KEY, JSON.stringify(shadowHistory));
      // ------------------------------------------------
      
      // Czyścimy cache, żeby cziter od razu zobaczył swój "sukces" na liście
      LeaderboardService.clearCache();
      
      return { success: true, msg: "Wysłano pomyślnie!" };
    }
    
    // 5. Właściwe wysłanie (Uczciwy gracz)
    const safeNick = encodeURIComponent(cleanNick);
    const extraData = `${level}|${kills}`;
    const privateKey = getKey();
    
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
        
        cache.data = entries;
        cache.lastFetch = now;
        
      } catch (e) {
        console.error("Leaderboard Fetch Error:", e);
        entries = [];
      }
    }
    
    // --- SHADOW BAN INJECTION (MULTI) ---
    let displayEntries = [...entries];
    
    const shadowString = localStorage.getItem(SHADOW_BAN_KEY);
    if (shadowString) {
      try {
        const parsed = JSON.parse(shadowString);
        
        // Obsługa zarówno starego formatu (obiekt) jak i nowego (tablica)
        let shadowList = [];
        if (Array.isArray(parsed)) {
          shadowList = parsed;
        } else if (typeof parsed === 'object') {
          shadowList = [parsed];
        }
        
        // Wstrzykujemy wszystkie wyniki z historii cienia
        shadowList.forEach(item => {
          // Musimy odtworzyć obiekt Date, bo z JSON-a wrócił jako string
          const injectedEntry = {
            ...item,
            date: new Date(item.date)
          };
          displayEntries.push(injectedEntry);
        });
        
        // Ponowne sortowanie całej zmieszanej listy
        displayEntries.sort((a, b) => b.score - a.score);
        
      } catch (e) {
        console.error("Shadow Entry Parse Error", e);
      }
    }
    // -----------------------------
    
    let filteredScores = [...displayEntries];
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
    
    // Przycinamy listę do np. 100 wyników, żeby nie była za długa (oszust może mieć dużo wpisów)
    return filteredScores.slice(0, 100);
  }
};