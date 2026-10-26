# Rotte per gli scioperi (/api/scioperi/...)
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
from scraper.spider import run_spider

router = APIRouter(prefix="", tags=["Scioperi"])

SECRET_KEY = "chiave_segreta_super_sicura_da_cambiare"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

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

def parse_and_enrich_strike(s: Strike):
    """
    Se il record nel DB contiene una stringa grezza del MIT (es. 'MIT: 28/10/2026 - 29/10/2026 - ...'),
    estrae le vere date di inizio/fine, il settore reale, la città e formatta la descrizione.
    """
    desc = s.description or ""
    start_dt = s.start_time
    end_dt = s.end_time
    city = s.city or "Nazionale"
    sector = s.sector or "Trasporti"

    # 1. Estrazione delle vere date di inizio e fine dal testo se presenti (formato GG/MM/AAAA)
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

    # 2. Se il testo inizia con 'MIT:', scomponiamo i campi separati da ' - '
    clean_desc = desc
    if desc.startswith("MIT:"):
        raw_body = desc.replace("MIT:", "").strip()
        parts = [p.strip() for p in raw_body.split(" - ") if p.strip()]
        
        # Struttura tipica MIT: [0]=DataInizio, [1]=DataFine, [2]=Sindacato, [3]=Settore, [4]=Personale/Mezzi, [5]=Orari/Modalità, [6]=Ambito
        if len(parts) >= 5:
            sindacato = parts[2]
            settore_mit = parts[3]
            azienda_mezzi = parts[4]
            modalita = parts[5] if len(parts) > 5 and not re.search(r'\d{2}/\d{2}/\d{4}', parts[5]) else ""
            
            # Impostiamo il settore reale invece di 'Trasporto Pubblico' fisso
            s_low = (settore_mit + " " + azienda_mezzi).lower()
            if "ferrovi" in s_low or "trenitalia" in s_low or "trenord" in s_low:
                sector = "Ferroviario"
            elif "aereo" in s_low or "aeroport" in s_low or "enav" in s_low:
                sector = "Aereo"
            elif "marittim" in s_low or "portual" in s_low or "porti" in s_low:
                sector = "Marittimo"
            elif "trasporto pubblico locale" in s_low or "tpl" in s_low or "campania" in s_low or "atm" in s_low:
                sector = "TPL"
            elif "autostrad" in s_low or "stradal" in s_low:
                sector = "Autostrade / Viabilità"
            elif "generale" in s_low or "plurisettoriale" in s_low:
                sector = "Sciopero Generale"
            else:
                sector = settore_mit

            # Ricostruiamo una descrizione leggibile che mostri subito CHI sciopera, MEZZI e ORARI
            if modalita and modalita.lower() not in ["nazionale", "regionale", "locale"]:
                clean_desc = f"{azienda_mezzi} • Orari/Modalità: {modalita} • Sindacati: {sindacato}"
            else:
                clean_desc = f"{azienda_mezzi} • Sindacati: {sindacato}"

    # 3. Rilevamento automatico della città/regione dal testo se è rimasto 'Nazionale / Varie'
    if city in ["Nazionale / Varie", "Nazionale"]:
        luoghi = [
            "Milano", "Roma", "Napoli", "Torino", "Bologna", "Firenze", "Pisa", 
            "Bari", "Venezia", "Genova", "Palermo", "Reggio Emilia", "Rimini",
            "Lombardia", "Toscana", "Campania", "Emilia-Romagna", "Puglia", "Lazio"
        ]
        trovati = [l for l in luoghi if re.search(rf'\b{l}\b', desc, re.IGNORECASE)]
        if trovati:
            city = " / ".join(dict.fromkeys(trovati[:2]))
        else:
            city = "Nazionale"

    return start_dt, end_dt, city, sector, clean_desc

@router.get("", status_code=status.HTTP_200_OK)
def get_scioperi(
    citta: Optional[str] = Query(None, description="Filtra per città (es. Milano)"),
    settore: Optional[str] = Query(None, description="Filtra per settore (es. TPL)"),
    attivi_ora: Optional[bool] = Query(False, description="Filtra solo gli scioperi attivi in questo momento"),
    solo_futuri: Optional[bool] = Query(False, description="Filtra solo gli scioperi in programma nel futuro"),
    page: int = Query(0, ge=0),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    strikes = db.query(Strike).all()
    now = datetime.now()
    
    results = []
    for s in strikes:
        start_dt, end_dt, parsed_city, parsed_sector, parsed_desc = parse_and_enrich_strike(s)

        # Filtri opzionali da query param
        if citta and citta.lower() not in parsed_city.lower():
            continue
        if settore and settore.lower() not in parsed_sector.lower():
            continue

        # Calcolo stato reale in base alle date estratte
        if start_dt <= now <= end_dt:
            stato = "in_corso"
        elif start_dt > now:
            stato = "in_programma"
        else:
            stato = "concluso"

        # Escludiamo quelli già conclusi nei giorni passati
        if stato == "concluso":
            continue

        if attivi_ora and stato != "in_corso":
            continue
        if solo_futuri and stato != "in_programma":
            continue

        results.append({
            "id_sciopero": s.id,
            "citta": parsed_city,
            "settore": parsed_sector,
            "data_inizio": start_dt.isoformat(),
            "data_fine": end_dt.isoformat(),
            "descrizione_sintetica": parsed_desc[:300] + "..." if len(parsed_desc) > 300 else parsed_desc,
            "fonte_nome": s.source.name if s.source else "N/D",
            "scioperoLNK": f"/api/scioperi/{s.id}",
            "stato": stato
        })

    # Ordiniamo per data di inizio crescente (prima quelli più vicini)
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
    try:
        await run_spider()
        return {
            "status": "success", 
            "message": "Spider multi-fonte eseguito con successo!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante l'esecuzione dello spider: {str(e)}"
        )

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