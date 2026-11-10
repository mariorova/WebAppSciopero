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
MESI_REGEX = "|".join(MESI_IT.keys())

def smart_truncate(text: str, max_len: int = 290) -> str:
    """Taglia il testo senza mai spezzare le parole a metà."""
    text = text.strip()
    if len(text) <= max_len:
        return text
    cut = text[:max_len].rsplit(' ', 1)[0].rstrip('.,;:-«"')
    return f"{cut}..."

def clean_atm_pub_date(text: str) -> str:
    """Rimuove il suffisso della data di pubblicazione di ATM (es. ' - 09/11') alla fine del titolo."""
    return re.sub(r'\s*[-–]\s*\d{2}/\d{2}\s*$', '', text).strip()

def extract_dates_from_text(text: str, default_days_offset: int = 1, allow_fallback: bool = True):
    now = datetime.now()
    
    # Rimuove eventuali suffissi di pubblicazione "- GG/MM" prima di cercare la data dello sciopero
    cleaned_text = clean_atm_pub_date(text)

    # 1. Formato GG/MM/AAAA
    slash_dates = re.findall(r'(\d{1,2})/(\d{1,2})/(\d{4})', cleaned_text)
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

    # 2. Formato testuale (es. "13 novembre", "dalle 21 del 20 novembre alle 20 del 21 novembre")
    text_low = cleaned_text.lower()
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

    # 3. Se non c'è una data esplicita ma cita il giorno della settimana prossimo (es. "venerdì" su ATM)
    weekdays_map = {
        "lunedì": 0, "martedì": 1, "mercoledì": 2, "giovedì": 3,
        "venerdì": 4, "sabato": 5, "domenica": 6
    }
    for wd_name, wd_num in weekdays_map.items():
        if wd_name in text_low:
            days_ahead = (wd_num - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            target_day = (now + timedelta(days=days_ahead)).replace(hour=0, minute=0, second=0, microsecond=0)
            return target_day, target_day.replace(hour=23, minute=59, second=59)

    if not allow_fallback:
        return None, None

    start_fallback = (now + timedelta(days=default_days_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
    return start_fallback, start_fallback.replace(hour=23, minute=59, second=59)

def split_multi_date_paragraph(text: str, context_prefix: str = "") -> list[str]:
    date_pattern = re.compile(rf'\b\d{{1,2}}\s+(?:{MESI_REGEX})\b', re.IGNORECASE)
    all_dates = date_pattern.findall(text)
    
    unique_dates = list(dict.fromkeys([d.lower() for d in all_dates]))
    if len(unique_dates) <= 1:
        return [f"{context_prefix} {text}".strip() if context_prefix else text]

    sentences = [s.strip() for s in re.split(r'(?<=\.)\s+', text) if s.strip()]
    intro_context = context_prefix
    chunks = []
    
    for s in sentences:
        s_dates = date_pattern.findall(s)
        if not s_dates:
            if not intro_context and len(s) < 140:
                intro_context = s.rstrip('.')
            elif chunks:
                chunks[-1] = f"{chunks[-1]} {s}"
        else:
            if intro_context and intro_context.lower() not in s.lower():
                chunks.append(f"{intro_context}: {s}")
            else:
                chunks.append(s)

    return chunks if chunks else [text]

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
    if any(k in combined for k in ["autostrad", "stradal", "viabilit", "caselli", "logistica"]):
        return "Autostrade / Viabilità"
    if any(k in combined for k in ["telecomunicazion", "iren", "multiservizi", "igiene", "energia", "scuola"]):
        return "Servizi / Multisettore"
    return "Trasporto Pubblico"

def find_city(description: str) -> str:
    desc_low = description.lower()
    cities = [
        "Milano", "Roma", "Napoli", "Torino", "Bologna", "Firenze", "Pisa", "Bari", 
        "Venezia", "Genova", "Palermo", "Catania", "Verona", "Reggio Emilia", "Rimini",
        "Volla", "Lombardia", "Lazio", "Toscana", "Campania", "Piemonte", "Emilia-Romagna", "Puglia", "Sicilia", "Veneto"
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
    if "volla" in desc_low or "(na)" in desc_low:
        if "Napoli" not in found:
            found = ["Napoli"]

    if found:
        return " / ".join(dict.fromkeys(found[:2]))
    return "Nazionale"

async def find_sky_monthly_articles(page) -> list[str]:
    now = datetime.now()
    mese_corrente_nome = NUM_TO_MESE_IT[now.month]
    anno_corrente = now.year
    
    monthly_urls = []
    other_sky_urls = []

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
    extracted = []
    seen_keys = set()

    await page.goto(art_url, timeout=40000)
    await page.wait_for_timeout(2000)

    for btn_selector in [
        "button:has-text('Accetta')",
        "button:has-text('Accetto')",
        "#onetrust-accept-btn-handler",
        ".iubenda-cs-accept-btn"
    ]:
        try:
            btn = page.locator(btn_selector).first
            if await btn.is_visible(timeout=800):
                await btn.click()
                await page.wait_for_timeout(1000)
                break
        except Exception:
            pass

    for _ in range(12):
        await page.mouse.wheel(0, 700)
        await page.wait_for_timeout(350)

    all_texts = []
    for frame in page.frames:
        try:
            t = await frame.evaluate("() => document.body ? document.body.innerText : ''")
            if t and len(t) > 100:
                all_texts.append(t)
        except Exception:
            pass

    try:
        raw_html = await page.content()
        html_clean = re.sub(r'<[^>]+>', '\n', raw_html)
        all_texts.append(html_clean)
    except Exception:
        pass

    full_combined_dump = "\n".join(all_texts)

    lines = [re.sub(r'\s+', ' ', l).strip() for l in full_combined_dump.splitlines()]
    lines = [l for l in lines if l]

    header_pattern = re.compile(
        rf'^([A-Za-z0-9À-ÿ\s\.\'/,\(\)]+?)\s*[-–—]\s*(\d{{1,2}}\s+(?:{MESI_REGEX}))$',
        re.IGNORECASE
    )
    counter_pattern = re.compile(r'^\d{1,2}\s*/\s*\d{1,2}$')

    cards_parsed = []
    current_title = None
    current_body = []

    for line in lines:
        if counter_pattern.match(line):
            if current_title and current_body:
                cards_parsed.append((current_title, " ".join(current_body)))
            current_title = None
            current_body = []
            continue

        m_head = header_pattern.match(line)
        if m_head and len(line) <= 85:
            if current_title and current_body:
                cards_parsed.append((current_title, " ".join(current_body)))
            current_title = line
            current_body = []
            continue

        if current_title:
            if (
                line.lower().startswith("per approfondire")
                or line.lower().startswith("leggi anche")
                or line.lower() in ["pubblicità", "quello che devi sapere", "condividi"]
            ):
                continue
            if len(line) >= 20 and line not in current_body:
                current_body.append(line)

    if current_title and current_body:
        cards_parsed.append((current_title, " ".join(current_body)))

    print(f"[SKY TG24] Schede interattive trovate: {len(cards_parsed)}")

    for title, body in cards_parsed:
        key = title.lower().strip()
        if key in seen_keys:
            continue

        combined_text = f"{title}: {body}"
        s_start, s_end = extract_dates_from_text(title, allow_fallback=False)

        if s_start and s_end and s_end >= now_threshold:
            seen_keys.add(key)
            clean_desc = smart_truncate(f"{title}: {body}", 290)
            extracted.append({
                'city': find_city(combined_text),
                'sector': classify_sector(title, combined_text),
                'description': clean_desc,
                'start_time': s_start,
                'end_time': s_end,
                'source_name': 'Sky TG24 Cronaca',
                'source_url': art_url
            })

    return extracted

async def scrape_leggo_articles(page, now_threshold: datetime) -> list[dict]:
    """
    Estrae da Leggo.it solo veri scioperi dei trasporti/servizi che abbiano una data esplicita
    (giorno + mese) e parole chiave strettamente legate allo sciopero, scartando opinioni politiche o sindacati di polizia.
    """
    leggo_list = []
    now = datetime.now()
    mese_corrente_nome = NUM_TO_MESE_IT[now.month]
    
    # Parole da escludere (politica, forze dell'ordine, cronaca giudiziaria)
    skip_words = [
        "siulp", "divise", "polizia", "carabinieri", "governo", "manovra",
        "meloni", "salvini", "previdenza dedicata", "privilegio", "processo"
    ]
    # Deve contenere almeno un termine legato a scioperi di trasporto/servizi
    transport_words = [
        "treni", "trenitalia", "italo", "trenord", "ferrovi", "aerei", "voli",
        "enav", "aeroport", "mezzi", "autobus", "metro", "tram", "atm", "atac",
        "tpl", "trasporto", "trasporti", "sciopero generale", "sciopero nazionale", "sciopero locale"
    ]

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
                    raw_txt = re.sub(r'\s+', ' ', await p_el.inner_text()).strip()
                    if len(raw_txt) < 40 or len(raw_txt) > 800:
                        continue

                    if any(sw in raw_txt.lower() for sw in skip_words):
                        continue

                    sub_items = split_multi_date_paragraph(raw_txt)

                    for sub_txt in sub_items:
                        if len(sub_txt) < 30 or sub_txt in seen_leggo:
                            continue
                        t_low = sub_txt.lower()

                        if any(sw in t_low for sw in skip_words):
                            continue

                        # Esige una data esplicita (es. "6 novembre", "21 novembre") E un riferimento a sciopero + trasporti
                        has_month_date = any(re.search(rf'\b\d{{1,2}}\s+{m}\b', t_low) for m in MESI_IT.keys())
                        has_strike_word = any(k in t_low for k in ["sciopero", "stop", "mobilitazione", "agitazione", "incrociano le braccia"])
                        has_transport_word = any(tw in t_low for tw in transport_words)

                        if has_month_date and has_strike_word and has_transport_word:
                            s_start, s_end = extract_dates_from_text(sub_txt, allow_fallback=False)
                            if s_start and s_end and s_end >= now_threshold:
                                seen_leggo.add(sub_txt)
                                leggo_list.append({
                                    'city': find_city(sub_txt),
                                    'sector': classify_sector("", sub_txt),
                                    'description': smart_truncate(sub_txt, 285),
                                    'start_time': s_start,
                                    'end_time': s_end,
                                    'source_name': 'Leggo.it Cronaca',
                                    'source_url': art_url
                                })
                                if len(leggo_list) >= 12:
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
    now_threshold = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

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
                        start_dt, end_dt = extract_dates_from_text(row_str, allow_fallback=False)
                        if not start_dt or not end_dt:
                            continue
                        sindacati = clean_cells[2] if len(clean_cells) > 2 else "N/D"
                        settore_mit = clean_cells[3] if len(clean_cells) > 3 else ""
                        ente = clean_cells[4] if len(clean_cells) > 4 else ""
                        modalita = clean_cells[5] if len(clean_cells) > 5 and not re.search(r'\d{2}/\d{2}/\d{4}', clean_cells[5]) else ""

                        info_parts = [p for p in [ente, f"Orari/Modalità: {modalita}" if modalita else "", f"Sindacati: {sindacati}"] if p]
                        mit_list.append({
                            'city': find_city(row_str),
                            'sector': classify_sector(settore_mit, row_str),
                            'description': smart_truncate(" • ".join(info_parts), 295),
                            'start_time': start_dt,
                            'end_time': end_dt,
                            'source_name': 'Ministero delle Infrastrutture e dei Trasporti (MIT)',
                            'source_url': mit_url
                        })
            except Exception as e:
                print(f"Errore MIT: {e}")

            # 2. ATM MILANO (Solo veri scioperi, mai normali deviazioni tram/bus!)
            try:
                await page.goto("https://www.atm.it/it/Pagine/default.aspx", timeout=35000)
                await page.wait_for_timeout(3500)
                atm_current_url = page.url
                links = await page.locator("a").all()
                seen_atm = set()
                skip_atm = ["abbonamenti", "biglietti", "cookie", "privacy", "lavora con noi", "chi siamo", "bandi", "gare", "area riservata", "deviazioni", "cambiamenti al servizio"]

                atm_candidates = []
                for a in links:
                    txt = re.sub(r'\s+', ' ', await a.inner_text()).strip()
                    href = await a.get_attribute("href") or ""
                    cleaned_txt = clean_atm_pub_date(txt)
                    if 18 <= len(cleaned_txt) <= 280 and cleaned_txt not in seen_atm:
                        t_low = cleaned_txt.lower()
                        # Cattura SOLO se parla esplicitamente di SCIOPERO o SINDACATI
                        if "sciopero" in t_low and not any(s in t_low for s in skip_atm):
                            seen_atm.add(cleaned_txt)
                            full_href = f"https://www.atm.it{href}" if href.startswith("/") else (href if href.startswith("http") else atm_current_url)
                            atm_candidates.append((cleaned_txt, full_href))

                for cleaned_txt, full_href in atm_candidates[:3]:
                    # Se il titolo nella home di ATM è troncato coi puntini (es. "Sciopero annunciato da AL Cobas venerdì..."),
                    # visitiamo la pagina interna dell'avviso per leggere il testo completo e la data esatta!
                    final_txt = cleaned_txt
                    if full_href != atm_current_url and ("..." in cleaned_txt or not any(m in cleaned_txt.lower() for m in MESI_IT.keys())):
                        try:
                            await page.goto(full_href, timeout=20000)
                            await page.wait_for_timeout(1500)
                            page_title = await page.locator("h1, h2, .atm-title").first.inner_text()
                            page_body = await page.locator("#ctl00_PlaceHolderMain_ctl01__ControlWrapper_RichHtmlField, main, article, body").first.inner_text()
                            combined_atm = re.sub(r'\s+', ' ', f"{page_title}: {page_body}").strip()
                            if len(combined_atm) > 30:
                                final_txt = combined_atm
                        except Exception:
                            pass

                    start_atm, end_atm = extract_dates_from_text(final_txt, allow_fallback=False)
                    if start_atm and end_atm and end_atm >= now_threshold:
                        atm_list.append({
                            'city': 'Milano',
                            'sector': 'TPL',
                            'description': smart_truncate(f"ATM Milano: {clean_atm_pub_date(final_txt)}", 285),
                            'start_time': start_atm,
                            'end_time': end_atm,
                            'source_name': 'ATM Milano',
                            'source_url': full_href
                        })
            except Exception as e:
                print(f"Errore ATM: {e}")

            # 3. TRENORD
            try:
                trenord_url = "https://www.trenord.it/news/trenord-informa/avvisi/"
                await page.goto(trenord_url, timeout=35000)
                await page.wait_for_timeout(3500)
                tr_current_url = page.url
                body_lines = [re.sub(r'\s+', ' ', l).strip() for l in (await page.locator("body").inner_text()).split('\n') if len(l.strip()) > 25]
                seen_tr = set()
                for line in body_lines:
                    if "sciopero" in line.lower() and line not in seen_tr:
                        start_tr, end_tr = extract_dates_from_text(line, allow_fallback=False)
                        if start_tr and end_tr and end_tr >= now_threshold:
                            seen_tr.add(line)
                            trenord_list.append({
                                'city': 'Milano / Lombardia',
                                'sector': 'Ferroviario',
                                'description': smart_truncate(f"Trenord: {line}", 285),
                                'start_time': start_tr,
                                'end_time': end_tr,
                                'source_name': 'Trenord',
                                'source_url': tr_current_url
                            })
                            if len(trenord_list) >= 2:
                                break
            except Exception as e:
                print(f"Errore Trenord: {e}")

            # 4. SKY TG24 CRONACA
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
            s_name = group[0]['source_name'] if group else None
            if not group:
                continue
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

        # Pulizia di sicurezza: se una fonte (es. ATM o Leggo) in questo giro ha 0 risultati validi,
        # rimuove eventuali vecchi record sporchi rimasti nel DB da esecuzioni precedenti!
        for source_label, grp_list in [("ATM Milano", atm_list), ("Leggo.it Cronaca", leggo_list)]:
            if not grp_list:
                old_src = db.query(Source).filter(Source.name == source_label).first()
                if old_src:
                    db.query(Strike).filter(Strike.source_id == old_src.id).delete()

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