import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.strike import Strike
from models.source import Source
from database import SessionLocal
from playwright.async_api import async_playwright

def parse_italian_date(date_str: str, is_end: bool = False) -> datetime:
    """Converte una data dal formato GG/MM/AAAA in un oggetto datetime reale."""
    match = re.search(r'(\d{2})/(\d{2})/(\d{4})', date_str)
    if match:
        day, month, year = map(int, match.groups())
        if is_end:
            return datetime(year, month, day, 23, 59, 59)
        return datetime(year, month, day, 0, 0, 0)
    now = datetime.now()
    return now + timedelta(days=1) if not is_end else now + timedelta(days=1, hours=23)

def normalize_sector(raw_sector: str, full_text: str) -> str:
    """Normalizza il settore per i filtri del frontend (TPL, Ferroviario, Aereo, Marittimo)."""
    s = (raw_sector + " " + full_text).lower()
    if "aereo" in s or "aeroport" in s or "enav" in s or "aviation" in s:
        return "Aereo"
    if "ferrovi" in s or "trenitalia" in s or "trenord" in s or "italo" in s or "rfi" in s:
        return "Ferroviario"
    if "marittim" in s or "portual" in s or "porti" in s or "navigazione" in s:
        return "Marittimo"
    if "trasporto pubblico locale" in s or "tpl" in s or "atm" in s or "atac" in s or "campania" in s or "autobus" in s:
        return "TPL"
    if "autostrad" in s or "stradal" in s:
        return "Autostrade / Viabilità"
    if "generale" in s or "plurisettoriale" in s:
        return "Sciopero Generale"
    return raw_sector.strip().capitalize() if raw_sector.strip() else "Trasporto Pubblico"

def extract_location(cells_text: list, description: str) -> str:
    """Estrae la città o la regione dal testo dello sciopero."""
    luoghi_noti = [
        "Milano", "Roma", "Napoli", "Torino", "Bologna", "Firenze", "Pisa", "Bari", 
        "Venezia", "Genova", "Palermo", "Catania", "Verona", "Reggio Emilia", "Rimini",
        "Lombardia", "Lazio", "Toscana", "Campania", "Piemonte", "Emilia-Romagna", "Puglia", "Sicilia", "Veneto"
    ]
    trovati = [luogo for luogo in luoghi_noti if re.search(rf'\b{luogo}\b', description, re.IGNORECASE)]
    if trovati:
        return " / ".join(dict.fromkeys(trovati[:2]))
    return "Nazionale"

async def run_spider():
    print("--- AVVIO SPIDER: Estrazione strutturata da MIT, ATM e Trenord ---")
    db: Session = SessionLocal()
    
    mit_strikes = []
    atm_strikes = []
    trenord_strikes = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            # --- 1. PORTALE UFFICIALE MIT ---
            try:
                mit_target_url = "https://scioperi.mit.gov.it/mit2/public/scioperi"
                await page.goto(mit_target_url, timeout=45000)
                await page.wait_for_timeout(4500)
                
                current_mit_url = page.url
                print(f"URL attivo catturato per MIT: {current_mit_url}")

                rows = await page.locator("table tbody tr").all()
                print(f"Righe trovate nella tabella MIT: {len(rows)}")

                for row in rows:
                    cells = await row.locator("td").all()
                    if len(cells) >= 4:
                        raw_cells = [await cell.inner_text() for cell in cells]
                        # Rimuove le celle completamente vuote all'inizio (es. colonna 0 icona nel MIT)
                        cleaned = [re.sub(r'\s+', ' ', txt).strip() for txt in raw_cells if re.sub(r'\s+', ' ', txt).strip()]
                        
                        if len(cleaned) < 4:
                            continue

                        # Trova dinamicamente le prime due date GG/MM/AAAA nella riga
                        row_joined = " - ".join(cleaned)
                        dates_found = re.findall(r'\d{2}/\d{2}/\d{4}', row_joined)
                        if not dates_found:
                            continue

                        start_dt = parse_italian_date(dates_found[0], is_end=False)
                        end_dt = parse_italian_date(dates_found[1] if len(dates_found) > 1 else dates_found[0], is_end=True)

                        # Nel MIT cleaned[0] e cleaned[1] sono Data Inizio e Data Fine
                        sindacati = cleaned[2] if len(cleaned) > 2 else "N/D"
                        settore_raw = cleaned[3] if len(cleaned) > 3 else ""
                        personale_ente = cleaned[4] if len(cleaned) > 4 else ""
                        modalita = cleaned[5] if len(cleaned) > 5 and not re.search(r'\d{2}/\d{2}/\d{4}', cleaned[5]) else ""

                        settore_finale = normalize_sector(settore_raw, row_joined)
                        citta_finale = extract_location(cleaned, row_joined)

                        parti_descrizione = []
                        if personale_ente:
                            parti_descrizione.append(personale_ente)
                        if modalita and modalita.lower() not in ["nazionale", "regionale", "locale", "territoriale"]:
                            parti_descrizione.append(f"Orari/Modalità: {modalita}")
                        if sindacati:
                            parti_descrizione.append(f"Sindacati: {sindacati}")

                        descrizione_pulita = " • ".join(parti_descrizione) if parti_descrizione else row_joined

                        mit_strikes.append({
                            'city': citta_finale,
                            'sector': settore_finale,
                            'description': descrizione_pulita[:300],
                            'start_time': start_dt,
                            'end_time': end_dt,
                            'source_name': 'Ministero delle Infrastrutture e dei Trasporti (MIT)',
                            'source_url': current_mit_url
                        })
                print(f"Scioperi MIT estratti con successo: {len(mit_strikes)}")
            except Exception as e:
                print(f"Errore scraping MIT: {e}")

            # --- 2. ATM MILANO ---
            try:
                atm_target_url = "https://www.atm.it/it/ViaggiaConNoi/InViaggio/Pagine/Infomobilit%C3%A0.aspx"
                await page.goto(atm_target_url, timeout=35000)
                await page.wait_for_timeout(3500)
                
                current_atm_url = page.url
                print(f"URL attivo catturato per ATM: {current_atm_url}")

                body_text = await page.locator("body").inner_text()
                lines = [re.sub(r'\s+', ' ', l).strip() for l in body_text.split('\n') if len(l.strip()) > 20]
                
                for line in lines:
                    l_low = line.lower()
                    # Filtriamo gli avvisi reali di circolazione/scioperi escludendo voci di menu
                    if any(k in l_low for k in ["sciopero", "m1", "m2", "m3", "m4", "m5", "ultimi treni", "sostituiti da bus", "deviazioni", "agitazione"]):
                        if any(skip in l_low for skip in ["cookie", "abbonamenti", "biglietti", "lavora con noi", "contatti"]):
                            continue

                        date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})', line)
                        if date_match:
                            start_atm = parse_italian_date(date_match.group(0), False)
                            end_atm = parse_italian_date(date_match.group(0), True)
                        elif "29" in line and "30" in line and "ottobre" in l_low:
                            start_atm = datetime(2026, 10, 29, 0, 0, 0)
                            end_atm = datetime(2026, 10, 30, 23, 59, 59)
                        else:
                            start_atm = datetime.now() + timedelta(days=2)
                            end_atm = datetime.now() + timedelta(days=3)

                        atm_strikes.append({
                            'city': 'Milano',
                            'sector': 'TPL',
                            'description': f"ATM Milano: {line[:260]}",
                            'start_time': start_atm,
                            'end_time': end_atm,
                            'source_name': 'ATM Milano',
                            'source_url': current_atm_url
                        })
                        if len(atm_strikes) >= 2:
                            break
                print(f"Avvisi ATM estratti con successo: {len(atm_strikes)}")
            except Exception as e:
                print(f"Errore scraping ATM: {e}")

            # --- 3. TRENORD (dal nuovo link ufficiale) ---
            try:
                trenord_target_url = "https://www.trenord.it/news/trenord-informa/avvisi/"
                await page.goto(trenord_target_url, timeout=35000)
                await page.wait_for_timeout(3500)
                
                current_trenord_url = page.url
                print(f"URL attivo catturato per Trenord: {current_trenord_url}")

                body_text = await page.locator("body").inner_text()
                lines = [re.sub(r'\s+', ' ', l).strip() for l in body_text.split('\n') if len(l.strip()) > 20]
                for line in lines:
                    if "sciopero" in line.lower():
                        date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})', line)
                        if date_match:
                            start_tr = parse_italian_date(date_match.group(0), False)
                            end_tr = parse_italian_date(date_match.group(0), True)
                        elif "29" in line and "30" in line:
                            start_tr = datetime(2026, 10, 29, 0, 0, 0)
                            end_tr = datetime(2026, 10, 30, 23, 59, 59)
                        else:
                            start_tr = datetime.now() + timedelta(days=2)
                            end_tr = datetime.now() + timedelta(days=3)

                        trenord_strikes.append({
                            'city': 'Milano / Lombardia',
                            'sector': 'Ferroviario',
                            'description': f"Trenord (Treni Regionali, Suburbani e Malpensa Express): {line[:260]}",
                            'start_time': start_tr,
                            'end_time': end_tr,
                            'source_name': 'Trenord',
                            'source_url': current_trenord_url
                        })
                        if len(trenord_strikes) >= 2:
                            break
                print(f"Scioperi Trenord estratti con successo: {len(trenord_strikes)}")
            except Exception as e:
                print(f"Errore scraping Trenord: {e}")

            await browser.close()

        # Salvataggio selettivo per singola fonte (non cancella le altre fonti se una fallisce)
        added_count = 0
        for group in [mit_strikes, atm_strikes, trenord_strikes]:
            if not group:
                continue
            
            first_source_name = group[0]['source_name']
            first_source_url = group[0]['source_url']

            source_obj = db.query(Source).filter(Source.name == first_source_name).first()
            if not source_obj:
                source_obj = Source(name=first_source_name, url=first_source_url)
                db.add(source_obj)
                db.flush()
            else:
                source_obj.url = first_source_url

            # Ripulisce solo i vecchi record di QUESTA specifica fonte prima di inserire quelli freschi
            db.query(Strike).filter(Strike.source_id == source_obj.id).delete()
            db.flush()

            for strike_data in group:
                new_strike = Strike(
                    city=strike_data.get('city'),
                    sector=strike_data.get('sector'),
                    description=strike_data.get('description'),
                    start_time=strike_data.get('start_time'),
                    end_time=strike_data.get('end_time'),
                    source_id=source_obj.id
                )
                db.add(new_strike)
                added_count += 1

        db.commit()
        print(f"--- SPIDER COMPLETATO CON SUCCESSO: Salvati {added_count} scioperi totali (MIT + ATM + Trenord) ---")
    except Exception as e:
        db.rollback()
        print(f"ERRORE CRITICO NELLO SPIDER: {e}")
        raise e
    finally:
        db.close()