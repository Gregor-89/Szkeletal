// ==============
// PERKS.JS (v1.02e - Dynamic Value Providers)
// Lokalizacja: /js/config/perks.js
// ==============

export const perkPool = [
  {
    id: 'autogun',
    type: 'weapon',
    name: 'perk_autogun_name',
    desc: 'perk_autogun_desc',
    icon: 'icon_autogun',
    emoji: '🔫',
    color: '#FFF',
    max: 1, 
    apply: (state, perk) => {
       import('../config/weapons/autoGun.js').then(module => {
           const AutoGun = module.AutoGun;
           let w = state.player.getWeapon(AutoGun);
           if (!w) {
               w = new AutoGun(state.player);
               state.player.weapons.push(w);
           }
       });
    }
  },
  {
    id: 'firerate',
    type: 'stat',
    name: 'perk_firerate_name',
    desc: 'perk_firerate_desc',
    icon: 'icon_firerate',
    emoji: '⏩',
    color: '#FFFF00',
    value: 0.80, // -20% cooldownu
    max: 6,
    requiresWeapon: 'AutoGun',
    formatVal: () => 20, 
    apply: (state, perk) => {
       const w = state.player.weapons.find(x => x.constructor.name === 'AutoGun');
       if (w) {
           if(w.fireRate) w.fireRate *= perk.value;
           if(w.cooldown) w.cooldown *= perk.value;
       }
    }
  },
  {
    id: 'damage',
    type: 'stat',
    name: 'perk_damage_name',
    desc: 'perk_damage_desc',
    icon: 'icon_damage',
    emoji: '💥',
    color: '#FF0000',
    max: 6,
    requiresWeapon: 'AutoGun',
    /**
     * (v1.02e) Progresywne skalowanie: +2, +3, +4, +5, +6, +7.
     */
    formatVal: (currentLvl) => currentLvl + 2,
    apply: (state, perk) => {
       const w = state.player.weapons.find(x => x.constructor.name === 'AutoGun');
       if (w) {
           const currentLvl = state.perkLevels[perk.id] || 0;
           const bonus = currentLvl + 2; 
           if(w.bulletDamage !== undefined) w.bulletDamage += bonus;
           if(w.damage !== undefined) w.damage += bonus;
           console.log(`[PERK-DMG] AutoGun: Dodano +${bonus} dmg.`);
       }
    }
  },
  {
    id: 'multishot',
    type: 'stat',
    name: 'perk_multishot_name',
    desc: 'perk_multishot_desc',
    icon: 'icon_multishot',
    emoji: '🎯',
    color: '#00FFFF',
    value: 1,
    max: 4,
    requiresWeapon: 'AutoGun',
    formatVal: () => 1,
    apply: (state, perk) => {
       const w = state.player.weapons.find(x => x.constructor.name === 'AutoGun');
       if(w) w.multishot += perk.value;
    }
  },
  {
    id: 'pierce',
    type: 'stat',
    name: 'perk_pierce_name',
    desc: 'perk_pierce_desc',
    icon: 'icon_pierce',
    emoji: '➡️',
    color: '#FF00FF',
    value: 1,
    max: 4,
    requiresWeapon: 'AutoGun',
    formatVal: () => 1,
    apply: (state, perk) => {
       const w = state.player.weapons.find(x => x.constructor.name === 'AutoGun');
       if(w) w.pierce += perk.value;
    }
  },
  {
    id: 'orbital',
    type: 'weapon',
    name: 'perk_orbital_name', 
    desc: 'perk_orbital_desc',
    icon: 'icon_orbital',
    emoji: '🌀',
    color: '#CDDC39',
    max: 5,
    apply: (state, perk) => {
       import('../config/weapons/orbitalWeapon.js').then(module => {
           const OrbitalWeapon = module.OrbitalWeapon;
           let w = state.player.getWeapon(OrbitalWeapon);
           if(!w) {
               w = new OrbitalWeapon(state.player);
               state.player.weapons.push(w);
           } else {
               w.upgrade(perk);
           }
       });
    }
  },
  {
    id: 'nova',
    type: 'weapon',
    name: 'perk_nova_name', 
    desc: 'perk_nova_desc',
    icon: 'icon_nova',
    emoji: '💫',
    color: '#FF5722',
    max: 6,
    apply: (state, perk) => {
       import('../config/weapons/novaWeapon.js').then(module => {
           const NovaWeapon = module.NovaWeapon;
           let w = state.player.getWeapon(NovaWeapon);
           if(!w) {
               w = new NovaWeapon(state.player);
               state.player.weapons.push(w);
           } else {
               w.upgrade(perk);
           }
       });
    }
  },
  {
    id: 'whip',
    type: 'weapon',
    name: 'perk_whip_name', 
    desc: 'perk_whip_desc',
    icon: 'icon_whip',
    emoji: '🪢',
    color: '#795548',
    max: 5,
    apply: (state, perk) => {
       import('../config/weapons/whipWeapon.js').then(module => {
           const WhipWeapon = module.WhipWeapon;
           let w = state.player.getWeapon(WhipWeapon);
           if(!w) {
               w = new WhipWeapon(state.player);
               state.player.weapons.push(w);
           } else {
               w.upgrade(perk);
           }
       });
    }
  },
  {
    id: 'chainLightning',
    type: 'weapon',
    name: 'perk_chainLightning_name', 
    desc: 'perk_chainLightning_desc',
    icon: 'icon_lightning',
    emoji: '⚡',
    color: '#448AFF',
    max: 6,
    apply: (state, perk) => {
       import('../config/weapons/chainLightningWeapon.js').then(module => {
           const ChainLightningWeapon = module.ChainLightningWeapon;
           let w = state.player.getWeapon(ChainLightningWeapon);
           if(!w) {
               w = new ChainLightningWeapon(state.player);
               state.player.weapons.push(w);
           } else {
               w.upgrade(perk);
           }
       });
    }
  },
  {
    id: 'speed',
    type: 'stat',
    name: 'perk_speed_name', 
    desc: 'perk_speed_desc',
    icon: 'icon_speed',
    emoji: '👟',
    color: '#00E676',
    value: 1.10,
    max: 4,
    formatVal: () => 10,
    apply: (state, perk) => {
       state.player.speedMultiplier *= perk.value;
    }
  },
  {
    id: 'pickup',
    type: 'stat',
    name: 'perk_pickup_name', 
    desc: 'perk_pickup_desc',
    icon: 'icon_pickup_range', 
    emoji: '🧲',
    color: '#9C27B0',
    value: 1.40,
    max: 3,
    formatVal: () => 40,
    apply: (state, perk) => {
       state.game.pickupRange *= perk.value;
    }
  },
  {
    id: 'health',
    type: 'stat',
    name: 'perk_health_name', 
    desc: 'perk_health_desc',
    icon: 'icon_health',
    emoji: '❤️',
    color: '#E91E63',
    value: 20, 
    max: 3,
    formatVal: () => 30,
    apply: (state, perk) => {
       state.game.maxHealth += perk.value;
       state.game.health = Math.min(state.game.maxHealth, state.game.health + perk.value);
    }
  }
];