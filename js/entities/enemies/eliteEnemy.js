// ==============
// ELITEENEMY.JS (v0.71 - Refaktoryzacja Wrogów)
// Lokalizacja: /js/entities/enemies/eliteEnemy.js
// ==============

import { Enemy } from '../enemy.js';

/**
 * Wróg Elita (Mini-boss).
 * Posiada pasek HP.
 */
export class EliteEnemy extends Enemy {
    getOutlineColor() { 
        return '#e91e63'; 
    }

    drawHealthBar(ctx) {
        const w = 26, h = 4;
        const frac = Math.max(0, this.hp / this.maxHp);
        const bx = this.x - w / 2;
        const by = this.y - this.size / 2 - 8;
        
        ctx.fillStyle = '#300';
        ctx.fillRect(bx, by, w, h);
        let hpColor;
        if (frac > 0.6) hpColor = '#0f0';
        else if (frac > 0.3) hpColor = '#ff0';
        else hpColor = '#f00';
        ctx.fillStyle = hpColor;
        ctx.fillRect(bx, by, w * frac, h);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(bx, by, w, h);
    }
}