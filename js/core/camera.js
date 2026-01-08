// ==============
// CAMERA.JS (v1.0 - Modular Refactor)
// Lokalizacja: /js/core/camera.js
// ==============

/**
 * Camera: Zarządza rzutowaniem świata gry i śledzeniem gracza.
 */
export class Camera {
  constructor(worldWidth, worldHeight, viewWidth, viewHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  /**
   * Aktualizuje wymiary widoku po zmianie rozmiaru okna.
   */
  updateViewDimensions(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }
}