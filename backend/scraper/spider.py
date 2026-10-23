import logging
import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from database import SessionLocal
from models.strike import Strike

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIT_SCIPERI_URL = "https://scioperi.mit.gov.it/mit2/public/scioperi"

def parse_date(date_str):
    """Estrae e converte una stringa data in oggetto datetime.date usando le regex"""
    if not date_str:
        return None
    match = re.search(r'(\d{2}/\d{2}/\d{4})', date_str)
    if match:
        date_clean = match.group(1)
        try:
            return datetime.strptime(date_clean, "%d/%m/%Y").date()
        except ValueError:
            return None
    return None

def extract_city(text):
    """Estrae una città o regione nota dal testo, altrimenti restituisce Nazionale o Locale"""
    text_upper = text.upper()
    cities = ["NAPOLI", "ROMA", "MILANO", "BOLOGNA", "FIRENZE", "TORINO", "VENEZIA", "PALERMO", "BARI", "GENOVA", "CATANIA", "PISA"]
    for city in cities:
        if city in text_upper:
            return city.capitalize()
    if "NAZIONALE" in text_upper:
        return "Nazionale"
    return "Locale"

def fetch_and_parse_strikes():
    logger.info("Avvio dello scraping degli scioperi dal portale MIT...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    strikes_data = []
    try:
        response = requests.get(MIT_SCIPERI_URL, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table')
        if not table:
            logger.warning("Nessuna tabella trovata nella pagina del MIT.")
            return []

        rows = table.find_all('tr')
        logger.info(f"Trovate {len(rows)} righe grezze nella tabella del MIT.")
        
        for row in rows[1:]:  # Salta l'intestazione
            cols = row.find_all('td')
            if len(cols) >= 8:
                start_date_str = cols[1].get_text(strip=True)
                end_date_str = cols[2].get_text(strip=True)
                unions = cols[3].get_text(strip=True)
                sector = cols[4].get_text(strip=True)
                category = cols[5].get_text(strip=True)
                modalita = cols[6].get_text(strip=True)
                rilevanza = cols[7].get_text(strip=True)
                
                start_date = parse_date(start_date_str)
                end_date = parse_date(end_date_str)
                
                if not start_date:
                    continue
                
                # Estrazione dinamica della città basata sul contenuto
                city = extract_city(category)
                if city == "Locale" and "Nazionale" in rilevanza:
                    city = "Nazionale"

                strike_obj = {
                    "city": city,
                    "sector": sector,
                    "start_time": datetime.combine(start_date, datetime.min.time()),
                    "end_time": datetime.combine(end_date or start_date, datetime.min.time()),
                    "description": f"{category} - Sindacati: {unions} ({modalita})",
                    "source_id": 1  # Collegato alla fonte ufficiale MIT nel DB
                }
                strikes_data.append(strike_obj)
                
        logger.info(f"Trovati e validati {len(strikes_data)} scioperi.")
        return strikes_data

    except Exception as e:
        logger.error(f"Errore durante lo scraping del MIT: {e}")
        return []

def run_spider():
    db: Session = SessionLocal()
    try:
        raw_strikes = fetch_and_parse_strikes()
        new_count = 0
        
        for data in raw_strikes:
            existing = db.query(Strike).filter_by(
                start_time=data["start_time"],
                sector=data["sector"],
                description=data["description"]
            ).first()
            
            if not existing:
                db_strike = Strike(**data)
                db.add(db_strike)
                new_count += 1
                
        db.commit()
        logger.info(f"Spider completato con successo. Aggiunti {new_count} nuovi scioperi al database.")
    except Exception as e:
        db.rollback()
        logger.error(f"Errore nel salvataggio degli scioperi nel DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_spider()