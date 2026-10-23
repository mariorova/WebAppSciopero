from apscheduler.schedulers.background import BackgroundScheduler
from scraper.spider import run_spider
import logging

logger = logging.getLogger(__name__)

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Esegue lo scraping ogni giorno alle 06:00 del mattino
    scheduler.add_job(run_spider, 'cron', hour=6, minute=0)
    # Oppure per test: scheduler.add_job(run_spider, 'interval', hours=6)
    scheduler.start()
    logger.info("Scheduler dello spider avviato con successo.")