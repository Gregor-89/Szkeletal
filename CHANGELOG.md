# CHANGELOG

## [v0.118] - 2026-02-24 (Amenda, The Potato Queen Update)
### ⭐ Nowości (Features)
- **Nowy Boss (Amenda)**: Dodano unikalnego przeciwnika 'Amenda' z własnym zachowaniem, dedykowanymi sprite'ami, oraz skalowaniem zdrowia (poziom + minuty przetrwania).
- **Ziemniaczana Bomba**: Implementacja nowego ataku obszarowego. Amenda rzuca granatami (kartoflami), które przelatują nad przeszkodami na mapie (chatki/drzewa) i ogłuszają gracza rykoszetem (obrażenia ignorują otoczenie).
- **Przewodnik (Lore)**: Dodano wpisy o postaci (pato-świat) do systemu słownika, w tym do Przewodnika i Ekranu Statystyk (ilość pokonanych Amend). Wsparcie dla języka: Polskiego, Angielskiego i Rumuńskiego.
- **Nawigacja (UI)**: Dodano powiadomienie o pojawieniu się bossa (AMENDA) w locie, wskaźnik off-screen (fioletowa strzałka na brzegu ekranu), oraz własny, widoczny pod postacią Boss Healthbar.

### 🐛 Poprawki Błędów
- **Nieśmiertelność DevTools**: Poprawiono obiegową logikę życia (`hpScale`), dzięki której zrespawnowani bossowie (Zombie State) prawidłowo upuszczają rzadki łup przy zjeściu do 0% HP zamiast błąkać się zacinając animację.
- **Migotanie Kierunku Jittering**: Wyeliminowano drżączkę kamery celowania postaci. Amenda zachowuje teraz ustabilizowany tor patrzenia na Gracza wykorzystując deadzone w dystansie, a nie pędzie bezwładności.
- **Crash Pocisków**: Usunięto krytyczny błąd de-referencji `TypeError: player is not defined` wyrzucający aplikację w funkcji `handleMovement()`.


## [v0.117] - 2026-01-09 (Poprawki Spatial Spacing & Intro)
### 🐛 Poprawki Błędów
- **Nawigacja Intro**: Usunięto sterowanie klawiszami (Strzałki/Enter) w intro komiksowym. Nawigacja odbywa się teraz wyłącznie za pomocą przycisków na ekranie, aby zapobiec przypadkowemu pominięciu.
- **Kamera w Samouczku**: Naprawiono "skok" pozycji kamery przy zamykaniu samouczka. Kamera teraz inicjalizuje się poprawnie z uwzględnieniem poziomu zoomu od samego początku.
- **UI Samouczka**: Wyśrodkowano przycisk "Zaczynajmy" w oknie samouczka.
- **Generowanie Mapy**: Zaimplementowano minimalny odstęp (1500px) przy generowaniu Kapliczek (Shrines), aby zapobiec ich grupowaniu się w jednym miejscu.

## [v0.116] - 2026-01-09 (Szlifowanie UI & CSS)
### 🐛 Poprawki Błędów i Ulepszenia
- **Stabilność UI**: Naprawiono "skaczące" flagi języka w menu głównym poprzez usunięcie konfliktujących animacji JS i wykluczenie ich z efektów fade-in CSS.
- **Przycisk "Postaw Kawę"**: 
  - Przywrócono logikę: przycisk poprawnie odblokowuje teraz skórkę 'Hot Dracula'.
  - Dodano informację zwrotną: przycisk zmienia kolor na zielony (stan Sukces) po odblokowaniu.
  - Naprawiono obcinanie poświaty przycisku poprzez korektę marginesów i kontenerów.
  - Dodano jednorazowy efekt dźwiękowy i aktualizację tekstu po odblokowaniu.
- **Skin Manager**: Naprawiono niezgodność ID (`skin_dracula_hot` vs `hot`), która uniemożliwiała odblokowanie skórki.
- **CSS**: Usunięto poziomy pasek przewijania w menu Kawa i poprawiono ogólne pozycjonowanie elementów.

## [v0.115] - 2025-01-08 (Poprawki Beta)
### 🐛 Poprawki Błędów
- **Poważne**: Naprawiono błąd `Uncaught SyntaxError` w pliku `obstacle.js`, który powodował awarię gry podczas ładowania.
- **Spawnowanie**: Dostosowano licznik początkowego spawnu wrogów. Pierwszy wróg pojawia się teraz w ciągu ok. 3s (wcześniej trwało to za długo), ale poprawnie spawnuje się poza ekranem.
- **Oprawa Wizualna**: 
  - Poprawiono efekt błysku pocisków (Orbital/Nova), aby był spójny z błyskami trafień wroga (biały błysk przy użyciu CSS filters).
  - Naprawiono problem culling-u (znikania obiektów), gdzie wysokie przeszkody (Drzewa/Chaty) znikały zbyt wcześnie przy dolnej krawędzi ekranu.
- **UI**: Wyrównano w poziomie przyciski "Wyślij Wynik" i "Wyczyść Wyniki" na ekranie końca gry.

### ⚙️ Balans
- **Wczesna Gra**: Zmniejszono `SPAWN_GRACE_PERIOD` do 0.5s, aby przyspieszyć pierwsze spotkanie z wrogiem.

## [v0.114] - 2025-01-07 (Beta Release Candidate)
### ⭐ Features
- **Map Generation**:
    - **Nowa, gęstsza mapa**: Drastycznie zwiększono liczbę obiektów (Drzewa: 1200, Skały: 600, Chaty: 150).
    - **Optymalizacja**: Wprowadzono precyzyjny Culling (usuwanie obiektów poza kamerą), co pozwala na 60 FPS nawet przy 2000+ obiektach.
    - **Warstwy**: Poprawne sortowanie Y (obiekty wyżej są "za" obiektami niżej).
    - **Unikalność**: Każdy obiekt ma losowy wariant (jedna z 6 grafik) i skalę.
...