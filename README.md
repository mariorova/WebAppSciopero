# WebAppSciopero
# 🚆 ScioperiFacili (Public Transit Strikes Tracker)

**ScioperiFacili** è una web app collaborativa pensata per permettere agli utenti di visualizzare in modo semplice, rapido e aggiornato tutti gli scioperi dei trasporti pubblici nella propria città. 

Il progetto unisce l'automazione del **Web Scraping** per la raccolta dei dati con un sistema di **crowdsourcing** basato sulla reputazione delle fonti, gestito direttamente dalla community.

---

## 🚀 Funzionalità Principali

* **Visualizzazione in Tempo Reale:** Elenco aggiornato degli scioperi dei trasporti pubblici locali e nazionali.
* **Filtri Rapidi:** Ricerca immediata per città (es. Milano, Roma), data e tipologia di mezzo (Treno, Metro, Bus).
* **Mappa delle Linee Colpite:** Dettaglio interattivo che mostra quali linee specifiche sono attive e quali sono chiuse durante lo sciopero.
* **Sistema di Voto (Reputazione Fonti):** Gli utenti registrati possono esprimere un feedback sull'affidabilità delle fonti, aiutando l'algoritmo a filtrare le notizie dubbie o errate.
* **Accesso Protetto:** Funzionalità base accessibili liberamente, con sezioni avanzate (dettagli e voti) riservate agli utenti autenticati.

---

## 🛠️ Stack Tecnologico

### Frontend
* **React** (con Vite) per un'interfaccia utente moderna, reattiva e ottimizzata *Mobile-First*.
* **React Router** per la gestione delle rotte e protezione delle pagine tramite token JWT.

### Backend & Database
* **Python / FastAPI** per lo sviluppo delle API REST ad alte prestazioni.
* **PostgreSQL & SQLAlchemy** per la gestione relazionale dei dati (utenti, scioperi, fonti e voti).
* **BeautifulSoup / Playwright** per il motore di Web Scraping automatizzato (tramite task scheduler periodico).

---

## 📂 Architettura delle API

La comunicazione tra il frontend in React e il backend in FastAPI segue una struttura standardizzata:
* `POST /api/auth/register` - Registrazione nuovo utente
* `POST /api/auth/login` - Autenticazione e rilascio Token JWT
* `GET /api/scioperi` - Lista degli scioperi con filtri e paginazione
* `GET /api/scioperi/{id}` - Dettagli avanzati e mappa delle linee (Protetto)
* `GET /api/fonti` - Elenco delle fonti monitorate e punteggio di affidabilità
* `POST /api/fonti/{id}/voti` - Invio voto di affidabilità sulla fonte (Protetto)

---

## 📱 Wireframe della Home (Mobile View)

```

+--------------------------------------------------+
| [Menu]       SCIOPERI FACILI          [Login]    |
+--------------------------------------------------+
| 🔍 Cerca città o settore...                      |
+--------------------------------------------------+
| [ 🏙️ Milano ] [ 🏛️ Roma ] [ 🚆 Tutti ]          |
+--------------------------------------------------+
| 🔴 Milano - TPL (ATM)                            |
| 📅 Lun 15 Giu, 08:30 - 12:30                     |
| 📝 Sciopero generale del trasporto locale.       |
| Fonte: ATM Milano (Affidabilità: 85%)            |
| [🔒 Visualizza Dettagli e Mappa]                 |
+--------------------------------------------------+

```
## 📄 Documentazione del Progetto
La specifica tecnica completa, l'analisi dei requisiti e la progettazione dell'architettura sono disponibili all'interno del file `documentazione.txt` nel repository.

---

## 👥 Contributi
Questo è un progetto in continua evoluzione. Se vuoi suggerire miglioramenti, segnalare bug o proporre nuove fonti da monitorare, sentiti libero di aprire una *Pull Request* o una *Issue*.

```

---

AVVIO BACKEND: 
cd backend
source venv/bin/activate
./venv/bin/uvicorn main:app --reload

AVVIO FRONTEND: 
npm run dev


MANCA DA SISTEMARE SPIDER DI ATM CHE NON MOSTRA NULLA