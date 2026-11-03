import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.strike import Strike
from models.source import Source
from models.spider_log import SpiderLog
from database import SessionLocal
from playwright.async_api import async_playwright

MESI_IT = {
    "gennaio": 1, "febbraio": 2, "marzo": 3, "aprile": 4,
    "maggio": 5, "giugno": 6, "luglio": 7, "agosto": 8,
    "settembre": 9, "ottobre": 10, "novembre": 11, "dicembre": 12
}

def extract_dates_from_text(text: str, default_days_offset: int = 1):
    now = datetime.now()
    slash_dates = re.findall(r'(\d{2})/(\d{2})/(\d{4})', text)
    if slash_dates:
        d1, m1, y1 = map(int, slash_dates[0])
        start_dt = datetime(y1, m1, d1, 0, 0, 0)
        if len(slash_dates) > 1:
            d2, m2, y2 = map(int, slash_dates[1])
            end_dt = datetime(y2, m2, d2, 23, 59, 59)
        else:
            end_dt = datetime(y1, m1, d1, 23, 59, 59)
        return start_dt, end_dt

    text_low = text.lower()
    for nome_mese, num_mese in MESI_IT.items():
        if nome_mese in text_low:
            range_match = re.search(rf'(\d{{1,2}})\s*(?:e|-|/|\s+al\s+)\s*(\d{{1,2}})\s+{nome_mese}', text_low)
            if range_match:
                d1, d2 = map(int, range_match.groups())
                return datetime(now.year, num_mese, d1, 0, 0, 0), datetime(now.year, num_mese, d2, 23, 59, 59)
            
            single_match = re.search(rf'(\d{{1,2}})\s+{nome_mese}', text_low)
            if single_match:
                d1 = int(single_match.group(1))
                return datetime(now.year, num_mese, d1, 0, 0, 0), datetime(now.year, num_mese, d1, 23, 59, 59)

    start_fallback = now + timedelta(days=default_days_offset)
    return start_fallback, start_fallback.replace(hour=23, minute=59, second=59)

def classify_sector(raw_sector: str, full_text: str) -> str:
    combined = f"{raw_sector} {full_text}".lower()
    if any(k in combined for k in ["aereo", "aeroport", "enav", "aviation", "volo"]):
        return "Aereo"
    if any(k in combined for k in ["ferrovi", "trenitalia", "trenord", "italo", "rfi"]):
        return "Ferroviario"
    if any(k in combined for k in ["marittim", "portual", "porti", "navigazione", "traghett"]):
        return "Marittimo"
    if any(k in combined for k in ["trasporto pubblico locale", "tpl", "atm", "atac", "campania", "autobus", "metro"]):
        return "TPL"
    if any(k in combined for k in ["autostrad", "stradal", "viabilit"]):
        return "Autostrade / Viabilità"
    if any(k in combined for k in ["generale", "plurisettoriale"]):
        return "Sciopero Generale"
    return raw_sector.strip().capitalize() if raw_sector.strip() else "Trasporto Pubblico"

def find_city(description: str) -> str:
    cities = [
        "Milano", "Roma", "Napoli", "Torino", "Bologna", "Firenze", "Pisa", "Bari", 
        "Venezia", "Genova", "Palermo", "Catania", "Verona", "Reggio Emilia", "Rimini",
        "Lombardia", "Lazio", "Toscana", "Campania", "Piemonte", "Emilia-Romagna", "Puglia", "Sicilia", "Veneto"
    ]
    found = [c for c in cities if re.search(rf'\b{c}\b', description, re.IGNORECASE)]
    if found:
        return " / ".join(dict.fromkeys(found[:2]))
    return "Nazionale"

async def run_spider():
    db: Session = SessionLocal()
    # Crea un log iniziale con stato RUNNING
    log_entry = SpiderLog(status="RUNNING", records_added=0)
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    mit_list, atm_list, trenord_list = [], [], []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            # 1. MIT
            try:
                await page.goto("https://scioperi.mit.gov.it/mit2/public/scioperi", timeout=45000)
                await page.wait_for_timeout(4000)
                mit_url = page.url
                rows = await page.locator("table tbody tr").all()
                for row in rows:
                    cells = await row.locator("td").all()
                    if len(cells) >= 4:
                        raw_texts = [await c.inner_text() for c in cells]
                        clean_cells = [re.sub(r'\s+', ' ', t).strip() for t in raw_texts if re.sub(r'\s+', ' ', t).strip()]
                        if len(clean_cells) < 4:
                            continue
                        row_str = " - ".join(clean_cells)
                        if not re.search(r'\d{2}/\d{2}/\d{4}', row_str):
                            continue
                        start_dt, end_dt = extract_dates_from_text(row_str)
                        sindacati = clean_cells[2] if len(clean_cells) > 2 else "N/D"
                        settore_mit = clean_cells[3] if len(clean_cells) > 3 else ""
                        ente = clean_cells[4] if len(clean_cells) > 4 else ""
                        modalita = clean_cells[5] if len(clean_cells) > 5 and not re.search(r'\d{2}/\d{2}/\d{4}', clean_cells[5]) else ""

                        info_parts = [p for p in [ente, f"Orari/Modalità: {modalita}" if modalita else "", f"Sindacati: {sindacati}"] if p]
                        mit_list.append({
                            'city': find_city(row_str),
                            'sector': classify_sector(settore_mit, row_str),
                            'description': (" • ".join(info_parts))[:300],
                            'start_time': start_dt,
                            'end_time': end_dt,
                            'source_name': 'Ministero delle Infrastrutture e dei Trasporti (MIT)',
                            'source_url': mit_url
                        })
            except Exception as e:
                print(f"Errore MIT: {e}")

            # 2. ATM
            try:
                await page.goto("https://www.atm.it/it/Pagine/default.aspx", timeout=35000)
                await page.wait_for_timeout(3500)
                atm_current_url = page.url
                elements = await page.locator("a, h2, h3, h4, p, li, .atm-news, .ms-rtestate-field").all()
                seen_atm = set()
                keywords_atm = ["sciopero", "m1", "m2", "m3", "m4", "m5", "metro", "bus", "tram", "treni", "sostituiti", "circolazione", "servizio", "orario"]
                skip_atm = ["abbonamenti", "biglietti", "cookie", "privacy", "lavora con noi", "chi siamo", "bandi", "gare", "area riservata"]

                for el in elements:
                    txt = re.sub(r'\s+', ' ', await el.inner_text()).strip()
                    if 22 <= len(txt) <= 280 and txt not in seen_atm:
                        t_low = txt.lower()
                        if any(k in t_low for k in keywords_atm) and not any(s in t_low for s in skip_atm):
                            seen_atm.add(txt)
                            start_atm, end_atm = extract_dates_from_text(txt, default_days_offset=1)
                            atm_list.append({
                                'city': 'Milano',
                                'sector': 'TPL',
                                'description': f"ATM Milano: {txt}",
                                'start_time': start_atm,
                                'end_time': end_atm,
                                'source_name': 'ATM Milano',
                                'source_url': atm_current_url
                            })
                            if len(atm_list) >= 3:
                                break
            except Exception as e:
                print(f"Errore ATM: {e}")

            # 3. TRENORD
            try:
                trenord_url = "https://www.trenord.it/news/trenord-informa/avvisi/"
                await page.goto(trenord_url, timeout=35000)
                await page.wait_for_timeout(3500)
                tr_current_url = page.url
                body_lines = [re.sub(r'\s+', ' ', l).strip() for l in (await page.locator("body").inner_text()).split('\n') if len(l.strip()) > 20]
                seen_tr = set()
                for line in body_lines:
                    if "sciopero" in line.lower() and line not in seen_tr:
                        seen_tr.add(line)
                        start_tr, end_tr = extract_dates_from_text(line, default_days_offset=2)
                        trenord_list.append({
                            'city': 'Milano / Lombardia',
                            'sector': 'Ferroviario',
                            'description': f"Trenord: {line[:260]}",
                            'start_time': start_tr,
                            'end_time': end_tr,
                            'source_name': 'Trenord',
                            'source_url': tr_current_url
                        })
                        if len(trenord_list) >= 2:
                            break
            except Exception as e:
                print(f"Errore Trenord: {e}")

            await browser.close()

        total_saved = 0
        for group in [mit_list, atm_list, trenord_list]:
            if not group:
                continue
            s_name = group[0]['source_name']
            s_url = group[0]['source_url']

            src = db.query(Source).filter(Source.name == s_name).first()
            if not src:
                src = Source(name=s_name, url=s_url)
                db.add(src)
                db.flush()
            else:
                src.url = s_url

            db.query(Strike).filter(Strike.source_id == src.id).delete()
            db.flush()

            for item in group:
                db.add(Strike(
                    city=item['city'],
                    sector=item['sector'],
                    description=item['description'],
                    start_time=item['start_time'],
                    end_time=item['end_time'],
                    source_id=src.id
                ))
                total_saved += 1

        # Aggiorna il log come SUCCESS
        log_entry.end_time = datetime.now()
        log_entry.status = "SUCCESS"
        log_entry.records_added = total_saved
        db.commit()
        print(f"--- SPIDER LOG SUCCESS: {total_saved} record salvati ---")

    except Exception as e:
        db.rollback()
        # Registra il fallimento nel log
        log_entry.end_time = datetime.now()
        log_entry.status = "FAILED"
        log_entry.error_message = str(e)
        db.commit()
        print(f"--- SPIDER LOG FAILED: {e} ---")
        raise e
    finally:
        db.close()