# Changelog (Dziennik Zmian)

Tutaj dokumentowane są wszystkie ważniejsze zmiany wprowadzane w projekcie "Szkeletal: Estrone Kiszok".



---

## [v0.98] - 2025-12-06
**"Szkeletal Reforged: Hunger & Axes Update"**

### ✨ Nowości (Features)
- **Nowy Boss: Drwal Zjebadło (Lumberjack)**:
  - Potężny przeciwnik rzucający wirującymi, tęczowymi siekierami.
  - Unikalna mechanika "Tęczowego Śladu" (Spiral Trail) i rozbryzgu cząsteczek przy trafieniu.
  - Posiada dedykowane animacje chodzenia i ataku.
  - Działa w systemie "Singleton" – na mapie może być tylko jeden boss tego typu naraz.
- **Mechanika Głodu (Hunger System)**:
  - Dodano wskaźnik "Ziemniaczanego Głodu" w HUD.
  - Pasek sytości opróżnia się w ciągu 15 sekund.
  - **Efekt Głodu**: Gdy pasek spadnie do zera, gracz otrzymuje obrażenia co sekundę, ekran pulsuje na czerwono (winieta), a Drakul rzuca losowymi cytatami o głodzie.
  - **Odnawianie**: Zebranie dowolnego Ziemniaczka (XP) odnawia głód do 100%.
- **Szkeletal Reforged (Wielki Rebalans)**:
  - **Wolniejsza Rozgrywka**: Zmniejszono bazową prędkość gracza (z 432 na 240) i wrogów dla lepszej kontroli taktycznej.
  - **Skalowanie x10**: Przemnożono HP wrogów i obrażenia broni, aby umożliwić precyzyjniejszy balans.
  - **Buff Startowy**: Broń "Bicz" (Tłuczek) jest teraz znacznie silniejsza na starcie.
  - **Progresja XP**: Spłaszczono krzywą levelowania (Factor 1.2), co zapewnia częstsze nagrody.
  - **Nerf Novy**: Eksplozja Mentalu ma teraz mniej pocisków na 1. poziomie, skaluje się mocniej w late-game.

### 🎨 Wizualia i UI (Visuals & UI)
- **Dynamiczne Animacje**: Prędkość przebierania nogami (animacji) gracza i wrogów zależy teraz od ich faktycznej prędkości poruszania się (np. zwalnia w bagnie/wodzie).
- **Lepszy HUD**:
  - Wycentrowano paski zdrowia i XP.
  - Dodano animowaną, pulsującą ikonę Ziemniaka (Głód) z efektem "opróżniania" (clip-path).
  - Pasek zdrowia miga na czerwono przy niskim HP lub głodzie.
- **Siekiera Drwala**: Zwiększono rozmiar sprite'a, dodano konfigurowalny ślad tęczy i dostrojono rotację kierunkową.
- **Cienie**: Poprawiono pozycjonowanie cieni pod postaciami (możliwość regulacji `shadowOffset`).

### 🐛 Poprawki (Fixes)
- **Znikające Pickupy**: Naprawiono błąd, przez który bonusy znikały ułamek sekundy po pojawieniu się (dodano bezpieczny fallback czasu życia).
- **Dev Tools**: Naprawiono przyciski scenariuszy (Auto-Start), dodano opcję testowania Drwala i zabezpieczono przed błędami brakujących elementów DOM.
- **Rotacja Pocisków**: Butelki i Siekiery obracają się teraz zgodnie z kierunkiem lotu (w lewo/w prawo).


### 🔧 Poprawki i Ulepszenia (Fixes & Improvements)
- **Mechanika Tekstów ("HitText")**:
  - Teksty obrażeń, leczenia oraz cytaty ("Flavor Text") są teraz dynamicznie "przyklejone" do celu (np. gracza) i podążają za nim, zamiast wisieć w miejscu spawnu.
  - Wprowadzono system "pięter" (offsetów) dla tekstów gracza:
    - **Cytaty**: Wyświetlane wysoko nad głową (-85px).
    - **Pasek Życia**: Standardowo (-60px).
    - **Ostrzeżenie o Głodzie**: Wyświetlane poniżej paska życia (-35px).
  - Zapobiega to nakładaniu się tekstów na siebie i poprawia czytelność.
- **Bicz (Whip)**:
  - Zmieniono logikę ataku na **asynchroniczną**: przy odpowiednim poziomie (Lvl 2+), bicz uderza najpierw w przód, a dopiero po chwili (200ms) w tył.
  - Dodano odtwarzanie dźwięku uderzenia również dla ataku tylnego.
  - Naprawiono błąd powodujący niewyświetlanie się sprite'a bicza (zła nazwa assetu).
- **Piorun (Chain Lightning)**:
  - Zwiększono zasięg rażenia z 200 do **320**, co znacznie poprawia użyteczność broni.
  - Naprawiono potencjalny crash gry związany z brakiem importów funkcji `killEnemy`.
- **Balans Rozgrywki (XP)**:
  - Zmieniono krzywą zdobywania doświadczenia:
    - **Początek**: Pierwszy poziom wymaga teraz tylko 5 XP (powrót do szybkiego startu).
    - **Mid-game**: Zwiększono przyrost wymaganego XP (`Factor 1.35`, `Add 6`), co sprawia, że późniejsze poziomy zdobywa się wolniej.
- **Balans Broni**:
  - **AutoGun**: Osłabiono na 1. poziomie (Obrażenia 7->5, Szybkostrzelność 650ms->900ms).
  - **Zasięg Żerowania**: Zmniejszono mnożnik perka z 1.40 na 1.25.
- **Optymalizacja**:
  - Wdrożono **Batch Rendering** dla systemu cząsteczek, co znacząco redukuje liczbę wywołań rysowania (`draw calls`) i poprawia wydajność przy dużej liczbie efektów.

---

## [v0.98a] - 2025-12-06
**"Pickup Teleport Fix"**

### 🐛 Bugfixy
- **Naprawiono znikanie pickupów**: Skorygowano błąd w `utils.js`, gdzie funkcja separacji (`applyPickupSeparation`) używała starego, małego rozmiaru świata, powodując natychmiastową "teleportację" przedmiotów poza ekran na większych mapach.

---

## [v0.97] - 2025-12-03
**"The World & Faith Update"**

### ✨ Nowości (Features)
- **Proceduralna Mapa**: Świat gry nie jest już pusty! Dodano system generowania otoczenia.
  - **Drzewa & Skały**: Losowo rozmieszczane przeszkody blokujące ruch.
  - **Woda**: Spowalnia gracza i wrogów, nadając im niebieski odcień. Oblężnicy (Wall) są na nią odporni.
  - **Chatki (Huts)**: Duże, zniszczalne budynki. Po zniszczeniu zamieniają się w gruzowisko i wyrzucają Gemy (XP) oraz szansę na Pickup.
  - **Kapliczki (Shrines)**: 8 kapliczek na mapie. Leczą gracza (jeśli jest ranny) i odnawiają się co 2 minuty. Emanują pulsującą, boską poświatą.
- **Lokalizacja (i18n)**:
  - Dodano pełne wsparcie dla języka **Rumuńskiego (Română)**.
  - Pełne tłumaczenie interfejsu (Menu, Config, Dev Tools) w locie.
- **Dev Tools**:
  - Dodano tryb **"Spacer" (Peaceful)** – gra bez wrogów do testowania mapy.
  - Poprawiono automatyczne uruchamianie scenariuszy.

### 🎨 Wizualia (Visuals)
- **System Cieni**: Cienie obiektów są teraz rysowane na osobnej warstwie (pod postaciami), co eliminuje błędy graficzne.
- **Przezroczystość (Occlusion)**: Gracz i wrogowie stają się częściowo widoczni, gdy wchodzą "za" wysokie obiekty (drzewa, chatki).
- **Warianty**: Każdy typ obiektu ma teraz 6-7 wariantów graficznych oraz losowe lustrzane odbicie (Flip X).
- **Gruzowisko**: Nowy sprite dla zniszczonych chatek.

### ⚖️ Balans i Poprawki (Balance & Fixes)
- Zwiększono mapę do rozmiaru 24x (World Size).
- Zbalansowano drop rate rzadkich (zielonych/czerwonych) gemów.
- Poprawiono hitboxy obiektów (szczególnie drzew i chatek).
- Naprawiono błąd "Race Condition" przy szybkim pomijaniu intro (reset gry).
- Naprawiono błąd z nieskończonym trzęsieniem się obiektów po trafieniu.
- Pickupy i Gemy są teraz poprawnie sortowane (Z-Index) względem otoczenia.
- Paski zdrowia i XP mają teraz czytelne etykiety tekstowe.

---

## [v0.96] - 2025-11-29 - Audiowizualny Szlif & Totalna Destrukcja
### Dodano (Audio & System)
- **System Muzyczny 2.0:** Wdrożono `MusicManager` obsługujący playlisty (Menu/Gameplay) z inteligentnym systemem losowania (Shuffle Bag) i płynnymi przejściami (Cross-fade).
- **Regulacja Głośności:** Dodano suwaki w menu Opcji pozwalające niezależnie sterować głośnością Muzyki i Efektów (SFX).
- **Ekran Ładowania (Preloader):** Gra teraz profesjonalnie ładuje wszystkie zasoby graficzne i dźwiękowe przed startem, wyświetlając pasek postępu.

### Dodano (Rozgrywka & VFX)
- **Fala Uderzeniowa (Shockwave):** Eksplozje (Bomba, Ściana) nie zabijają już natychmiastowo całego ekranu. Teraz generują fizyczną falę uderzeniową, która rozchodzi się od centrum, niszcząc wrogów na swojej drodze.
- **Krwawa Śmierć:** Zastąpiono proste zniknięcie gracza dramatyczną sekwencją: pauza gry -> wybuch cząsteczek krwi -> czerwona winieta ekranu -> opóźniony Game Over.
- **Statystyka Zabójstw:** Dodano licznik "Total Kills" w HUD (format `Zabici (Obecni/Limit)`) oraz nową kolumnę w tabelach wyników.

### Usprawniono (Balans & QoL)
- **Separacja Wrogów:** Zwiększono siłę odpychania się standardowych wrogów (+40%), aby uniknąć tworzenia się "jednej wielkiej kropki". Horda i Wall zachowują swoją "tłumną" naturę.
- **Indykatory Hazardów:** Nowy wygląd ostrzeżeń o polach skażeń – teraz mają one kształt docelowej plamy z pulsującą poświatą, zamiast prostych okręgów.
- **Dev Tools:** Przycisk "Jeszcze raz" po śmierci w trybie testowym resetuje teraz bieżący scenariusz (np. MAX Weapons), zamiast wyrzucać do czystej gry.
- **Optymalizacja:** Przebudowano pętlę renderowania (`draw.js`), eliminując tworzenie tysięcy obiektów w każdej klatce (mniejsze obciążenie procesora).

### Naprawiono
- **Tytuł Gry:** Naprawiono błąd, przez który tytuł w przeglądarce nie wyświetlał pełnej nazwy i wersji po załadowaniu.
- **Menu:** Odblokowano przewijanie list na urządzeniach dotykowych.
- **Błędy Logiczne:** Naprawiono naliczanie XP (wymuszone liczby całkowite), zablokowano pauzę w trakcie animacji śmierci oraz naprawiono scenariusz "MIN" w narzędziach deweloperskich.


---

## [v0.95] - 2025-11-27 - Retro UI Overhaul & Juicy Update
### Dodano (UI & Menu)
- **Nowe Menu Główne:** Całkowita przebudowa interfejsu na styl "Retro Console/Pixel Art" (CSS-only, bez nowych grafik tła).
- **Hot Coffee:** Dodano sekcję wsparcia z kodem QR i linkiem, zastępującą klasyczne "O Autorze".
- **System Widoków:** Zastąpiono zakładki (Tabs) hierarchicznym systemem widoków (Main, Config, Guide, Dev).
- **Responsywność (RWD):** Wprowadzono kontener `.game-view`, naprawiając skalowanie gry i HUD na tabletach oraz urządzeniach mobilnych.
- **Touch Scroll:** Odblokowano przewijanie list (Perki, Wyniki, Config) gestem na ekranach dotykowych.
- **Dynamiczna Wersja:** Tytuł okna i tag w menu automatycznie pobierają numer wersji z `version.js`.

### Dodano (VFX & Feedback)
- **Juicy Death:** Zastąpiono zanikanie wrogów efektowną "eksplozją" cząsteczek (40 sztuk, duża prędkość, kolor zgodny z typem wroga).
- **Gem Visuals:**
    - Wprowadzono 3 rozmiary Ziemniaczków (4, 6, 8) zależne od rzadkości (Niebieski, Zielony, Czerwony).
    - Dodano intensywną, kolorową poświatę (`shadowBlur`) oraz tint dla rzadkich gemów.
    - Dodano animację "wciągania" gema przez gracza zamiast natychmiastowego znikania.
- **Mega Hazard VFX:** Dodano toksyczny filtr (zielono-fioletowy) na gracza i wrogów znajdujących się w Mega Hazardzie.
- **Nova Glow:** Dodano czerwoną poświatę dla pocisków broni Nova.

### Zmieniono (Balans & Mechanika)
- **Nova (Wybuch Mentalu):**
    - Całkowicie odseparowano statystyki od AutoGuna.
    - Przebicie (`Pierce`) zaczyna się od 1 i rośnie co kilka poziomów.
    - Zwiększono czas życia pocisku do 3.0s.
    - Zmniejszono skalę wizualną (z 8.0 na 4.0) dla lepszej czytelności.
- **Gemy:** Zmniejszono szansę na drop rzadkich gemów o połowę (Zielony: 2.5%, Czerwony: 0.5%).
- **Magnes:** Skrócono czas trwania pickupa z 4.0s na 3.0s.
- **Wrogowie:**
    - **Wall:** Zmniejszono prędkość ruchu o 50% (z 16 na 8).
    - **Horde:** Zwiększono rozmiar o 10% (z 39 na 43).
- **Logika Perków:** Naprawiono filtrowanie – ulepszenia broni (np. Multishot dla AutoGuna) nie pojawiają się już, jeśli gracz nie posiada tej broni.

### Naprawiono
- **Krytyczny Błąd Hazardów:** Wrogowie w polach hazardu nie stawali się już nieśmiertelni i nie zacinali się (dodano brakujący `killEnemy` przy `hp <= 0`).
- **Z-Index:** Naprawiono sortowanie obiektów – wrogowie znajdujący się "wyżej" na ekranie są teraz poprawnie zasłaniani przez gracza/wrogów będących "niżej".
- **Dev Tools:** Przywrócono pełną funkcjonalność narzędzi deweloperskich, naprawiono przyciski Scenariuszy i Presetów Wrogów (Auto-Start).
- **UI Fixes:**
    - Wycentrowano joystick (matematycznie i wizualnie).
    - Poprawiono wyświetlanie ikon w HUD (brak rozciągania).
    - Tablica wyników poprawnie wyświetla komunikat "BRAK WYNIKÓW" i odświeża się po Game Over.
    - Licznik wznawiania gry pokazuje teraz precyzyjny czas zamiast statycznej cyfry.

---

## [0.94] - 2025-11-25
### Fixed
- Kompleksowa naprawa fizyki kolizji: Knockback gracza i wrogów działa poprawnie (nawet przy Tarczy/GodMode).
- Naprawiono błędy krytyczne (crashe) związane z importami broni i pickupów.
- Usunięto błędy renderingu (artefakty, znikające sprite'y) poprzez stabilizację funkcji draw.
- Poprawiono logikę spawnu Oblężenia (zapobieganie nakładaniu się fal, losowy czas respawnu 100-300s).
- Naprawiono pozycjonowanie pasków zdrowia (Elite, Wall) oraz tekstów obrażeń (HitText).
- Przywrócono brakujące dźwięki (Hit, Explosion, XPPickup) oraz dodano system audio throttling.

### Changed
- Zbalansowano Oblężnika (HP -40%, Prędkość -20%).
- Zwiększono zasięg i hitbox Bicza, dodano ochronę point-blank.
- Ulepszono wizualizacje: Cienie pod stopami (dostrojone dla każdego typu wroga), efekt tonięcia w bagnie, filtr kolorystyczny zamiast obwódek.
- Zwiększono zasięg pickupa Bomby (+50%).
- Uporządkowano Menu Dev (dodano debug hitboxów) i Config (usunięto styl pickupów).

## [0.93] - 2025-11-24
### Added
- Wprowadzono system animacji oparty na spritesheetach dla wszystkich postaci.
- Nowe assety graficzne dla wrogów (Dadgamer, Horda, Menel, etc.) oraz gracza (Drakul).
- Dodano efekty wizualne dla broni (Bicz, Orbital, Nova).

### Changed
- Zaktualizowano logikę rysowania obiektów, aby obsługiwała klatki animacji.
- Wprowadzono skalowanie wizualne (visualScale) niezależne od hitboxów logicznych.

## [v0.92] - 2025-11-20
### Dodano (Animacje & Grafika)
- **System Animacji:** Wdrożono obsługę spritesheetów (klatek animacji) w silniku renderowania (`Enemy.js`, `Player.js`).
- **Player:** Dodano w pełni animowaną postać Gracza (4x4 sprite sheet) z dynamiczną prędkością odtwarzania zależną od ruchu.
- **StandardEnemy (DadGamer):** Dodano animację biegu (4x4 sprite sheet).
- **Skalowanie Wizualne (`visualScale`):** Wprowadzono system oddzielający wielkość hitboxa (fizyka) od wielkości wyświetlanej grafiki. Pozwala to na zachowanie czytelności rozgrywki przy różnorodnych grafikach.

### Zmieniono / Usprawniono
- **Refaktoryzacja `Enemy.js`:** Klasa bazowa wrogów obsługuje teraz uniwersalne rysowanie animacji oraz pasków zdrowia.
- **Health Bars:** Zestandaryzowano i naprawiono wyświetlanie pasków zdrowia dla Bossów (Elite) i Tanków.
- **Balans Wizualny:** Dostosowano rozmiary kluczowych wrogów (Wall, Tank, Elite) do nowego systemu, aby zachować proporcje z v0.91.

### Naprawiono
- **Crash Gry:** Naprawiono błąd krytyczny `drawHealthBar is not a function`, który powodował zawieszanie się gry przy pojawieniu się Tanka.
- **Nieśmiertelność:** Naprawiono błąd w konstruktorach wrogów, który powodował błędne obliczanie HP (NaN).
- **Importy:** Poprawiono błędne importy statystyk (`ENEMY_STATS` vs `ENEMY_CONFIG`) w plikach wrogów.

---

## [v0.91] - Kompletna Szata Graficzna i Stabilizacja UI
* **Grafika (Assets):** Wymieniono wszystkie pozostałe "zastępcze" grafiki (emoji, kształty) na profesjonalne assety rastrowe.
    * Dodano dedykowane ikony dla **wszystkich typów wrogów** (Standard, Horda, Tank, Ranged, Elite, Kamikaze, Splitter, Wall).
    * Dodano grafiki dla **wszystkich Pickupów** (Leczenie, Magnes, Bomba, Tarcza, Szybkość, Zamrożenie) oraz **Skrzyni**.
    * Dodano grafiki dla **broni** (Pociski, Wybuchy Nova, Butelki wrogów).
* **UI / HUD (Desktop & Tablet):**
    * Zaimplementowano **responsywne skalowanie HUD-a** na tabletach (ikony 28px, jeden rząd, brak ucinania).
    * Ujednolicono wygląd pasków Zdrowia i XP (wysokość 12px, identyczne ramki, poprawione wypełnianie rogów).
    * Przeniesiono **Panel Bonusów** (ikony aktywnych efektów) pod licznik FPS, aby nie zasłaniał rozgrywki.
    * Wszystkie statystyki w menu (Score, HP, Lvl) mają teraz dedykowane ikony graficzne zamiast tekstu.
* **VFX (Poświaty/Glow):**
    * Zaimplementowano system **dynamicznej poświaty (Glow)** dla wszystkich pickupów.
    * Dodano **Białą Poświatę** dla Talerza Hrabianki (Leczenie) i **Czerwoną** dla Łakomstwa (Magnes), zgodnie z balansem kolorystycznym.
    * Skrzynia (LudoBox) ma teraz unikalną, **złotą poświatę** i animację pulsowania.
* **UX (Splash Screen):**
    * Dodano **blokadę (debounce)** przy pomijaniu ekranów startowych (500ms), aby zapobiec przypadkowemu pominięciu kilku slajdów na raz (tzw. "ghost clicks" na mobile).
    * Umożliwiono pomijanie slajdów **w trakcie trwania animacji** wejścia (fade-in).
* **Przewodnik (Guide):**
    * Całkowicie przebudowano generator Przewodnika w grze. Teraz wyświetla on **listę obiektów wraz z ich grafikami** i opisami pobieranymi dynamicznie z systemu tłumaczeń (i18n).
* **Fix (i18n):** Naprawiono problem znikających ikon w nagłówkach tabel i menu przy zmianie języka (ikony są teraz wstrzykiwane dynamicznie obok przetłumaczonego tekstu).
* **Fix (Techniczny):** Usunięto cykliczną zależność w `chest.js`, która powodowała błędy inicjalizacji przy ładowaniu gry.
* 
---

## [v0.90] - Globalna Refaktoryzacja Lokalizacji (i18n) i Re-skin
* **Refaktoryzacja (i18n):** Zaimplementowano globalny system lokalizacji.
    * Utworzono silnik `i18n.js` zarządzający językiem i obsługujący **fallback do języka polskiego** (wzorcowego).
    * Utworzono pliki językowe `polish.js` i `english.js` w nowym katalogu `/lang/`.
    * Zrefaktoryzowano **11 plików** (`perks.js`, `utils.js`, `ui.js`, `eventManager.js`, `levelManager.js`, `collisions.js`, `introManager.js`, `enemyManager.js`, `chest.js`, `main.js`, `index.html`), aby usunąć wszystkie "zahardkodowane" teksty (nazwy, opisy, etykiety UI) i zastąpić je wywołaniami `getLang(key)`.
* **Re-skin (Lore):** Wdrożono wszystkie nowe nazwy i opisy z dokumentu GDD v0.9.
    * **Mechaniki:** "HP" -> "Sytość", "XP" -> "Wertykalność", "Gemy" -> "Ziemniaczki", "Skrzynia" -> "LudoBox".
    * **Bronie:** "Bicz" -> "Tłuczek Hrabianki", "AutoGun" -> "Plujko Jad", "Orbital" -> "Orbitalne Ziemniaczki", "Nova" -> "Eksplozja Mentalu", "Piorun" -> "Pierun Ludologa".
    * **Wrogowie:** "Standard" -> "Dadgamer", "Horda" -> "Maciek z czatu", "Tank" -> "Szkeletal", "Oblężnik" -> "Syndrom Oblężenia" itd.
    * **Pickupy:** "Leczenie" -> "Talerz Hrabianki", "Magnes" -> "Łakomstwo Hrabiego", "Tarcza" -> "Tarcza LodoBoga" itd.
* **Nowa Funkcja (UI):** Dodano dynamiczny **przełącznik języka** (Polski / English) w zakładce "Konfiguracja". Wybór jest zapisywany w `localStorage`.
* **Nowa Funkcjonalność (UI):** Zawartość zakładki "Przewodnik" (`#guideContent`) jest teraz generowana dynamicznie w całości z plików językowych przy otwieraniu menu.

---

## [v0.89] - Implementacja Grafiki (Część 1)
* **Grafika (Gracz):** Zastąpiono animowany kwadrat statycznym obrazkiem `drakul.png`.
    * Dodano logikę `drawScale` (regulator rozmiaru) oraz lustrzanego odbicia sprite'a (`facingDir`).
    * Poprawiono pozycję paska HP, aby renderował się *nad* sprite'em.
    * Dostosowano hitbox gracza (`this.size`) do wizualnego rozmiaru sprite'a (80px).
* **Grafika (Tło):** Zastąpiono proceduralną siatkę (szachownicę) bezszwową teksturą trawy (`bg_grass.png`).
    * Zaimplementowano skalowanie tekstury tła (`TILE_SCALE`), aby uniknąć problemu "wielkiej trawy".
* **Poprawki Balansu (Dostosowanie do Grafiki):**
    * Zwiększono promień wizualny Tarczy i efektu Hazardu na graczu, aby pasowały do nowego sprite'a.
    * Zwiększono bazowy promień `Orbitala` (z 28 na 50) i `Tłuczka` (`WHIP_BASE_OFFSET` z 40 na 60), aby ataki zaczynały się na krawędzi sprite'a gracza.
    * Zwiększono skalę wizualną animacji `Tłuczka` (z 60 na 80).
* **VFX (Mignięcie):** Zastąpiono stary efekt `globalAlpha` (przezroczystość) przy trafieniu na `filter: brightness(5)` (białe mignięcie), co działa lepiej na sprite'ach. Dotyczy to zarówno gracza (`playerHitFlashT`), jak i wrogów (`hitStun`).
* **VFX (Usunięcie):** Zakomentowano stary efekt "śladu" (trail) za graczem, który nie pasował do nowego sprite'a.

---

## [v0.88] - Rebranding i Sekwencja Startowa
* **Nowa Nazwa:** Nazwa gry została zmieniona na "Szkeletal: Ziemniaczany Głód Estrogenowego Drakula"

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