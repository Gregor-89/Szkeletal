// ==============
// ASSETS.JS (v0.97a - Loading Progress)
// Lokalizacja: /js/services/assets.js
// ==============

const assets = new Map();

const basePath = 'img/';

function register(key, asset) {
  // console.log(`[Assets] Zarejestrowano zasób: ${key}`);
  assets.set(key, asset);
}

export function get(key) {
  return assets.get(key) || null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

// FIX v0.97: loadAssets teraz przyjmuje onProgress callback
export function loadAssets(onProgress) {
  console.log('[Assets] Rozpoczynam ładowanie zasobów...');
  const promises = [];
  const entries = Object.entries(assetDefinitions);
  const total = entries.length;
  
  // Eksportujemy liczbę assetów dla main.js
  loadAssets.totalAssets = total;
  
  for (const [key, fileName] of entries) {
    const src = basePath + fileName;
    
    // Tworzymy promesę dla każdego pliku
    const p = loadImage(src).then(img => {
      if (img) register(key, img);
      // Wywołaj callback postępu jeśli istnieje
      if (onProgress) onProgress();
    });
    
    promises.push(p);
  }
  
  return Promise.all(promises).then(() => {
    console.log(`[Assets] Zakończono ładowanie. Załadowano ${assets.size} zasobów.`);
    return true;
  });
}

const assetDefinitions = {
  // --- GRACZ ---
  'player': 'player/drakul_spritesheet.png',
  
  // --- WROGOWIE (IDLE) ---
  'enemy_standard': 'enemies/dadgamer/dadgamer_idle.png',
  'enemy_horde': 'enemies/horde/horde_idle.png',
  'enemy_aggressive': 'enemies/aggressive/aggressive_idle.png',
  'enemy_kamikaze': 'enemies/troll/troll_idle.png',
  'enemy_splitter': 'enemies/splitter/splitter_idle.png',
  'enemy_tank': 'enemies/tank/tank_idle.png',
  'enemy_ranged': 'enemies/ranged/ranged_idle.png',
  'enemy_elite': 'enemies/elite/elite_idle.png',
  'enemy_wall': 'enemies/wall/wall_idle.png',
  
  // --- WROGOWIE (SPRITESHEETY) ---
  'enemy_standard_spritesheet': 'enemies/dadgamer/dadgamer_spritesheet.png',
  'enemy_horde_spritesheet': 'enemies/horde/horde_spritesheet.png',
  'enemy_aggressive_spritesheet': 'enemies/aggressive/aggressive_spritesheet.png',
  'enemy_kamikaze_spritesheet': 'enemies/troll/troll_spritesheet.png',
  'enemy_splitter_spritesheet': 'enemies/splitter/splitter_spritesheet.png',
  'enemy_tank_spritesheet': 'enemies/tank/tank_spritesheet.png',
  'enemy_elite_spritesheet': 'enemies/elite/elite_spritesheet.png',
  'enemy_wall_spritesheet': 'enemies/wall/wall_spritesheet.png',
  
  // --- MENEL (RANGED) ---
  'enemy_ranged_walk': 'enemies/ranged/ranged_walk.png',
  'enemy_ranged_attack': 'enemies/ranged/ranged_attack.png',
  
  // --- ŚRODOWISKO (Nowe v0.97) ---
  'env_tree_1': 'environment/tree_1.png',
  'env_tree_2': 'environment/tree_2.png',
  'env_tree_3': 'environment/tree_3.png',
  
  'env_rock_1': 'environment/rock_1.png',
  'env_rock_2': 'environment/rock_2.png',
  'env_rock_3': 'environment/rock_3.png',
  
  'env_hut_1': 'environment/hut_1.png',
  'env_hut_2': 'environment/hut_2.png',
  'env_hut_3': 'environment/hut_3.png',
  'env_hut_4': 'environment/hut_4.png',
  
  'env_water_1': 'environment/water_1.png',
  'env_water_2': 'environment/water_2.png',
  'env_water_3': 'environment/water_3.png',
  
  // --- HAZARDY ---
  'hazard_sewage': 'hazards/hazard_sewage.png',
  
  // --- POCISKI I BRONIE ---
  'enemy_ranged_projectile': 'projectiles/bottle.png',
  'weapon_orbital_potato': 'weapons/orbital_potato.png',
  'projectile_venom': 'projectiles/venom.png',
  'projectile_nova': 'projectiles/nova_shot.png',
  
  // --- POCISKI BOSSA ---
  'boss_proj_1': 'projectiles/boss_comment_1.png',
  'boss_proj_2': 'projectiles/boss_comment_2.png',
  'boss_proj_3': 'projectiles/boss_comment_3.png',
  'boss_proj_4': 'projectiles/boss_comment_4.png',
  'boss_proj_5': 'projectiles/boss_comment_5.png',
  'boss_proj_6': 'projectiles/boss_comment_6.png',
  
  // --- IKONY ---
  'icon_orbital': 'icons/orbital.jpg',
  'icon_whip': 'icons/whip.jpg',
  'icon_autogun': 'icons/autogun.png',
  'icon_nova': 'icons/nova.png',
  'icon_lightning': 'icons/lightning.png',
  
  'icon_damage': 'icons/damage.png',
  'icon_firerate': 'icons/firerate.png',
  'icon_multishot': 'icons/multishot.png',
  'icon_pierce': 'icons/pierce.png',
  
  'icon_level': 'icons/level.png',
  'icon_health': 'icons/health.png',
  'icon_speed': 'icons/speed.png',
  'icon_pickup_range': 'icons/magnet.png',
  
  'icon_hud_score': 'icons/hud_score.png',
  'icon_hud_level': 'icons/hud_level.png',
  'icon_hud_xp': 'icons/hud_xp.png',
  'icon_hud_health': 'icons/hud_health.png',
  'icon_hud_enemies': 'icons/hud_enemies.png',
  'icon_hud_time': 'icons/hud_time.png',
  
  'icon_hud_speed': 'icons/hud_speed.png',
  'icon_hud_shield': 'icons/hud_shield.png',
  'icon_hud_magnet': 'icons/hud_magnet.png',
  'icon_hud_freeze': 'icons/hud_freeze.png',
  
  // --- PICKUPY ---
  'pickup_heal': 'pickups/heal.png',
  'pickup_magnet': 'pickups/magnet.png',
  'pickup_shield': 'pickups/shield.png',
  'pickup_speed': 'pickups/speed.png',
  'pickup_bomb': 'pickups/bomb.png',
  'pickup_freeze': 'pickups/freeze.png',
  'gem': 'pickups/gem_potato.png',
  'chest': 'pickups/chest.png',
  
  // --- TŁO I INNE ---
  'bg_grass': 'bg_grass.png',
  'intro_1': 'intro/slide_1.png',
  'intro_2': 'intro/slide_2.png',
  'intro_3': 'intro/slide_3.png',
  'splash_dev': 'splash_dev.png',
  'splash_ratings': 'splash_ratings.png',
  'splash_logo': 'splash_logo.jpg',
  'effect_whip': 'effects/whip_slash.png',
  
  'sink': 'sink.png', // Zlew dodany wcześniej
  'qrcode': 'qrcode.png' // QR dodany wcześniej
};