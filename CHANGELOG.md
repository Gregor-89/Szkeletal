CHANGELOG.md# Changelog (Dziennik Zmian)

Tutaj dokumentowane są wszystkie ważniejsze zmiany wprowadzane w projekcie "Szkeletal: Estrone Kiszok".

---

## [v0.57] - Silnik Grafiki i Animacji
* **Nowa Funkcja (v0.56):** Stworzono Menedżera Zasobów (`js/services/assets.js`) odpowiedzialnego za ładowanie wszystkich plików graficznych przed startem gry.
* **Zmiana (v0.56):** Zaktualizowano `main.js`, aby czekał na załadowanie zasobów przed uruchomieniem menu.
* **Zmiana (v0.56):** Zaktualizowano metody `.draw()` we wszystkich klasach bytów (`Player`, `Enemy`, `Gem`, `Pickup`, `Chest`). Teraz rysują załadowane sprite'y (jeśli istnieją) lub wracają do rysowania domyślnych kształtów (kwadratów/kółek), jeśli grafiki brakuje.
* **Nowa Funkcja (v0.57):** Zaimplementowano podstawowy silnik animacji. Klasy `Player` i `Enemy` posiadają teraz logikę do obsługi klatek animacji (przełączanie klatek w czasie).
* **Nowa Funkcja (v0.57b):** Rozbudowano silnik animacji o "stany" (`idle` i `walk`), pozwalając bytom na wybór odpowiedniej animacji (wiersza na arkuszu sprite'ów) w zależności od tego, czy się poruszają.
* **Organizacja (v0.57b):** Wyodrębniono numer wersji gry do dedykowanego pliku `js/config/version.js`.

---

## [v0.55] - Reorganizacja Projektu
* **Refaktoryzacja:** Przeniesiono wszystkie 21 plików JavaScript do nowej, ustrukturyzowanej hierarchii folderów (`/js/core`, `/js/entities`, `/js/managers`, `/js/ui`, `/js/config`, `/js/services`).
* **Zmiana:** Zaktualizowano wszystkie ścieżki `import` we wszystkich plikach, aby pasowały do nowej struktury.
* **Zmiana:** Zaktualizowano `index.html`, aby ładował `main.js` z nowej lokalizacji (`js/main.js`).

---

## [v0.54] - Refaktoryzacja Broni (OOP)
* **Refaktoryzacja:** Przekształcono stary, proceduralny system broni (`weapon.js`) w pełni obiektowy.
* **Nowa Funkcja:** Stworzono klasy broni (`AutoGun`, `OrbitalWeapon`, `NovaWeapon`), które same zarządzają swoim stanem, logiką strzelania (`update()`) i rysowania (`draw()`).
* **Refaktoryzacja:** Klasa `Player` posiada teraz tablicę `this.weapons` i zarządza instancjami swoich broni.
* **Poprawka:** Wieloetapowe debugowanie błędów `ReferenceError` i `TypeError` wprowadzonych przez refaktoryzację v0.54. Ustabilizowano pętlę gry i naprawiono kompatybilność z `dev.js`.

---

## [v0.50 - v0.53] - Refaktoryzacja Bytów (OOP)
* **Refaktoryzacja:** Rozpoczęto masową konwersję projektu na programowanie obiektowe (OOP). Wszystkie byty w grze stały się klasami z własnymi metodami `.update()` i `.draw()`.
* **Dotyczyło to:**
    * `Player` (`player.js`)
    * `Enemy` (oraz klas pochodnych jak `TankEnemy`, `RangedEnemy` w `enemy.js`)
    * `PlayerBullet` i `EnemyBullet` (`bullet.js`)
    * `Gem` (`gem.js`)
    * `Pickup` (oraz klas pochodnych jak `HealPickup` w `pickup.js`)
    * `Chest` (`chest.js`)
* **Refaktoryzacja:** Stworzono `enemyManager.js` do zarządzania logiką spawnowania, statystykami i typami wrogów.

---

## [v0.49] - Moduł Audio
* **Refaktoryzacja:** Wydzielono całą logikę proceduralnego generowania dźwięków (Web Audio API `tone()`) do osobnego modułu `audio.js`.
* **Nowa Funkcja:** Stworzono abstrakcyjną funkcję `playSound(eventName)`, aby ułatwić wywoływanie dźwięków z dowolnego miejsca w kodzie, ukrywając implementację.

---

## [v0.46 - v0.47] - Modularyzacja Logiki Gry
* **Refaktoryzacja:** Wydzielono całą logikę sprawdzania kolizji (gracz-wróg, pocisk-wróg, gracz-pickup itd.) do dedykowanego pliku `collisions.js`.
* **Refaktoryzacja:** Wydzielono główną pętlę aktualizacji stanu gry (ruch bytów, spawnowanie, timery) do pliku `gameLogic.js`.
* **Zmiana:** Wprowadzono drobne poprawki QoL (formatowanie czasu, własny modal potwierdzenia).

---

## [v0.44 - v0.45] - Pierwsza Modularyzacja
* **Refaktoryzacja:** Wydzielono logikę sterowania (klawiatura i wirtualny joystick) do `input.js`.
* **Refaktoryzacja:** Wydzielono narzędzia deweloperskie (Dev Menu) do `dev.js`.
* **Refaktoryzacja:** Wydzielono statyczną pulę definicji perków (ulepszeń) do `perks.js`.

---

## [v0.43 i wcześniejsze] - Wersja Monolityczna
* **Info:** Cała logika gry znajdowała się w jednym, dużym pliku `main.js`.