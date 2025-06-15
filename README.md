# CryptoTracker (Web Advanced Portfolio Project 2024-2025, Erasmus Hogeschool Brussel)

**Student:** Enwin Dang  
**Cursus:** Web Advanced
**Academiejaar:** 2024-2025

---

## Projectbeschrijving

CryptoTracker is een interactieve Single Page Application (SPA) waarmee je realtime informatie over meer dan 100 cryptocurrencies kunt bekijken, sorteren, filteren en favorieten kunt opslaan.  
**Waarom crypto?** Cryptocurrencies zijn enorm in opmars en veel mensen willen snel markttrends volgen of hun favoriete munten tracken. Deze app biedt beleggers en geïnteresseerden een snelle, overzichtelijke manier om de cryptomarkt te volgen, prijsgeschiedenis te bekijken en eigen favorieten te bewaren – allemaal in één gebruiksvriendelijke webapp.

---

## Functionaliteiten

- Overzicht van meer dan 100 cryptocurrencies in een tabel
- Sorteren op prijs, marktkapitalisatie, volume, 24u-verandering
- Filteren op favorieten, stijgers, dalers
- Realtime zoeken op naam of symbool
- Gedetailleerde pagina per munt (prijs, marktkapitalisatie, volume, beschrijving, prijsgeschiedenis)
- Munten als favoriet opslaan (blijven bewaard in localStorage)
- Responsive design: werkt op mobiel en desktop
- Donker/licht thema met themavoorkeur bewaard in localStorage
- Fade-in animaties via IntersectionObserver
- SPA-routing (navigatie zonder page reloads via hash-fragmenten)

---

## Gebruikte API's

- **CoinPaprika API:**  
  - [https://api.coinpaprika.com](https://api.coinpaprika.com)  
  - Gebruikt voor het ophalen van algemene data: lijst van munten, actuele marktdata, muntdetails.
- **Binance API:**  
  - [https://www.binance.com/en/binance-api](https://www.binance.com/en/binance-api)  
  - Gebruikt voor het ophalen van prijsgeschiedenis en het genereren van koersgrafieken.

---

## Technische vereisten (met code-locaties)

> **Alle verplichte moderne JavaScript-concepten uit Web Advanced zijn toegepast. Zie onder per onderdeel een verwijzing naar het bestand en regelnummers.**

- **DOM-manipulatie:**  
  - `main.js`:  
    - `renderTable` (regel 115-165)  
    - `renderFavoritesTable` (168-210)  
    - `showView` (99-108)  
    - `renderCoinDetails` / `renderPriceChart` (227-272)  
- **Elementen selecteren:**  
  - `main.js`: bovenaan via `document.getElementById`, `querySelector` (regel 8-30)
- **Events (event listeners):**  
  - `main.js`: `setupEventListeners` (regel 36-76)
- **Array methodes (map, filter, forEach):**  
  - `main.js`:  
    - `filterAndSort` (297-331)  
    - `renderTable` (forEach, regel 141)  
    - `renderFavoritesTable` (forEach, regel 185)
- **Promises / Async & Await:**  
  - `api.js`:  
    - `fetchCoinsList`, `fetchGlobalData`, `fetchCoinDetails` (regel 7, 14, 20, 28, 43)  
  - `main.js`:  
    - `loadHomeData`, `loadFavoritesData`, `loadCoinDetails` (regel 110, 182, 212)
- **Observer API:**  
  - `main.js`: `rowObserver`, `observeRows` (410-422)
- **Fetch / API-aanroepen:**  
  - `api.js`: `_get` (regel 7), `fetchCoinsList` (14), `fetchCoinDetails` (28)
- **LocalStorage:**  
  - `main.js`:  
    - Initialisatie: `favorites: JSON.parse(localStorage.getItem(...))` (regel 33)  
    - Opslaan: `toggleFavorite` (363-372)  
    - Ophalen: `loadFavoritesData` (179)
- **Styling / layout:**  
  - `style.css`:  
    - Responsive layout: `@media (max-width: 768px)` (652), `@media (max-width: 480px)` (668)  
    - CSS grid/flex: `.overview-cards` (74), `.coin-detail-container` (259)  
    - Donker/licht thema: `:root`, `.dark-theme` (1-39)  
    - Animatie: `.observe-fade`, `.fade-in` (747-755)
- **Formulier validatie:**  
  - `main.js`: `handleSearch` (374-388)
- **Modern JavaScript (template literals, arrow functions, ternary):**  
  - `utils.js`:  
    - Template literals, arrow functions, ternary operator (7, 19, 29, 37)  
  - `main.js`:  
    - Arrow functions in observer (413), ternary in className (250)

---

## Installatie

1. **Clone de repository:**
    ```bash
    git clone https://github.com/EnwinDang/WebAdvanced_Portfolio_CryptoTracker.git
    cd WebAdvanced_Portfolio_CryptoTracker
    ```

2. **Installeer dependencies:**
    ```bash
    npm install
    ```

3. **Start de ontwikkelserver:**
    ```bash
    npm run dev
    ```
4. **Open de app:**  
   [http://localhost:3000](http://localhost:3000)

---

## Screenshots

![Home_Light](https://github.com/user-attachments/assets/5c8c4b0f-0a3f-470a-bbd9-809e0f0a1389)
![Home_Dark](https://github.com/user-attachments/assets/c8dfcd73-b9bc-4939-82a3-f8d4bdecbd45)
![Favorieten_Pagina](https://github.com/user-attachments/assets/1cfb1465-2658-4ef3-9cda-1595e7c5417c)
![Details_Chart_Pagina](https://github.com/user-attachments/assets/a5bc3f4e-8815-4648-ba00-cbee08ad9b7e)

---

## Folderstructuur
/node_modules  
/public  
  └─ vite.svg  
/src  
  ├─ css  
  │   └─ style.css  
  └─ js  
      ├─ api.js  
      ├─ main.js  
      └─ utils.js  
.gitignore  
index.html  
package-lock.json  
package.json  
README.md  
vite.config.js  


---

## Gebruikte bronnen

- [CoinPaprika API docs](https://api.coinpaprika.com/)
- [Binance API docs](https://www.binance.com/en/binance-api)
- [Chart.js](https://www.chartjs.org/)
- [ChatGPT (codeuitleg, debugging en README):](https://chatgpt.com/share/682f287a-0494-8002-9f8e-85312b2ca6e7)
- Cursusmateriaal "Web Advanced" — Erasmus Hogeschool Brussel

---

## Commit History

Deze repository bevat meerdere commits per onderdeel en per werkdag, zoals gevraagd. Zie de [GitHub commit history](https://github.com/EnwinDang/WebAdvanced_Portfolio_CryptoTracker/commits/main) voor het volledige commit-overzicht.

---

## Evaluatie (zelfcheck)

- [x] Functioneel: Alle vereiste features werken
- [x] Code is leesbaar en gestructureerd
- [x] Responsive design op mobiel en desktop
- [x] Alle verplichte JavaScript-concepten geïmplementeerd
- [x] Regelmatige commits, duidelijke folderstructuur
- [x] README compleet met installatie, uitleg, screenshots

---

## Licentie

MIT License — Vrij te gebruiken voor educatieve doeleinden.

---

## Opmerking

Dit project is gemaakt als onderdeel van het vak Web Advanced aan de Erasmus Hogeschool Brussel, academiejaar 2024-2025.


