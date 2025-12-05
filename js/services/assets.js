// ==============
// ASSETS.JS (v0.98a - Lumberjack Assets)
// Lokalizacja: /js/services/assets.js
// ==============

const assets = new Map();
const basePath = 'img/';

function register(key, asset) { assets.set(key, asset); }
export function get(key) { return assets.get(key) || null; }

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function loadAssets(onProgress) {
  console.log('[Assets] Rozpoczynam ładowanie zasobów...');
  const entries = Object.entries(assetDefinitions);
  loadAssets.totalAssets = entries.length;
  
  const promises = entries.map(([key, fileName]) => {
    return loadImage(basePath + fileName).then(img => {
      if (img) register(key, img);
      if (onProgress) onProgress();
    });
  });
  
  return Promise.all(promises).then(() => {
    console.log(`[Assets] Załadowano ${assets.size} zasobów.`);
    return true;
  });
}

const assetDefinitions = {
  'player': 'player/drakul_spritesheet.png',
  'enemy_standard': 'enemies/dadgamer/dadgamer_idle.png',
  'enemy_horde': 'enemies/horde/horde_idle.png',
  'enemy_aggressive': 'enemies/aggressive/aggressive_idle.png',
  'enemy_kamikaze': 'enemies/troll/troll_idle.png',
  'enemy_splitter': 'enemies/splitter/splitter_idle.png',
  'enemy_tank': 'enemies/tank/tank_idle.png',
  'enemy_ranged': 'enemies/ranged/ranged_idle.png',
  'enemy_elite': 'enemies/elite/elite_idle.png',
  'enemy_wall': 'enemies/wall/wall_idle.png',
  // NOWOŚĆ: Drwal
  'enemy_lumberjack': 'enemies/lumberjack/lumberjack_idle.png',
  
  'enemy_standard_spritesheet': 'enemies/dadgamer/dadgamer_spritesheet.png',
  'enemy_horde_spritesheet': 'enemies/horde/horde_spritesheet.png',
  'enemy_aggressive_spritesheet': 'enemies/aggressive/aggressive_spritesheet.png',
  'enemy_kamikaze_spritesheet': 'enemies/troll/troll_spritesheet.png',
  'enemy_splitter_spritesheet': 'enemies/splitter/splitter_spritesheet.png',
  'enemy_tank_spritesheet': 'enemies/tank/tank_spritesheet.png',
  'enemy_elite_spritesheet': 'enemies/elite/elite_spritesheet.png',
  'enemy_wall_spritesheet': 'enemies/wall/wall_spritesheet.png',
  'enemy_ranged_walk': 'enemies/ranged/ranged_walk.png',
  'enemy_ranged_attack': 'enemies/ranged/ranged_attack.png',
  // NOWOŚĆ: Animacje Drwala
  'enemy_lumberjack_walk': 'enemies/lumberjack/lumberjack_walk.png',
  'enemy_lumberjack_attack': 'enemies/lumberjack/lumberjack_attack.png',
  
  'env_tree_1': 'environment/tree_1.png',
  'env_tree_2': 'environment/tree_2.png',
  'env_tree_3': 'environment/tree_3.png',
  'env_tree_4': 'environment/tree_4.png',
  'env_tree_5': 'environment/tree_5.png',
  'env_tree_6': 'environment/tree_6.png',
  'env_rock_1': 'environment/rock_1.png',
  'env_rock_2': 'environment/rock_2.png',
  'env_rock_3': 'environment/rock_3.png',
  'env_rock_4': 'environment/rock_4.png',
  'env_rock_5': 'environment/rock_5.png',
  'env_rock_6': 'environment/rock_6.png',
  'env_hut_1': 'environment/hut_1.png',
  'env_hut_2': 'environment/hut_2.png',
  'env_hut_3': 'environment/hut_3.png',
  'env_hut_4': 'environment/hut_4.png',
  'env_hut_5': 'environment/hut_5.png',
  'env_hut_6': 'environment/hut_6.png',
  'env_hut_7': 'environment/hut_7.png',
  'env_rubble': 'environment/rubble.png',
  'env_water_1': 'environment/water_1.png',
  'env_water_2': 'environment/water_2.png',
  'env_water_3': 'environment/water_3.png',
  'env_water_4': 'environment/water_4.png',
  'env_water_5': 'environment/water_5.png',
  'env_water_6': 'environment/water_6.png',
  'env_shrine': 'environment/shrine.png',
  
  'hazard_sewage': 'hazards/hazard_sewage.png',
  'enemy_ranged_projectile': 'projectiles/bottle.png',
  // NOWOŚĆ: Siekiera
  'projectile_axe': 'projectiles/axe.png',
  
  'weapon_orbital_potato': 'weapons/orbital_potato.png',
  'projectile_venom': 'projectiles/venom.png',
  'projectile_nova': 'projectiles/nova_shot.png',
  
  'boss_proj_1': 'projectiles/boss_comment_1.png',
  'boss_proj_2': 'projectiles/boss_comment_2.png',
  'boss_proj_3': 'projectiles/boss_comment_3.png',
  'boss_proj_4': 'projectiles/boss_comment_4.png',
  'boss_proj_5': 'projectiles/boss_comment_5.png',
  'boss_proj_6': 'projectiles/boss_comment_6.png',
  
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
  
  'pickup_heal': 'pickups/heal.png',
  'pickup_magnet': 'pickups/magnet.png',
  'pickup_shield': 'pickups/shield.png',
  'pickup_speed': 'pickups/speed.png',
  'pickup_bomb': 'pickups/bomb.png',
  'pickup_freeze': 'pickups/freeze.png',
  'gem': 'pickups/gem_potato.png',
  'chest': 'pickups/chest.png',
  
  'bg_grass': 'bg_grass.png',
  'intro_1': 'intro/slide_1.png',
  'intro_2': 'intro/slide_2.png',
  'intro_3': 'intro/slide_3.png',
  'splash_dev': 'splash_dev.png',
  'splash_ratings': 'splash_ratings.png',
  'splash_logo': 'splash_logo.jpg',
  'effect_whip': 'effects/whip_slash.png',
  'sink': 'sink.png',
  'qrcode': 'qrcode.png'
};