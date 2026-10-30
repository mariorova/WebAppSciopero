import asyncio
from datetime import datetime
from scraper.spider import run_spider

# Riferimento globale al task per evitare che venga eliminato dal garbage collector
_scheduler_task = None
INTERVAL_SECONDS = 2 * 60 * 60  # 2 ore (7200 secondi)

async def _periodic_spider_loop():
    """
    Loop in background che esegue lo spider immediatamente all'avvio del server
    e successivamente si ripete ogni 2 ore finché il server resta acceso.
    """
    while True:
        try:
            ora_attuale = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            print(f"[{ora_attuale}] --- AVVIO AUTOMATICO SPIDER (Startup / Pianificato) ---")
            await run_spider()
            ora_fine = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            print(f"[{ora_fine}] --- SPIDER AUTOMATICO COMPLETATO. Prossima esecuzione tra 2 ore ---")
        except Exception as e:
            print(f"[ERRORE SCHEDULER] Errore durante l'esecuzione automatica dello spider: {e}")

        # Attende 2 ore prima della prossima scansione
        await asyncio.sleep(INTERVAL_SECONDS)

def start_scheduler():
    """
    Avvia il task asincrono in background agganciandosi all'event loop di FastAPI.
    """
    global _scheduler_task
    try:
        loop = asyncio.get_running_loop()
        if _scheduler_task is None or _scheduler_task.done():
            _scheduler_task = loop.create_task(_periodic_spider_loop())
            print("--- SCHEDULER ATTIVATO: Scansione iniziale avviata in background + ciclo ogni 2 ore ---")
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