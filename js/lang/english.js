// ==============
// ENGLISH.JS (v0.90b - Poprawki kluczy i Przewodnika)
// Lokalizacja: /js/lang/english.js
// ==============

// Ten plik zawiera wszystkie tłumaczenia dla języka angielskiego.
// Zachowuje "sznyt" lore z polskiego oryginału.

export const LANG_EN = {
  
  // === 1. Podstawowe Mechaniki (GDD) ===
  ui_player_name: "Drakul",
  
  // (Klucz GDD)
  ui_hp_name: "Satiety",
  ui_hp_desc: "Hater attacks reduce the Satiety Gauge. A drop to zero implies existential failure.",
  ui_hp_icon: "😋",
  
  // (Klucz GDD)
  ui_xp_name: "Verticality",
  ui_xp_desc: "The acquisition of \"Potatoes\" is crucial for Verticality progression.",
  ui_xp_icon: "🥔",
  
  ui_gem_name: "Potatoes",
  ui_gem_desc: "Defeated adversaries release the essence of the \"Potato\". Acquisition is imperative! Uncollected Potatoes will depreciate over time.",
  
  ui_levelup_name: "Level of Verticality",
  ui_levelup_desc: "An objective achievement of Verticality. Allows for a re-evaluation of strategy, selection of new attributes, and full restoration of \"Satiety\".",
  
  // === 2. UI - HUD (Paski i Statystyki na górze) ===
  // POPRAWKA v0.90b: Dodano brakujące klucze dla HUD
  ui_hud_hp_name: "Satiety",
  ui_hud_xp_name: "Verticality",
  
  ui_hud_score: "Score",
  ui_hud_level: "Level",
  ui_hud_enemies: "Enemies",
  ui_hud_time: "Time",
  ui_hud_health: "Health", // (Placeholder, jeśli gdzieś się ostał)
  
  // === 3. UI - Menu Główne i Zakładki ===
  ui_menu_tab_game: "Game",
  ui_menu_tab_config: "Configuration",
  ui_menu_tab_dev: "🛠️ Dev Menu",
  ui_menu_tab_guide: "Guide",
  ui_menu_start: "▶️ Start New Game",
  ui_menu_continue: "⏯️ Continue Game",
  ui_menu_replay_intro: "🎥 Replay Intro",
  ui_menu_new_game_prompt: "Welcome to Szkeletal: Drakul's Estrogen Potato Hunger! Choose your difficulty and start the game.",
  
  // === 4. UI - Zakładka Konfiguracja ===
  ui_config_title_game: "Gameplay Settings",
  ui_config_joystick: "Joystick Position:",
  ui_config_joy_left: "Left",
  ui_config_joy_right: "Right",
  ui_config_joy_off: "Disabled",
  ui_config_hyper: "⚡ Hyper Mode (+20% Game Speed)",
  ui_config_shake: "📳 Screen Shake",
  
  ui_config_title_visual: "Visuals & Debug Settings",
  ui_config_fps: "📊 Show FPS Counter",
  ui_config_fps_pos: "FPS Counter Position:",
  ui_config_fps_pos_left: "Left",
  ui_config_fps_pos_right: "Right",
  ui_config_labels: "🏷️ Show Pickup Labels",
  ui_config_style: "Pickup Style:",
  ui_config_style_circle: "🔵 Colored Circles",
  ui_config_style_emoji: "😀 Emojis",
  
  ui_config_title_lang: "Language",
  
  // === 5. UI - Zakładka Przewodnik (Tytuły Sekcji) ===
  // POPRAWKA v0.90b: Oczyszczono nazwy i dodano emoji
  ui_guide_title: "The Count's Guide",
  ui_guide_intro: "You take on the role of the Estrogen Count Drakul. Satisfy his \"Potato Hunger\" by smiting haters and striving for absolute Verticality.",
  ui_guide_basics_title: "🎮 Basic Rules",
  ui_guide_basics_1: "Goal: Survive as long as possible 📈, collect Potatoes 🥔, achieve higher Levels of Verticality ⭐",
  ui_guide_basics_2: "Controls: WASD/Arrow Keys ⌨️ or virtual joystick 🕹️ on screen",
  ui_guide_basics_3: "Pause: ESC key ⏸️ or release the joystick (instant auto-pause)",
  ui_guide_basics_4: "Progress: Each Level of Verticality = choose one of three upgrades 🎁",
  ui_guide_basics_5: "Enemies: Haters get tougher over time 👾 ⏱️",
  
  ui_guide_pickups_title: "🎁 Pickups",
  ui_guide_enemies_title: "👾 List of Haters", // Skrócono
  ui_guide_hazards_title: "☢️ Hazards",
  ui_guide_weapons_title: "⚔️ The Count's Arsenal",
  ui_guide_perks_title: "🔧 Upgrades",
  
  // === 6. UI - Ekrany Nakładkowe (Overlays) ===
  ui_pause_title: "⏸️ Pause",
  ui_pause_text: "Game Paused",
  ui_pause_resume: "Resume",
  ui_pause_menu: "Main Menu",
  
  ui_resume_text: "Resuming in:", // (np. "Resuming in: 0.75 s")
  
  ui_levelup_title: "Choose an Upgrade",
  ui_levelup_stats: "📊 Current Stats",
  ui_levelup_max: "All perks maxed out! Continue...",
  
  ui_chest_title: "🎁 Open LudoBox",
  ui_chest_button: "Open and Claim",
  ui_chest_empty_title: "LudoBox Empty",
  ui_chest_empty_desc: "All upgrades are already maxed out!",
  
  ui_gameover_title: "💀 GAME OVER",
  ui_gameover_score: "🎯 Score:",
  ui_gameover_level: "⭐ Level:",
  ui_gameover_time: "⏱️ Time Survived:",
  ui_gameover_retry: "Play Again",
  ui_gameover_menu: "Menu",
  
  // === 7. UI - Tablica Wyników i Modale ===
  ui_scores_title: "🏆 High Scores",
  ui_scores_clear: "🗑️ Clear",
  ui_scores_col_rank: "#️⃣",
  ui_scores_col_score: "🎯 Score",
  ui_scores_col_level: "⭐ Level",
  ui_scores_col_time: "⏱️ Time",
  
  ui_confirm_title: "Confirmation",
  ui_confirm_clear_scores: "Are you sure you want to clear the high scores? This operation cannot be undone.",
  ui_confirm_yes: "Yes, clear",
  ui_confirm_no: "Cancel",
  
  // === 8. UI - Intro ===
  ui_intro_prev: "Back",
  ui_intro_skip: "Skip (Close)",
  ui_intro_next: "Next",
  ui_intro_finish: "To Main Menu ▶️",
  
  // === 9. Pickupy (GDD) ===
  pickup_heal_name: "Countess's Plate",
  pickup_heal_desc: "A relic of lost love. Immediately restores +30 Satiety points.",
  
  pickup_magnet_name: "Count's Greed",
  pickup_magnet_desc: "A 2-second indulgence during which the Count manifests a magnetic predilection for nearby \"Potatoes\".",
  
  pickup_shield_name: "IceGod's Shield",
  pickup_shield_desc: "A transcendental aura of the \"God Syndrome\". Guarantees absolute invulnerability and immanence to damage for 8 seconds.",
  
  pickup_speed_name: "Bum's Sneakers",
  pickup_speed_desc: "A relic from Olszynki. Grants a +40% bonus to movement speed for 8 seconds. Ideal for repositioning.",
  
  pickup_bomb_name: "BanWave",
  pickup_bomb_desc: "The moderator's final verdict. Instant annihilation of all haters in the immediate vicinity.",
  
  pickup_freeze_name: "Cooldown",
  pickup_freeze_desc: "Induces a \"Powerful Cringe\", slowing all adversaries on screen (-75% speed) for 5 seconds.",
  
  pickup_chest_name: "LudoBox",
  pickup_chest_desc: "An invitation to a \"ludological\" roulette. Guarantees one random attribute upon acquisition. Dropped by defeated \"Boss-Souls\".",
  
  // === 10. Wrogowie i Zagrożenia (GDD) ===
  enemy_standard_name: "Dadgamer",
  enemy_standard_desc: "The basic hater, the scourge of gaming. His movement vector is sinusoidal, hindering vertical annihilation.",
  
  enemy_horde_name: "Chat Matt",
  enemy_horde_desc: "A brainless idol. Appears exclusively in cohesion. Exhibits lower base speed, but his \"Swarm\" behavior actively seeks to surround the Count.",
  
  enemy_aggressive_name: "Provocator",
  enemy_aggressive_desc: "An insidious adversary. At close range, he pauses (signaling), then executes a violent charge with a speed bonus.",
  
  enemy_kamikaze_name: "Troll",
  enemy_kamikaze_desc: "A fast, chaotic adversary. Uses aggressive sinusoidal movement (\"zigzag\") and applies motion prediction, aiming ahead of the Count. Detonates on contact.",
  
  enemy_splitter_name: "Digger",
  enemy_splitter_desc: "The drama-monger. Moves in a straight line with a speed bonus. Upon deconstruction, his \"lore\" splits into two smaller \"Chat Matt\" units.",
  
  enemy_tank_name: "Szkeletal",
  enemy_tank_desc: "A relic of abandoned \"lore\". Extremely slow, but with triple \"Satiety\". Completely immanent to knockback and slowing effects (\"Cooldown\" and \"The Sewer\").",
  
  enemy_ranged_name: "The Bum",
  enemy_ranged_desc: "A ranged adversary from Olszynki. Maintains an optimal distance (medium range), avoiding close contact. Actively circles while hurling bottles.",
  
  enemy_elite_name: "Boss-Soul",
  enemy_elite_desc: "An elite Hater with significantly increased \"Satiety\". Every 7 seconds, uses a special attack: a violent charge, an emission of projectiles, or summons support (creates 3 \"Chat Matts\"). Always drops a LudoBox.",
  
  enemy_wall_name: "Siege Syndrome", // Używane też do ostrzeżenia
  enemy_wall_desc: "Appears in a perfect ring. Extremely slow, but durable. After a set time (approx. 34-40s), it detonates, destroying all nearby Potatoes and Pickups.",
  
  enemy_hazard_name: "The Sewer",
  enemy_hazard_desc: "Slows the Count and inflicts damage. Also wounds and slows haters (except for Szkeletal). Potatoes and Pickups left in \"The Sewer\" will depreciate.",
  
  enemy_megahazard_name: "Drama Field",
  enemy_megahazard_desc: "A \"Mega\" version. A significantly larger (4x-8x) area of \"The Sewer\", inflicting increased damage to the Count.",
  
  // === 11. Bronie (Perki) (GDD) ===
  perk_whip_name: "Countess's Masher",
  perk_whip_desc: "Starting weapon. Mashes horizontally (asymmetrically). Pierces all adversaries. Lvl 1: 1 hit (front). Lvl 2: 2 hits (1 front, 1 back). Lvl 3: 3 (2 front, 1 back). Lvl 4-5: 4 (2 front, 2 back). Subsequent levels increase damage, scale, and reduce cooldown.",
  
  perk_autogun_name: "Venom Spitter",
  perk_autogun_desc: "An automatic weapon that spits toxic venom at the nearest hater. It has no levels of its own – it is upgraded via 4 separate \"Spitter\" perks.",
  
  perk_orbital_name: "Orbital Potatoes",
  perk_orbital_desc: "Circling potato-artifacts. Lvl 1: 1 Potato (close radius). Lvl 2: 2 (radius +1). Lvl 3: 3 (radius +2). Lvl 4: 4 (radius +3). Lvl 5: 5 (radius +4). Subsequent levels increase damage and rotation speed.",
  
  perk_nova_name: "Mental Explosion",
  perk_nova_desc: "A cyclical emanation of \"patho-lore\". Scatters venom projectiles around the Count. Projectile stats (damage, pierce) are inherited from the Venom Spitter. Lvl 1: 10 projectiles (every 1.9s). Lvl 2: 12 (1.6s). Lvl 3: 14 (1.3s). Lvl 4: 16 (1.0s). Lvl 5: 18 (0.7s).",
  
  perk_chainLightning_name: "Ludologist's Thunder",
  perk_chainLightning_desc: "An automatic attack that strikes the nearest hater and jumps to subsequent ones (at close range). Lvl 1: 1 Dmg, 1 Target (every 2.5s). Lvl 2: 2 Dmg, 2 Targets (2.3s). Lvl 3: 2 Dmg, 3 Targets (2.1s). Lvl 4: 3 Dmg, 4 Targets (1.9s). Lvl 5: 3 Dmg, 5 Targets (1.7s). Lvl 6: 4 Dmg, 6 Targets (1.6s).",
  
  // === 12. Perki (Pasywne i AutoGun) (GDD) ===
  perk_firerate_name: "Spitter Swift Venom",
  perk_firerate_desc: "Because hate must be delivered quickly! Increases Venom Spitter's fire rate by +20% per level.",
  
  perk_damage_name: "Spitter Painful Venom",
  perk_damage_desc: "An objective increase in toxicity. Adds +1 base damage to Venom Spitter's projectiles per level.",
  
  perk_multishot_name: "Spitter Multi Venom",
  perk_multishot_desc: "Vertical diversification of hate. Fires +1 additional Venom Spitter projectile per level.",
  
  perk_pierce_name: "Spitter Piercing Venom",
  perk_pierce_desc: "Your venom is so corrosive, it pierces the narrative. Venom Spitter projectiles can pierce +1 additional hater per level.",
  
  perk_speed_name: "Swiftness of Escape",
  perk_speed_desc: "Even a Count must sometimes re-evaluate his position. Increases base movement speed by +10% per level.",
  
  perk_pickup_name: "Feeding Range",
  perk_pickup_desc: "The greater the hunger, the longer the reach for Potatoes. Increases the base attraction radius for Potatoes and Pickups by +40% per level.",
  
  perk_health_name: "Satiety Level",
  perk_health_desc: "A bigger stomach for hate (and Potatoes). Increases maximum Satiety by +20 and immediately heals the Count for 20 HP."
};