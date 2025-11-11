// ==============
// BULLET.JS (v0.79k - FIX: Błąd składni w logu)
// Lokalizacja: /js/entities/bullet.js
// ==============

/**
 * Klasa bazowa dla wszystkich pocisków.
 * Zmieniona, aby wspierać Object Pooling.
 */
class Bullet {
  constructor() {
    // Właściwości zostaną ustawione przez .init()
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.damage = 0;
    this.color = '#fff';
    
    // POPRAWKA v0.61: Właściwości Puli Obiektów
    this.active = false; // Czy obiekt jest aktualnie używany?
    this.pool = null; // Referencja do puli, do której należy
    
    // NOWE v0.79: Czas życia pocisku (dla Bicza)
    this.life = Infinity;
    this.maxLife = Infinity;
  }
  
  /**
   * POPRAWKA v0.61: Inicjalizuje pocisk danymi.
   * Ta metoda zastępuje stary konstruktor.
   * POPRAWKA v0.79: Dodano 'life'
   */
  init(x, y, vx, vy, size, damage, color, life = Infinity) {
    this.x = x;
    this.y = y;
    this.vx = vx; // Oczekuje teraz prędkości w px/sekundę
    this.vy = vy; // Oczekuje teraz prędkości w px/sekundę
    this.size = size;
    this.damage = damage;
    this.color = color;
    this.active = true;
    
    // NOWE v0.79
    this.life = life;
    this.maxLife = life;
  }
  
  /**
   * POPRAWKA v0.61: Zwalnia obiekt z powrotem do puli.
   */
  release() {
    if (this.pool) {
      this.pool.release(this);
    }
    this.active = false; // Na wszelki wypadek
    this.life = Infinity; // Reset czasu życia
  }
  
  /**
   * Aktualizuje pozycję pocisku.
   * POPRAWKA v0.64: Zastosowano fizykę opartą na dt.
   * POPRAWKA v0.79: Dodano logikę czasu życia.
   */
  update(dt) {
    // Ta metoda jest teraz wywoływana tylko dla aktywnych pocisków
    this.x += this.vx * dt; // Zastosuj dt
    this.y += this.vy * dt; // Zastosuj dt
    
    // NOWE v0.79: Logika czasu życia
    if (this.life !== Infinity) {
      this.life -= dt;
      if (this.life <= 0) {
        this.release();
      }
    }
  }
  
  /**
   * Rysuje pocisk na canvasie.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // Ta metoda jest teraz wywoływana tylko dla aktywnych pocisków
    
    // NOWE v0.79: Efekt zanikania dla pocisków z czasem życia (np. Bicz)
    if (this.maxLife !== Infinity && this.life < 0.25) {
      ctx.globalAlpha = Math.max(0, this.life / 0.25);
    }
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset alpha, jeśli była zmieniona
    if (this.maxLife !== Infinity) {
      ctx.globalAlpha = 1;
    }
  }
  
  /**
   * Sprawdza, czy pocisk jest poza ekranem.
   * POPRAWKA v0.66: Zmieniono argument na 'camera' i użyto granic świata/widoku.
   * @param {object} camera 
   * @returns {boolean}
   */
  isOffScreen(camera) {
    // Używamy granic widoku Kamery, a nie Canvasa.
    const margin = 50;
    const viewLeft = camera.offsetX;
    const viewRight = camera.offsetX + camera.viewWidth;
    const viewTop = camera.offsetY;
    const viewBottom = camera.offsetY + camera.viewHeight;
    
    return (
      this.x < viewLeft - margin ||
      this.x > viewRight + margin ||
      this.y < viewTop - margin ||
      this.y > viewBottom + margin
    );
  }
}

/**
 * Klasa dla pocisków gracza.
 */
export class PlayerBullet extends Bullet {
  constructor() {
    super(); // Konstruktor jest pusty
    this.pierce = 0;
    // NOWE v0.79: Licznik rykoszetów
    this.bouncesLeft = 0;
    // Zapobiega wielokrotnemu trafieniu tego samego wroga przez ten sam rykoszet
    this.lastEnemyHitId = -1;
    // NOWE v0.79d: Kierunek wygięcia dla Bicza
    this.curveDir = 0;
    
    // NOWE v0.79h: Parametry animacji
    this.animParams = null;
    this.animTimer = 0;
    this.currentFrame = 0;
  }
  
  /**
   * POPRAWKA v0.61: Dedykowana metoda init
   * POPRAWKA v0.79h: Dodano 'animParams' jako ostatni argument
   */
  init(x, y, vx, vy, size, damage, color, pierce, life = Infinity, bouncesLeft = 0, curveDir = 0, animParams = null) {
    // Wywołaj metodę init() klasy bazowej (przekazując 'life')
    super.init(x, y, vx, vy, size, damage, color, life);
    // Ustaw specyficzne właściwości
    this.pierce = pierce;
    this.bouncesLeft = bouncesLeft;
    this.lastEnemyHitId = -1;
    this.curveDir = curveDir;
    
    // NOWE v0.79h: Ustaw parametry animacji
    this.animParams = animParams;
    this.animTimer = 0;
    this.currentFrame = 0;
  }
  
  /**
   * Aktualizuje pocisk gracza (nadpisanie dla animacji Bicza).
   */
  update(dt) {
    super.update(dt); // Wywołaj logikę bazową (ruch, czas życia)
    
    // NOWE v0.79h: Logika animacji
    if (this.animParams) {
      this.animTimer += dt * 1000; // Czas w ms
      if (this.animTimer >= this.animParams.animSpeed) {
        this.animTimer = 0;
        this.currentFrame = (this.currentFrame + 1); // Przejdź do następnej klatki
        
        // Jeśli animacja się skończyła, a pocisk jeszcze żyje, zatrzymaj na ostatniej klatce
        if (this.currentFrame >= this.animParams.frameCount) {
          this.currentFrame = this.animParams.frameCount - 1;
        }
      }
    }
  }
  
  /**
   * Rysuje pocisk gracza (nadpisanie dla Bicza).
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // POPRAWKA v0.79h: Logika rysowania animacji sprite Bicza
    // Jeśli pocisk ma parametry animacji ORAZ stoi w miejscu, traktuj go jak Bicz
    if (this.animParams && this.vx === 0 && this.vy === 0) {
      
      const ap = this.animParams;
      const sprite = ap.spriteSheet;
      if (!sprite) {
        // Fallback, gdyby sprite się nie załadował
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 5, this.y - this.size / 2, 10, this.size);
        return;
      }
      
      // Użyj pulsu zanikania z bazowej klasy
      if (this.maxLife !== Infinity && this.life < 0.25) {
        ctx.globalAlpha = Math.max(0, this.life / 0.25);
      } else {
        ctx.globalAlpha = 1;
      }
      
      // Używamy 'this.size' jako *mnożnika* rozmiaru (np. 60 z configu)
      // Bazowy rozmiar klatki to 125x150
      const drawWidth = ap.frameWidth * (this.size / 100); // Skalowanie przez 'size'
      const drawHeight = ap.frameHeight * (this.size / 100);
      
      // Źródło (Sprite Sheet)
      const sx = this.currentFrame * ap.frameWidth;
      const sy = ap.animRow * ap.frameHeight;
      
      // Cel (Canvas)
      const dx = this.x - drawWidth / 2;
      const dy = this.y - drawHeight / 2;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // POPRAWKA v0.79j: Odwróć logikę. Odwracaj dla 'side = 1' (prawa strona)
      if (this.curveDir === 1) {
        ctx.scale(-1, 1); // Odwróć horyzontalnie dla ataku po prawej stronie
      }
      
      // POPRAWKA v0.79i: Ustawienie mieszania addytywnego (usuwa czarne tło)
      ctx.globalCompositeOperation = 'lighter';
      
      // Rysuj (przesunięte o środek, bo już zrobiliśmy translate)
      ctx.drawImage(
        sprite,
        sx, sy, ap.frameWidth, ap.frameHeight,
        -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
      );
      
      ctx.restore();
      // POPRAWKA v0.79i: Zresetuj tryb mieszania
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      
    } else {
      // Rysuj standardowe kółko (dla AutoGun, Nova, itp.)
      ctx.globalAlpha = 1; // Upewnij się, że alfa jest 1
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Klasa dla pocisków wroga.
 */
export class EnemyBullet extends Bullet {
  constructor() {
    super(); // Konstruktor jest pusty
  }
  
  /**
   * POPRAWKA v0.61: Dedykowana metoda init
   */
  init(x, y, vx, vy, size, damage, color) {
    // Wywołaj metodę init() klasy bazowej
    super.init(x, y, vx, vy, size, damage, color);
  }
}

// LOG DIAGNOSTYCZNY (POPRAWIONY)
console.log("[DEBUG-v0.79j] js/entities/bullet.js: Odwrócono logikę 'ctx.scale' dla sprite'u Bicza.");