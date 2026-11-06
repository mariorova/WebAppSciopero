import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from jose import jwt, JWTError

from database import get_db
from models.strike import Strike
from models.user import User
from schemas.strike_schema import StrikeDetailResponse
from scraper.scheduler import run_spider_safely
from scraper.spider import split_multi_date_paragraph, extract_dates_from_text, find_city, classify_sector

router = APIRouter(prefix="", tags=["Scioperi"])

SECRET_KEY = "chiave_segreta_super_sicura_da_cambiare"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

KNOWN_ENTITIES = [
    "enav", "atm", "atvo", "amt", "amtab", "atac", "trenord", "trenitalia",
    "italo", "ntv", "rfi", "iren", "sicuritalia", "ivri", "malpensa",
    "linate", "marco polo", "telecomunicazioni", "vincenzo miele", "eav", "anm"
]

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali di autenticazione non valide o mancanti",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def extract_entity_key(text: str) -> str:
    """
    Identifica l'azienda o l'ente principale citato nella descrizione (es. 'enav', 'atm', 'atvo', 'italo')
    per accorpare con precisione lo stesso sciopero proveniente da fonti diverse.
    """
    t_low = text.lower()
    for ent in KNOWN_ENTITIES:
        if re.search(rf'\b{re.escape(ent)}\b', t_low):
            return ent
    if "sciopero generale" in t_low:
        return "sciopero_generale"
    return ""

def parse_and_enrich_strike(s: Strike):
    desc = s.description or ""
    start_dt = s.start_time
    end_dt = s.end_time
    city = s.city or "Nazionale"
    sector = s.sector or "Trasporti"

    date_matches = re.findall(r'(\d{2})/(\d{2})/(\d{4})', desc)
    if len(date_matches) >= 2:
        d1, m1, y1 = map(int, date_matches[0])
        d2, m2, y2 = map(int, date_matches[1])
        start_dt = datetime(y1, m1, d1, 0, 0, 0)
        end_dt = datetime(y2, m2, d2, 23, 59, 59)
    elif len(date_matches) == 1:
        d1, m1, y1 = map(int, date_matches[0])
        start_dt = datetime(y1, m1, d1, 0, 0, 0)
        end_dt = datetime(y1, m1, d1, 23, 59, 59)

    clean_desc = desc
    if desc.startswith("MIT:"):
        raw_body = desc.replace("MIT:", "").strip()
        parts = [p.strip() for p in raw_body.split(" - ") if p.strip()]
        if len(parts) >= 5:
            sindacato = parts[2]
            settore_mit = parts[3]
            azienda_mezzi = parts[4]
            modalita = parts[5] if len(parts) > 5 and not re.search(r'\d{2}/\d{2}/\d{4}', parts[5]) else ""
            sector = classify_sector(settore_mit, raw_body)
            if modalita and modalita.lower() not in ["nazionale", "regionale", "locale"]:
                clean_desc = f"{azienda_mezzi} • Orari/Modalità: {modalita} • Sindacati: {sindacato}"
            else:
                clean_desc = f"{azienda_mezzi} • Sindacati: {sindacato}"

    # Normalizza la città e il settore se provengono da descrizioni grezze
    detected_city = find_city(clean_desc)
    if city in ["Nazionale / Varie", "Nazionale"] and detected_city != "Nazionale":
        city = detected_city
    if "(na)" in clean_desc.lower() or "volla" in clean_desc.lower():
        city = "Napoli"

    # Rimuove eventuali prefissi ridondanti "Sky TG24 • " o "Leggo.it • " dalla descrizione
    clean_desc = re.sub(r'^(?:Sky TG24|Leggo\.it|Leggo)\s*[•\-:]\s*', '', clean_desc, flags=re.IGNORECASE).strip()

    return start_dt, end_dt, city, sector, clean_desc

def expand_and_deduplicate_strikes(strikes: list[Strike]) -> list[dict]:
    """
    1. Spezza eventuali record cumulativi (che contengono più date in un solo paragrafo) in singoli scioperi.
    2. Unisce gli scioperi identici presi da fonti diverse in una sola card con più fonti.
    """
    expanded_items = []

    for s in strikes:
        source_name = s.source.name if s.source else "Fonte Ufficiale"
        start_dt, end_dt, parsed_city, parsed_sector, parsed_desc = parse_and_enrich_strike(s)

        # Se è un articolo giornalistico (Leggo o Sky) controlliamo se dentro la descrizione ci sono più date concatenate
        if any(k in source_name.lower() for k in ["leggo", "sky"]):
            sub_chunks = split_multi_date_paragraph(parsed_desc)
        else:
            sub_chunks = [parsed_desc]

        if len(sub_chunks) > 1:
            for chunk in sub_chunks:
                c_start, c_end = extract_dates_from_text(chunk, default_days_offset=1)
                c_city = find_city(chunk)
                c_sector = classify_sector("", chunk)
                expanded_items.append({
                    "id_sciopero": s.id,
                    "citta": c_city,
                    "settore": c_sector,
                    "data_inizio_dt": c_start,
                    "data_fine_dt": c_end,
                    "descrizione": chunk,
                    "fonti": [source_name],
                    "entity": extract_entity_key(chunk)
                })
        else:
            expanded_items.append({
                "id_sciopero": s.id,
                "citta": parsed_city,
                "settore": parsed_sector,
                "data_inizio_dt": start_dt,
                "data_fine_dt": end_dt,
                "descrizione": parsed_desc,
                "fonti": [source_name],
                "entity": extract_entity_key(parsed_desc)
            })

    # Raggruppamento degli scioperi uguali provenienti da fonti diverse
    merged_groups = []

    for item in expanded_items:
        item_day = item["data_inizio_dt"].date()
        item_city = item["citta"].lower()
        item_sec = item["settore"].lower()
        item_ent = item["entity"]

        matched_group = None
        for grp in merged_groups:
            grp_day = grp["data_inizio_dt"].date()
            if item_day != grp_day:
                continue

            grp_city = grp["citta"].lower()
            grp_sec = grp["settore"].lower()
            grp_ent = grp["entity"]

            # Caso 1: Stessa data e stessa azienda/ente specifico (es. "enav", "atm", "atvo", "italo", "iren")
            same_entity = bool(item_ent and grp_ent and item_ent == grp_ent)
            same_city_or_national = (
                item_city == grp_city
                or "nazionale" in item_city
                or "nazionale" in grp_city
                or item_city in grp_city
                or grp_city in item_city
            )

            # Caso 2: Stessa data, stessa città specifica (non Nazionale) e stesso settore
            same_specific_city_sector = (
                item_city != "nazionale"
                and item_city == grp_city
                and item_sec == grp_sec
                and (not item_ent or not grp_ent or item_ent == grp_ent)
            )

            if (same_entity and same_city_or_national) or same_specific_city_sector:
                matched_group = grp
                break

        if matched_group:
            # Aggiunge la nuova fonte se non è già presente nella lista delle fonti della card
            for f in item["fonti"]:
                if f not in matched_group["fonti"]:
                    matched_group["fonti"].append(f)

            # Se una delle due città è più specifica di "Nazionale" (es. "Bari" o "Milano"), conserva quella specifica
            if matched_group["citta"] == "Nazionale" and item["citta"] != "Nazionale":
                matched_group["citta"] = item["citta"]

            # Se la descrizione proviene da un articolo giornalistico più leggibile o aggiunge dettagli utili, la unisce/arricchisce
            if item["descrizione"] != matched_group["descrizione"]:
                # Preferisce mostrare sia la scheda tecnica MIT sia la sintesi giornalistica se proviene da un'altra fonte
                if len(matched_group["descrizione"]) < 190 and item["descrizione"] not in matched_group["descrizione"]:
                    matched_group["descrizione"] = f"{matched_group['descrizione']} | {item['descrizione']}"
        else:
            merged_groups.append(item)

    return merged_groups

@router.get("", status_code=status.HTTP_200_OK)
def get_scioperi(
    citta: Optional[str] = Query(None, description="Filtra per città (es. Milano)"),
    settore: Optional[str] = Query(None, description="Filtra per settore (es. TPL)"),
    attivi_ora: Optional[bool] = Query(False, description="Filtra solo gli scioperi attivi in questo momento"),
    solo_futuri: Optional[bool] = Query(False, description="Filtra solo gli scioperi in programma nel futuro"),
    page: int = Query(0, ge=0),
    size: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    strikes = db.query(Strike).all()
    now = datetime.now()

    deduped_items = expand_and_deduplicate_strikes(strikes)
    
    results = []
    for item in deduped_items:
        start_dt = item["data_inizio_dt"]
        end_dt = item["data_fine_dt"]
        parsed_city = item["citta"]
        parsed_sector = item["settore"]
        parsed_desc = item["descrizione"]

        if citta and citta.lower() not in parsed_city.lower():
            continue
        if settore and settore.lower() not in parsed_sector.lower():
            continue

        if start_dt <= now <= end_dt:
            stato = "in_corso"
        elif start_dt > now:
            stato = "in_programma"
        else:
            stato = "concluso"

        if stato == "concluso":
            continue

        if attivi_ora and stato != "in_corso":
            continue
        if solo_futuri and stato != "in_programma":
            continue

        # Formatta le fonti multiple separate da " • " (es. "Ministero delle Infrastrutture e dei Trasporti (MIT) • Leggo.it Cronaca")
        fonti_str = " • ".join(item["fonti"])

        results.append({
            "id_sciopero": item["id_sciopero"],
            "citta": parsed_city,
            "settore": parsed_sector,
            "data_inizio": start_dt.isoformat(),
            "data_fine": end_dt.isoformat(),
            "descrizione_sintetica": parsed_desc[:300] + "..." if len(parsed_desc) > 300 else parsed_desc,
            "fonte_nome": fonti_str,
            "scioperoLNK": f"/api/scioperi/{item['id_sciopero']}",
            "stato": stato
        })

    results.sort(key=lambda x: x["data_inizio"])
    total = len(results)
    paginated = results[page * size : (page + 1) * size]
        
    return {
        "page": page,
        "size": size,
        "citta": citta,
        "total_results": total,
        "results": paginated
    }

@router.post("/trigger-spider", status_code=status.HTTP_200_OK)
async def trigger_spider_manually():
    success = await run_spider_safely()
    if not success:
        return {
            "status": "busy", 
            "message": "Un ciclo di scraping è già in esecuzione. Richiesta ignorata."
        }
    return {
        "status": "success", 
        "message": "Spider multi-fonte eseguito con successo!"
    }

@router.get("/{id}", response_model=StrikeDetailResponse)
def get_sciopero_detail(
    id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    strike = db.query(Strike).filter(Strike.id == id).first()
    if not strike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Sciopero non trovato"
        )
    return strike