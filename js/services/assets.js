// ==============
// ASSETS.JS (v0.70 - FIX: Naprawa błędu TypeError w main.js)
// Lokalizacja: /js/services/assets.js
// ==============

const assets = new Map();
let sounds = {}; // POPRAWKA v0.58: Przeniesiono z audio.js
let audioContext = null; // POPRAWKA v0.58: Przeniesiono z audio.js

const basePath = 'img/'; // POPRAWKA v0.56: Ścieżka bazowa

/**
 * Rejestruje zasób (obraz) w menedżerze.
 * @param {string} key - Klucz identyfikujący zasób (np. 'player')
 * @param {Image} asset - Załadowany obiekt obrazu
 */
function register(key, asset) {
  console.log(`[Assets] Zarejestrowano zasób: ${key}`);
  assets.set(key, asset);
}

/**
 * Pobiera zasób (obraz) z menedżera.
 * @param {string} key - Klucz identyfikujący zasób
 * @returns {Image|null}
 */
export function get(key) {
  return assets.get(key) || null;
}

/**
 * Ładuje pojedynczy obraz.
 * @param {string} src - Ścieżka do pliku obrazu
 * @returns {Promise<Image>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[Assets] Nie można załadować: ${src}. Plik nie istnieje lub jest uszkodzony.`);
      // Zamiast odrzucać (reject), rozwiązujemy (resolve) z nullem,
      // aby Promise.all() nie zatrzymało się przy pierwszym błędzie.
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Ładuje obraz i rejestruje go pod kluczem.
 * @param {string} key - Klucz
 * @param {string} src - Ścieżka
 * @returns {Promise<void>}
 */
async function loadAndRegister(key, src) {
  const img = await loadImage(src);
  if (img) {
    register(key, img);
  }
}

/**
 * Definicje zasobów (Assets Definitions)
 * Klucze muszą pasować do typów wrogów, pickupów itp.
 */
const assetDefinitions = {
  // Gracz
  'player': 'player.png',
  
  // Wrogowie
  'enemy_standard': 'enemies/standard.png',
  'enemy_horde': 'enemies/horde.png',
  'enemy_aggressive': 'enemies/aggressive.png',
  'enemy_kamikaze': 'enemies/kamikaze.png',
  'enemy_splitter': 'enemies/splitter.png',
  'enemy_tank': 'enemies/tank.png',
  'enemy_ranged': 'enemies/ranged.png',
  'enemy_elite': 'enemies/elite.png',
  'enemy_wall': 'enemies/wall.png', // POPRAWKA v0.69: Dodano sprite Oblężnika
  
  // Pickupy
  'pickup_heal': 'pickups/heal.png',
  'pickup_magnet': 'pickups/magnet.png',
  'pickup_shield': 'pickups/shield.png',
  'pickup_speed': 'pickups/speed.png',
  'pickup_bomb': 'pickups/bomb.png',
  'pickup_freeze': 'pickups/freeze.png',
  
  // Inne
  'gem': 'gem.png',
  'chest': 'chest.png',
};

/**
 * Główna funkcja ładująca wszystkie zasoby (Obrazy).
 * @returns {Promise<void>}
 */
export function loadAssets() {
  console.log('[Assets] Rozpoczynam ładowanie zasobów...');
  const promises = [];
  
  for (const [key, fileName] of Object.entries(assetDefinitions)) {
    // Zakładamy, że basePath jest już zawarty w src, jeśli jest potrzebny
    // W naszym przypadku (v0.56) ścieżka jest już w definicji
    // const src = basePath + fileName; 
    // Poprawka (v0.56b): basePath jest globalny, ale loadAndRegister go nie używa. Użyjmy go.
    const src = basePath + fileName;
    promises.push(loadAndRegister(key, src));
  }
  
  // POPRAWKA v0.70 (FIX): Zwracamy rozwiązaną obietnicę (zamiast void), aby uniknąć błędu TypeError w .then() w main.js
  return Promise.all(promises).then(() => {
    console.log(`[Assets] Zakończono ładowanie. Załadowano ${assets.size} zasobów.`);
    return true; // Zwróć cokolwiek, aby results[0] nie był undefined
  });
}