// ==============
// ASSETS.JS (v0.56 - Nowy plik)
// Lokalizacja: /js/services/assets.js
// ==============

// Przechowuje załadowane zasoby (np. obrazy)
const loadedAssets = new Map();

/**
 * Lista wszystkich zasobów do załadowania.
 * Na razie używamy fałszywych ścieżek.
 * Gdy dodasz grafiki, zaktualizuj te ścieżki.
 */
const ASSET_LIST = [
  // --- Gracz ---
  { id: 'player', src: 'img/player.png' },
  
  // --- Wrogowie ---
  { id: 'enemy_standard', src: 'img/enemies/standard.png' },
  { id: 'enemy_horde', src: 'img/enemies/horde.png' },
  { id: 'enemy_aggressive', src: 'img/enemies/aggressive.png' },
  { id: 'enemy_kamikaze', src: 'img/enemies/kamikaze.png' },
  { id: 'enemy_splitter', src: 'img/enemies/splitter.png' },
  { id: 'enemy_tank', src: 'img/enemies/tank.png' },
  { id: 'enemy_ranged', src: 'img/enemies/ranged.png' },
  { id: 'enemy_elite', src: 'img/enemies/elite.png' },
  
  // --- Pickupy ---
  { id: 'pickup_heal', src: 'img/pickups/heal.png' },
  { id: 'pickup_magnet', src: 'img/pickups/magnet.png' },
  { id: 'pickup_shield', src: 'img/pickups/shield.png' },
  { id: 'pickup_speed', src: 'img/pickups/speed.png' },
  { id: 'pickup_bomb', src: 'img/pickups/bomb.png' },
  { id: 'pickup_freeze', src: 'img/pickups/freeze.png' },
  
  // --- Inne ---
  { id: 'gem', src: 'img/gem.png' },
  { id: 'chest', src: 'img/chest.png' },
];

/**
 * Ładuje pojedynczy zasób (obraz).
 * @param {object} assetInfo - Obiekt z { id, src }
 * @returns {Promise<void>}
 */
function loadAsset(assetInfo) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = assetInfo.src;
    
    img.onload = () => {
      console.log(`[Assets] Załadowano: ${assetInfo.src}`);
      loadedAssets.set(assetInfo.id, img);
      resolve();
    };
    
    img.onerror = () => {
      // Nie traktujemy tego jako błędu krytycznego,
      // gra będzie działać z kwadratami
      console.warn(`[Assets] Nie można załadować: ${assetInfo.src}. Plik nie istnieje lub jest uszkodzony.`);
      loadedAssets.set(assetInfo.id, null); // Ustawiamy na null, aby wiedzieć, że próbowaliśmy
      resolve(); // Rozwiązujemy obietnicę, aby gra mogła kontynuować
    };
  });
}

/**
 * Ładuje wszystkie zasoby z listy ASSET_LIST.
 * @returns {Promise<void>} - Zwraca obietnicę, która kończy się, gdy wszystkie zasoby są przetworzone.
 */
export function loadAssets() {
  console.log('[Assets] Rozpoczynam ładowanie zasobów...');
  const promises = ASSET_LIST.map(assetInfo => loadAsset(assetInfo));
  
  // Czekamy, aż wszystkie próby ładowania się zakończą
  return Promise.all(promises).then(() => {
    console.log(`[Assets] Zakończono ładowanie. Załadowano ${loadedAssets.size} zasobów.`);
  });
}

/**
 * Pobiera załadowany zasób.
 * @param {string} id - ID zasobu (np. 'player')
 * @returns {Image|null} - Zwraca obiekt obrazu lub null, jeśli nie został załadowany.
 */
export function get(id) {
  return loadedAssets.get(id) || null;
}