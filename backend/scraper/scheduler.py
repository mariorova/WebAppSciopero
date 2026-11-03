import asyncio
from datetime import datetime
from scraper.spider import run_spider

# Riferimento globale al task e lock di concorrenza
_scheduler_task = None
_scraping_lock = asyncio.Lock()  # Lock asincrono per impedire esecuzioni sovrapposte
INTERVAL_SECONDS = 2 * 60 * 60     # 2 ore (7200 secondi)

async def run_spider_safely():
    """
    Esegue lo spider verificando che non ce ne sia un altro già in esecuzione.
    Se è già attivo un processo di scraping, la richiesta viene ignorata in sicurezza.
    """
    if _scraping_lock.locked():
        print("[SCHEDULER] ATTENZIONE: C'è già uno scraping in corso. Richiesta ignorata per evitare sovrapposizioni.")
        return False

    async with _scraping_lock:
        try:
            ora_attuale = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            print(f"[{ora_attuale}] --- AVVIO SPIDER CON LOCK ATTIVO ---")
            await run_spider()
            ora_fine = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            print(f"[{ora_fine}] --- SPIDER COMPLETATO CON SUCCESSO ---")
            return True
        except Exception as e:
            print(f"[ERRORE SCHEDULER] Errore durante l'esecuzione dello spider: {e}")
            return False

async def _periodic_spider_loop():
    """
    Loop in background che esegue lo spider immediatamente all'avvio del server
    e successivamente si ripete ogni 2 ore.
    """
    # Esecuzione immediata all'avvio
    await run_spider_safely()

    while True:
        # Attende 2 ore prima della prossima scansione
        await asyncio.sleep(INTERVAL_SECONDS)
        await run_spider_safely()

def start_scheduler():
    """
    Avvia il task asincrono in background agganciandosi all'event loop di FastAPI.
    """
    global _scheduler_task
    try:
        loop = asyncio.get_running_loop()
        if _scheduler_task is None or _scheduler_task.done():
            _scheduler_task = loop.create_task(_periodic_spider_loop())
            print("--- SCHEDULER ATTIVATO CON LOCK CONCORRENTE ---")
    except RuntimeError as e:
        print(f"Impossibile avviare lo scheduler automatico: {e}")

def stop_scheduler():
    """
    Ferma in modo pulito il task in background quando il server viene spento.
    """
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        print("--- SCHEDULER DISATTIVATO ---")