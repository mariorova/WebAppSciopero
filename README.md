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

1. Gestione degli Errori e "Empty States" nel Frontend
Cosa fare: Assicurati che se lo spider fallisce o il server non risponde, l'utente veda un messaggio chiaro (es. "Impossibile connettersi alle fonti ufficiali, riprova più tardi") invece di schermate vuote o blocchi di caricamento infiniti.

Perché: Durante il lancio pubblico, i siti istituzionali potrebbero bloccare temporaneamente le richieste o essere in manutenzione.

2. Sistema di Cache o Coda per lo Scraping
Cosa fare: Attualmente lo spider viene eseguito ogni 2 ore in background. Assicurati che le richieste API dal frontend leggano direttamente dal database PostgreSQL (cosa che già fai) e che lo spider non sovraccarichi il server o le fonti eseguendo richieste concorrenti se un ciclo precedente è ancora in corso.

Perché: Evita il rischio di ban degli IP da parte del portale del MIT o di ATM a causa di troppe richieste ravvicinate.

3. Log delle Esecuzioni dello Spider (Monitoraggio)
Cosa fare: Aggiungi una piccola tabella nel database (es. spider_logs) che memorizza data, ora, stato (successo/fallimento) e numero di record importati per ogni esecuzione automatica. Potresti anche esporre un endpoint riservato agli amministratori per verificare lo stato di salute del monitoraggio.

Perché: Quando la web app sarà online, avrai bisogno di sapere subito se lo scraping ha smesso di funzionare a causa di modifiche alla struttura HTML dei siti ufficiali.

4. Ottimizzazione SEO e Metadati (Fondamentale prima del dominio)
Cosa fare: Configura correttamente i tag <title>, la meta description e i tag Open Graph (per le anteprime quando l'app viene condivisa su WhatsApp, Telegram o social) all'interno del progetto React (index.html o tramite librerie come react-helmet).

Perché: Trattandosi di un servizio utile per i pendolari, la condivisione social e l'indicizzazione su Google per chiavi come "scioperi mezzi Milano" o "sciopero treni" saranno la tua principale fonte di traffico organico.

5. Sicurezza di Produzione (HTTPS, Rate Limiting e Variabili d'Ambiente)
Cosa fare:

Sposta chiavi segrete, stringhe di connessione al database e credenziali in un file .env sicuro che non finisca su GitHub.

Implementa un semplice Rate Limiting sulle API FastAPI (specialmente sugli endpoint di autenticazione e login) per prevenire attacchi di forza bruta.

Assicurati che il dominio futuro utilizzi esclusivamente HTTPS.

6. Pagine Legali e di Servizio
Cosa fare: Aggiungi una pagina o un modale con l'Informativa sulla Privacy (Privacy Policy), i Termini di Servizio e un disclaimer che specifichi che i dati provengono da fonti pubbliche ufficiali ma che l'app declina ogni responsabilità per eventuali variazioni improvvise della circolazione.