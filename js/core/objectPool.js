// ==============
// OBJECTPOOL.JS (v0.61 - Dodano releaseAll)
// Lokalizacja: /js/core/objectPool.js
// ==============

/**
 * Generyczna klasa Puli Obiektów (Object Pool).
 */
export class ObjectPool {
  /**
   * @param {class} ClassBlueprint - Klasa obiektu do stworzenia (np. PlayerBullet)
   * @param {number} initialSize - Liczba obiektów do stworzenia na starcie
   */
  constructor(ClassBlueprint, initialSize) {
    this.ClassBlueprint = ClassBlueprint;
    this.initialSize = initialSize;
    
    this.activeItems = [];
    this.inactiveItems = [];
    
    for (let i = 0; i < initialSize; i++) {
      const obj = new ClassBlueprint();
      obj.pool = this; // Daj obiektowi referencję do jego puli
      this.inactiveItems.push(obj);
    }
    
    console.log(`[ObjectPool] Stworzono pulę dla ${ClassBlueprint.name} (Rozmiar: ${initialSize})`);
  }
  
  /**
   * Pobiera obiekt z puli nieaktywnych i aktywuje go.
   */
  get(...args) {
    if (this.inactiveItems.length === 0) {
      console.warn(`[ObjectPool] Pula dla ${this.ClassBlueprint.name} jest pusta! Zwiększ initialSize.`);
      const obj = new this.ClassBlueprint();
      obj.pool = this;
      this.activeItems.push(obj);
      obj.init(...args);
      return obj;
    }
    
    const obj = this.inactiveItems.pop();
    
    this.activeItems.push(obj);
    
    obj.init(...args);
    
    return obj;
  }
  
  /**
   * Zwraca obiekt do puli nieaktywnych.
   */
  release(obj) {
    obj.active = false;
    
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      if (this.activeItems[i] === obj) {
        // Szybkie usunięcie (przenosi ostatni element na miejsce usuniętego)
        this.activeItems[i] = this.activeItems[this.activeItems.length - 1];
        this.activeItems.pop();
        
        this.inactiveItems.push(obj);
        return;
      }
    }
  }
  
  /**
   * POPRAWKA v0.61: Nowa metoda do zwalniania wszystkich aktywnych obiektów.
   * Potrzebna do resetowania gry i wczytywania zapisu.
   */
  releaseAll() {
    // Iterujemy wstecz, ponieważ metoda release() modyfikuje tablicę activeItems
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const obj = this.activeItems[i];
      obj.active = false; // Oznacz jako nieaktywny
      this.inactiveItems.push(obj); // Dodaj do nieaktywnych
    }
    // Wyczyść tablicę aktywnych
    this.activeItems.length = 0;
  }
}