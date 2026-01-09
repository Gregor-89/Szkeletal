# CHANGELOG

## [v0.116] - 2026-01-09 (UI & CSS Polish)
### 🐛 Bug Fixes & Improvements
- **UI Stability**: Fixed "jumping" language flags in main menu by removing conflicting JS animations and excluding them from CSS fade-in effects.
- **"Postaw Kawę" Button**: 
  - Restored missing logic: button now correctly unlocks 'Hot Dracula' skin.
  - Added visual feedback: button turns green (Success state) upon unlock.
  - Fixed button overflow issues (cut-off glow) by adjusting margins and containers.
  - Implemented one-time sound effect and text update upon unlock.
- **Skin Manager**: Fixed ID mismatch (`skin_dracula_hot` vs `hot`) that prevented skin unlocking.
- **CSS**: Removed horizontal scrollbar in Coffee menu and improved general element positioning.

## [v0.115] - 2025-01-08 (Beta Fixes)
### 🐛 Bug Fixes
- **Critical**: Fixed `Uncaught SyntaxError` in `obstacle.js` that caused game crash on load.
- **Spawning**: Adjusted initial enemy spawn timer. First enemy now appears within ~3s (previously took too long), but correctly spawns off-screen.
- **Visuals**: 
  - Fixed projectile flash effect (Orbital/Nova) to be consistent with enemy hit flashes (white flash using CSS filters).
  - Fixed object culling issue where tall obstacles (Trees/Huts) were vanishing too early at the bottom of the screen.
- **UI**: Aligned "Submit Score" and "Clear Scores" buttons horizontally on Game Over screen.

### ⚙️ Balance
- **Early Game**: Reduced `SPAWN_GRACE_PERIOD` to 0.5s to speed up first encounter.

## [v0.114] - 2025-01-07 (Beta Release Candidate)
### ⭐ Features
- **Map Generation**:
    - **Nowa, gęstsza mapa**: Drastycznie zwiększono liczbę obiektów (Drzewa: 1200, Skały: 600, Chaty: 150).
    - **Optymalizacja**: Wprowadzono precyzyjny Culling (usuwanie obiektów poza kamerą), co pozwala na 60 FPS nawet przy 2000+ obiektach.
    - **Warstwy**: Poprawne sortowanie Y (obiekty wyżej są "za" obiektami niżej).
    - **Unikalność**: Każdy obiekt ma losowy wariant (jedna z 6 grafik) i skalę.
...