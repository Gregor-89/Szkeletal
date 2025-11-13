CHANGELOG.md# Changelog (Dziennik Zmian)

Tutaj dokumentowane są wszystkie ważniejsze zmiany wprowadzane w projekcie "Szkeletal: Estrone Kiszok".

---

# Changelog (Dziennik Zmian)

Tutaj dokumentowane są wszystkie ważniejsze zmiany wprowadzane w projekcie "Szkeletal: Estrone Kiszok".

---

## [v0.87] - Sekwencja Intro i Wskaźniki Spawnu
* **Nowa Mechanika (Intro):** Zaimplementowano sekwencję Intro (tylko obrazy, z nawigacją Wstecz/Dalej/Pomiń), która kończy się w Menu Głównym. Dodano obsługę `pinch-to-zoom` na urządzeniach mobilnych i przycisk "Zacznij nową grę".
* **Nowa Mechanika (Warning):** Wprowadzono system **Ostrzeżeń o Nowym Wrogu**. Gdy czas gry odblokowuje nowy, nieznany graczowi typ wroga, spawn jest blokowany na 3 sekundy i pojawia się subtelne ostrzeżenie na górze ekranu.
* **Nowa Mechanika (HUD):** Dodano dynamiczny **Licznik Wrogów** na pasku statystyk, pokazujący aktualną liczbę wrogów / dynamiczny limit wrogów (aktualizacja co 200ms).
* **Hotfix (Ostrzeżenie):** Naprawiono błąd, w wyniku którego Wydarzenie Oblężenia (Oblężnik) nie wyświetlało tekstowego ostrzeżenia na górze ekranu (pokazywało tylko wskaźniki na ziemi).
* **Hotfix Balansu (Spawn):** Przesunięto czas spawnu 'Tank' (150s -> 180s) i 'Ranged' (180s -> 210s), aby uniknąć konfliktu z Eventem Oblężenia (150s).
* **Hotfix Balansu (Hazardy):** Wprowadzono bufor bezpieczeństwa do obliczeń spawnu Hazardów, aby definitywnie zapobiec nakładaniu się Mega Hazardów.
* **Poprawka Balansu (Limit):** Zwiększono twardy limit wrogów (`MAX_ENEMIES`) z 300 do **400**.
* **Poprawka Balansu (Limit):** Zwiększono tempo wzrostu limitu wrogów z 15 na **20** na minutę.
* **Poprawka Balansu (HP):** Zmniejszono wzrost HP wrogów zależny od poziomu gracza z 12% na **10%** na poziom.

---

## [v0.85 - v0.86] - Zaawansowane AI Wrogów
* **Ulepszenie AI (Horda):** Wprowadzono logikę **Kohezyjnego Roju Atakującego**, która zmusza jednostki do ciasnego i agresywnego okrążania gracza, eliminując efekt pasywnego "zawisania".
* **Ulepszenie AI (Kamikaze):** Wprowadzono trajektorię **sinusoidalną z predykcją**, celującą w punkt przed graczem. Zmieniono kolor obrysu na **pomarańcz dyniowy** (`#ff7043`), aby odróżnić go od wroga Standard.
* **Ulepszenie AI (Standard):** Zwiększono siłę ruchu **"wężykiem"** z 15% na **35%**.
* **Ulepszenie AI (Aggressive):** Wydłużono czas sygnalizacji szarży z 0.2s do **0.4s**.
* **Ulepszenie AI (Splitter):** Dodano stały **bonus prędkości** (+15%) i usunięto ruch "wężykiem", aby był prostszy do trafienia przed podziałem.
* **Ulepszenie AI (Dystansowy/Ranged):** Zmieniono ruch boczny (Strafe) na **Aktywny Kąt Ataku (Circle Strafe)**, zmuszając wroga do aktywnego krążenia w optymalnym dystansie.

---

## [v0.84] - Finalne Poprawki AI i QoL
* **Poprawka QoL:** Logika spawnu Pól Zagrożenia (`Hazard`) teraz rezerwuje odpowiednio dużą przestrzeń dla potencjalnego Mega Hazardu, zapobiegając nakładaniu się dużych plam.
* **Ulepszenie AI (Kamikaze):** Wprowadzono **agresywny ruch zygzakowaty ('Z')** o dużej amplitudzie i częstotliwości, co sprawia, że Kamikaze jest trudniejszy do uniknięcia na całej ścieżce podejścia. Usunięto nieużywany mnożnik prędkości bazowej.
* **Ulepszenie AI (Horda):** Zwiększono **promień otaczania (Swarming)** z 100px do 150px, co zmusza wrogów Horde do wyraźniejszego okrążania gracza.
* **Ulepszenie AI (Dystansowy/Ranged):** Zwiększono **dystans optymalny** (z 250-300px do 300-400px) oraz **wzmocniono siłę ruchu bocznego (Strafe)** (z 0.5x do 0.75x bazowej prędkości), czyniąc walkę z tym wrogiem bardziej dynamiczną i taktyczną.

---

## [v0.83] - AI wrogów i rebalans pacingu
* **Rebalans:** Oblężnicy (`Wall Enemy`) nie wliczają się już do dynamicznego limitu wrogów, co eliminuje blokowanie spawnu standardowych przeciwników podczas Eventu Oblężenia.
* **Rebalans:** Interwał spawnu Elity wydłużono z 24s do 144s.
* **Ulepszenie AI (Aggressive):** Dodano krótki okres **sygnalizacji** (pauza i czerwony kontur) przed rozpoczęciem szarży.
* **Ulepszenie AI (Tank):** Dodano pełną odporność na **HitStun** oraz **spowolnienie** (Freeze i Hazard).
* **Ulepszenie AI (Splitter):** Dzieci spawnowane są teraz z efektem **odrzutu (knockback)** i krótką nietykalnością.
* **Ulepszenie AI (Standard):** Dodano subtelny ruch **'wężykiem'** (directional evasion).

---

## [v0.82] - Piorun Łańcuchowy (Chain Lightning)
* **Nowa Broń (v0.82a):** Dodano Chain Lightning (Piorun Łańcuchowy) – ulepszenie, które razi cele i przeskakuje na pobliskich wrogów.
* **Poprawka (v0.82b):** Naprawiono błąd, który powodował, że Chain Lightning zadawał obrażenia, ale nie usuwał zabitych wrogów z tablicy.
* **Balans (v0.82b):** Zwiększono maksymalny poziom Pioruna do 6.

---

## [v0.81] - Bicz i Optymalizacja Broni
* **Zmiana Startowa (v0.81b):** Domyślną i startową bronią gracza jest teraz **Bicz** (`WhipWeapon`).
* **Poprawka (v0.81c):** Dodano poprawne filtrowanie Perk Deck dla ulepszeń AutoGuna (dostępne tylko, jeśli AutoGun jest aktywny).
* **Poprawka (v0.81g):** Wprowadzono separację rozmiaru rysowania (`drawScale`) od rozmiaru kolizji (`hitboxSize`) dla Bicza (Whip).
* **Rebalans (v0.81e):** Zmieniono bazową szybkostrzelność AutoGuna (z 500ms na 650ms) i zwiększono max. poziom ulepszenia szybkostrzelności.

---

## [v0.80] - Ulepszenia Bicza (Whip)
* **Wizualizacje (v0.80a):** Bicz rysuje teraz sprite (efekt cięcia) i jest odwracany w zależności od kierunku ataku.
* **Poprawka (v0.80b):** Hitbox Bicza jest teraz **przyklejony** (offsetowany) do pozycji gracza na czas życia hitboksa, co stabilizuje mechanikę kolizji.

---

## [v0.79] - Czas Życia Pocisków i Odrzut
* **Nowa Mechanika:** Wprowadzono logikę `life` i `maxLife` do `Bullet`, co pozwala na pociski o ograniczonym czasie życia (jak Bicz).

---

## [v0.77] - Balans Oblężnika i Pacing
* **Poprawka Oblężenia (v0.77c):** Uproszczono logikę Eventu Oblężenia, wprowadzając absolutny czas respawnu (150s + losowy interwał).
* **Rebalans:** Zwiększono dystans spawnu `Hazard` i `Ranged Enemy`.
* **Poprawka UI (v0.77f):** Naprawiono migotanie paska HP przy niskim zdrowiu.

---

## [v0.76] - Milestone Balance
* **Rebalans:** Zwiększono rozmiar świata (x8), limit wrogów (z 110 do 300) oraz czas życia Gemów i Pickupów (Gemy do 35s).
* **Nowa Mechanika:** Gemy XP mają teraz **ograniczony czas życia** (35s).

---

## [v0.75] - Wydarzenie Oblężenia (Wall Enemy)
* **Nowy Wróg:** Dodano `WallEnemy` (Oblężnik) – wolny, bardzo wytrzymały, detonujący się wróg, pojawiający się w ramach nowego Eventu.
* **Nowa Mechanika:** Dodano `Siege Event` – wrogowie `Wall` pojawiają się w idealnym kręgu wokół gracza.
* **Nowa Mechanika:** Detonacja Oblężnika aktywuje `AreaNuke`, które niszczy gemy i inne dropy w zasięgu.

---

## [v0.72 - v0.74] - Refaktoryzacja Logiki Pickupów i Broni
* **Refaktoryzacja:** Logika `applyEffect()` została przeniesiona z `collisions.js` do podklas `Pickup` (`HealPickup.js`, `BombPickup.js` itd.).
* **Refaktoryzacja:** Poprawiono użycie `PERK_CONFIG` w klasach broni (`NovaWeapon.js`, `OrbitalWeapon.js`).

---

## [v0.68] - Hazard (Pola Zagrożenia)
* **Nowy Wróg/Środowisko:** Dodano `Hazard` (np. Kwaśna Plama) – statyczne pole zadające obrażenia i spowalniające gracza/wrogów.
* **Nowa Mechanika:** Wprowadzono `Mega Hazard` (losowy, duży wariant).
* **Nowa Mechanika:** `Efekt Bagna` - dropy (XP, Pickupy, Skrzynie) w Hazardzie zaczynają **zanikać** (Decay).

---

## [v0.61 - v0.67] - Object Pooling i Korekty
* **Optymalizacja:** Wprowadzono wzorzec **Object Pool** dla pocisków, cząsteczek i tekstu obrażeń, co znacznie poprawiło wydajność gry.

---

## [v0.57] - Silnik Grafiki i Animacji
* **Nowa Funkcja:** Stworzono Menedżera Zasobów.
* **Nowa Funkcja:** Zaimplementowano podstawowy silnik animacji.

---

## [v0.55] - Reorganizacja Projektu
* **Refaktoryzacja:** Przeniesiono wszystkie 21 plików JavaScript do nowej, ustrukturyzowanej hierarchii folderów.

---

## [v0.54] - Refaktoryzacja Broni (OOP)
* **Refaktoryzacja:** Przekształcono stary, proceduralny system broni w pełni obiektowy.

---

## [v0.50 - v0.53] - Refaktoryzacja Bytów (OOP)
* **Refaktoryzacja:** Konwersja wszystkich bytów (Player, Enemy, Bullet, Gem) na klasy.

---

## [v0.49] - Moduł Audio
* **Refaktoryzacja:** Wydzielono całą logikę generowania dźwięków do `audio.js`.

---

## [v0.46 - v0.47] - Modularyzacja Logiki Gry
* **Refaktoryzacja:** Wydzielono logikę kolizji (`collisions.js`) i logikę gry (`gameLogic.js`).

---

## [v0.44 - v0.45] - Pierwsza Modularyzacja
* **Refaktoryzacja:** Wydzielono sterowanie, narzędzia deweloperskie i definicje perków.

---

## [v0.43 i wcześniejsze] - Wersja Monolityczna
* **Info:** Cała logika gry znajdowała się w jednym, dużym pliku `main.js`.