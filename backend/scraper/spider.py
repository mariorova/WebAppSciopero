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

NUM_TO_MESE_IT = {v: k for k, v in MESI_IT.items()}

def extract_dates_from_text(text: str, default_days_offset: int = 1):
    now = datetime.now()
    
    # 1. Formato GG/MM/AAAA
    slash_dates = re.findall(r'(\d{1,2})/(\d{1,2})/(\d{4})', text)
    if slash_dates:
        try:
            d1, m1, y1 = map(int, slash_dates[0])
            start_dt = datetime(y1, m1, d1, 0, 0, 0)
            if len(slash_dates) > 1:
                d2, m2, y2 = map(int, slash_dates[1])
                end_dt = datetime(y2, m2, d2, 23, 59, 59)
            else:
                end_dt = datetime(y1, m1, d1, 23, 59, 59)
            return start_dt, end_dt
        except ValueError:
            pass

    # 2. Formato testuale (es. "9 novembre", "dalle 21 del 20 novembre alle 20 del 21 novembre")
    text_low = text.lower()
    for nome_mese, num_mese in MESI_IT.items():
        if nome_mese in text_low:
            year = now.year + 1 if num_mese < now.month - 1 else now.year
            
            range_match = re.search(
                rf'\b(\d{{1,2}})\s*(?:{nome_mese})?\s*(?:e|-|/|\s+al\s+|\s+alle\s+\d{{1,2}}(?::\d{{2}})?\s+del\s+|\s+e\s+il\s+)\s*(\d{{1,2}})\s+{nome_mese}\b',
                text_low
            )
            if range_match:
                try:
                    d1, d2 = map(int, range_match.groups())
                    return datetime(year, num_mese, d1, 0, 0, 0), datetime(year, num_mese, d2, 23, 59, 59)
                except ValueError:
                    pass
            
            single_match = re.search(rf'\b(\d{{1,2}})\s+{nome_mese}\b', text_low)
            if single_match:
                try:
                    d1 = int(single_match.group(1))
                    return datetime(year, num_mese, d1, 0, 0, 0), datetime(year, num_mese, d1, 23, 59, 59)
                except ValueError:
                    pass

    start_fallback = now + timedelta(days=default_days_offset)
    return start_fallback, start_fallback.replace(hour=23, minute=59, second=59)

def classify_sector(raw_sector: str, full_text: str) -> str:
    combined = f"{raw_sector} {full_text}".lower()
    if any(k in combined for k in ["sciopero generale", "plurisettoriale", "tutti i settori", "pubblico impiego"]):
        return "Sciopero Generale"
    if any(k in combined for k in ["aereo", "aeroport", "enav", "aviation", "volo", "voli", "malpensa", "linate", "marco polo", "fiumicino", "ita airways", "easyjet", "ryanair", "wizz"]):
        return "Aereo"
    if any(k in combined for k in ["ferrovi", "trenitalia", "trenord", "italo", "ntv", "rfi", "treni", "fs", "ferrovie", "rotaia"]):
        return "Ferroviario"
    if any(k in combined for k in ["marittim", "portual", "porti", "navigazione", "traghett", "navi"]):
        return "Marittimo"
    if any(k in combined for k in ["trasporto pubblico locale", "tpl", "atm", "atac", "amt", "atvo", "amtab", "eav", "anm", "autobus", "bus", "metro", "tram", "mezzi pubblici", "trasporto pubblico"]):
        return "TPL"
    if any(k in combined for k in ["autostrad", "stradal", "viabilit", "caselli"]):
        return "Autostrade / Viabilità"
    if any(k in combined for k in ["telecomunicazion", "iren", "multiservizi", "igiene", "energia", "scuola"]):
        return "Servizi / Multisettore"
    return "Trasporto Pubblico"

def find_city(description: str) -> str:
    desc_low = description.lower()
    cities = [
        "Milano", "Roma", "Napoli", "Torino", "Bologna", "Firenze", "Pisa", "Bari", 
        "Venezia", "Genova", "Palermo", "Catania", "Verona", "Reggio Emilia", "Rimini",
        "Lombardia", "Lazio", "Toscana", "Campania", "Piemonte", "Emilia-Romagna", "Puglia", "Sicilia", "Veneto"
    ]
    found = [c for c in cities if re.search(rf'\b{c}\b', description, re.IGNORECASE)]
    if "malpensa" in desc_low or "linate" in desc_low or "atm" in desc_low:
        if "Milano" not in found:
            found.insert(0, "Milano")
    if "amt" in desc_low and "Genova" not in found:
        found.append("Genova")
    if ("atvo" in desc_low or "marco polo" in desc_low) and "Venezia" not in found:
        found.append("Venezia")
    if "amtab" in desc_low and "Bari" not in found:
        found.append("Bari")

    if found:
        return " / ".join(dict.fromkeys(found[:2]))
    return "Nazionale"

async def find_sky_monthly_articles(page) -> list[str]:
    now = datetime.now()
    mese_corrente_nome = NUM_TO_MESE_IT[now.month]
    anno_corrente = now.year
    
    monthly_urls = []
    other_sky_urls = []

    # 1. Controlla gli URL diretti del calendario mensile di Sky TG24 Cronaca (giorni 01..10 del mese)
    for day in range(1, 10):
        cand_url = f"https://tg24.sky.it/cronaca/{anno_corrente}/{now.month:02d}/{day:02d}/scioperi-{mese_corrente_nome}-{anno_corrente}"
        try:
            resp = await page.goto(cand_url, timeout=15000)
            if resp and resp.status == 200 and f"scioperi-{mese_corrente_nome}" in page.url.lower():
                if page.url not in monthly_urls:
                    monthly_urls.append(page.url)
                break
        except Exception:
            continue

    # 2. Scansiona anche /tag/sciopero e /cronaca per trovare eventuali articoli di mesi futuri o pubblicati in altri giorni
    for disc_url in ["https://tg24.sky.it/tag/sciopero", "https://tg24.sky.it/cronaca"]:
        try:
            await page.goto(disc_url, timeout=25000)
            await page.wait_for_timeout(1500)
            links = await page.locator("a[href*='/cronaca/']").all()
            for a in links:
                href = await a.get_attribute("href")
                if not href:
                    continue
                if href.startswith("/"):
                    href = f"https://tg24.sky.it{href}"
                href_low = href.lower()
                if "/cronaca/" in href_low and "scioper" in href_low:
                    if any(f"scioperi-{m}" in href_low for m in MESI_IT.keys()):
                        if href not in monthly_urls:
                            monthly_urls.append(href)
                    else:
                        if href not in other_sky_urls and href not in monthly_urls:
                            other_sky_urls.append(href)
        except Exception as e:
            print(f"[SKY DISCOVERY] Errore scansione {disc_url}: {e}")

    return (monthly_urls + other_sky_urls)[:3]

async def extract_sky_cards_from_article(page, art_url: str, now_threshold: datetime) -> list[dict]:
    """
    Estrae tutte le schede (1/10 ... 10/10) dall'articolo mensile di Sky TG24
    accoppiando ogni titolo h2/h3 con tutti i paragrafi che lo seguono prima del prossimo h2/h3.
    """
    extracted = []
    seen_titles = set()

    await page.goto(art_url, timeout=35000)
    await page.wait_for_timeout(2000)

    # Scroll completo della pagina per assicurarsi che tutte le 10 schede siano renderizzate
    for _ in range(8):
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(300)

    # Estrazione lineare a prova di annidamento: scorre tutti gli h2, h3, p, li in ordine di apparizione nel DOM
    cards_data = await page.evaluate("""() => {
        const results = [];
        const elements = Array.from(document.querySelectorAll('h2, h3, p, li'));
        let currentTitle = null;
        let currentBody = [];

        const skipTitles = ['quello che devi sapere', 'introduzione', 'ultime notizie', 'potrebbe interessarti'];

        for (const el of elements) {
            const tag = el.tagName.toUpperCase();
            const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
            if (!text) continue;

            if (tag === 'H2' || tag === 'H3') {
                if (currentTitle && currentBody.length > 0) {
                    results.push({ title: currentTitle, body: currentBody.join(' ') });
                }
                if (skipTitles.includes(text.toLowerCase())) {
                    currentTitle = null;
                    currentBody = [];
                } else {
                    currentTitle = text;
                    currentBody = [];
                }
            } else if (currentTitle) {
                if (
                    !text.startsWith('Per approfondire:') &&
                    !text.startsWith('Leggi anche:') &&
                    !/^\\d+\\s*\\/\\s*\\d+$/.test(text) &&
                    !text.includes('Sky TG24 tutti i diritti') &&
                    text.length > 15
                ) {
                    if (!currentBody.includes(text)) {
                        currentBody.push(text);
                    }
                }
            }
        }
        if (currentTitle && currentBody.length > 0) {
            results.push({ title: currentTitle, body: currentBody.join(' ') });
        }
        return results;
    }""")

    print(f"[SKY TG24] Trovate {len(cards_data)} sezioni con titolo in {art_url}")

    for card in cards_data:
        title = card.get("title", "").strip()
        body = card.get("body", "").strip()
        combined_text = f"{title} - {body}"
        comb_low = combined_text.lower()

        # Verifica che nel titolo o nel corpo ci sia una data con il nome di un mese (es. "9 novembre", "20 novembre")
        has_month_date = any(
            re.search(rf'\b\d{{1,2}}\s+{m}\b', comb_low) for m in MESI_IT.keys()
        )
        has_kw = any(kw in comb_low for kw in [
            "sciopero", "mobilitazione", "agitazione", "astensione", "stop", 
            "fermeranno", "lavoratori", "personale", "sindacat", "orario", "ore", "fasce", "garanzia"
        ])

        if has_month_date and has_kw and title not in seen_titles:
            has_title_date = any(re.search(rf'\b\d{{1,2}}\s+{m}\b', title.lower()) for m in MESI_IT.keys())
            s_start, s_end = extract_dates_from_text(title if has_title_date else combined_text, default_days_offset=2)

            if s_end >= now_threshold:
                seen_titles.add(title)
                clean_desc = f"Sky TG24 • {title}: {body}"
                extracted.append({
                    'city': find_city(combined_text),
                    'sector': classify_sector("", combined_text),
                    'description': clean_desc[:295],
                    'start_time': s_start,
                    'end_time': s_end,
                    'source_name': 'Sky TG24 Cronaca',
                    'source_url': art_url
                })

    return extracted

async def scrape_leggo_articles(page, now_threshold: datetime) -> list[dict]:
    """
    Cerca su Leggo.it gli articoli dedicati agli scioperi del mese corrente/futuro ed estrae i singoli scioperi.
    """
    leggo_list = []
    now = datetime.now()
    mese_corrente_nome = NUM_TO_MESE_IT[now.month]
    
    try:
        search_urls = [
            f"https://www.leggo.it/search/?keyword=scioperi+{mese_corrente_nome}",
            "https://www.leggo.it/italia/"
        ]
        article_links = []

        for s_url in search_urls:
            try:
                await page.goto(s_url, timeout=25000)
                await page.wait_for_timeout(2000)
                links = await page.locator("a[href*='scioper']").all()
                for a in links:
                    href = await a.get_attribute("href")
                    if not href:
                        continue
                    if href.startswith("/"):
                        href = f"https://www.leggo.it{href}"
                    if "leggo.it" in href and href not in article_links and ".html" in href:
                        article_links.append(href)
            except Exception:
                continue

        seen_leggo = set()
        for art_url in article_links[:3]:
            try:
                await page.goto(art_url, timeout=25000)
                await page.wait_for_timeout(1500)
                paragraphs = await page.locator("article p, article li, .corpo-articolo p, .article-body p").all()
                for p_el in paragraphs:
                    txt = re.sub(r'\s+', ' ', await p_el.inner_text()).strip()
                    if 40 <= len(txt) <= 450 and txt not in seen_leggo:
                        t_low = txt.lower()
                        has_month_date = any(re.search(rf'\b\d{{1,2}}\s+{m}\b', t_low) for m in MESI_IT.keys())
                        if has_month_date and any(k in t_low for k in ["sciopero", "stop", "mobilitazione", "agitazione", "treni", "mezzi", "voli"]):
                            s_start, s_end = extract_dates_from_text(txt, default_days_offset=2)
                            if s_end >= now_threshold:
                                seen_leggo.add(txt)
                                leggo_list.append({
                                    'city': find_city(txt),
                                    'sector': classify_sector("", txt),
                                    'description': f"Leggo.it • {txt[:275]}",
                                    'start_time': s_start,
                                    'end_time': s_end,
                                    'source_name': 'Leggo.it Cronaca',
                                    'source_url': art_url
                                })
                                if len(leggo_list) >= 8:
                                    break
            except Exception:
                continue
    except Exception as e:
        print(f"Errore Leggo.it: {e}")

    return leggo_list

async def run_spider():
    db: Session = SessionLocal()
    log_entry = SpiderLog(status="RUNNING", records_added=0)
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    mit_list, atm_list, trenord_list, sky_list, leggo_list = [], [], [], [], []

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

            # 1. PORTALE MIT
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

            # 2. ATM MILANO
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

            # 4. SKY TG24 CRONACA (Tutte le schede dell'articolo mensile)
            now_threshold = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            try:
                sky_article_urls = await find_sky_monthly_articles(page)
                print(f"[SKY TG24] Articoli individuati da scansionare: {sky_article_urls}")

                for art_url in sky_article_urls:
                    try:
                        cards = await extract_sky_cards_from_article(page, art_url, now_threshold)
                        for c in cards:
                            if not any(existing['description'] == c['description'] for existing in sky_list):
                                sky_list.append(c)
                    except Exception as e_art:
                        print(f"[SKY TG24] Errore lettura articolo {art_url}: {e_art}")

                print(f"[SKY TG24] Scioperi estratti dalle schede: {len(sky_list)}")
            except Exception as e:
                print(f"Errore Sky TG24: {e}")

            # 5. LEGGO.IT
            try:
                leggo_list = await scrape_leggo_articles(page, now_threshold)
                print(f"[LEGGO.IT] Scioperi estratti: {len(leggo_list)}")
            except Exception as e:
                print(f"Errore Leggo.it: {e}")

            await browser.close()

        # Salvataggio nel database per ciascuna fonte
        total_saved = 0
        for group in [mit_list, atm_list, trenord_list, sky_list, leggo_list]:
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

        log_entry.end_time = datetime.now()
        log_entry.status = "SUCCESS"
        log_entry.records_added = total_saved
        db.commit()
        print(f"--- SPIDER MULTI-FONTE COMPLETATO: {total_saved} record salvati ---")

    except Exception as e:
        db.rollback()
        log_entry.end_time = datetime.now()
        log_entry.status = "FAILED"
        log_entry.error_message = str(e)
        db.commit()
        print(f"--- ERRORE CRITICO SPIDER: {e} ---")
        raise e
    finally:
        db.close()