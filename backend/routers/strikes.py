# Rotte per gli scioperi (/api/scioperi/...)
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

router = APIRouter(prefix="", tags=["Scioperi"])

SECRET_KEY = "chiave_segreta_super_sicura_da_cambiare"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Funzione per validare il token e proteggere le rotte avanzate[cite: 3]
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

@router.get("", status_code=status.HTTP_200_OK)
def get_scioperi(
    citta: Optional[str] = Query(None, description="Filtra per città (es. Milano)"),
    settore: Optional[str] = Query(None, description="Filtra per settore (es. TPL)"),
    attivi_ora: Optional[bool] = Query(False, description="Filtra solo gli scioperi attivi in questo momento"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # La lista base è visibile anche senza login[cite: 3]
    query = db.query(Strike)
    
    if citta:
        query = query.filter(Strike.city.ilike(f"%{citta}%"))
    if settore:
        query = query.filter(Strike.sector.ilike(f"%{settore}%"))
        
    if attivi_ora:
        now = datetime.now()
        query = query.filter(Strike.start_time <= now, Strike.end_time >= now)
    
    # Ordinamento per ID decrescente e data, così i test inseriti compaiono subito in prima pagina
    query = query.order_by(Strike.start_time.desc(), Strike.id.desc())
    
    total = query.count()
    strikes = query.offset(page * size).limit(size).all()
    
    results = []
    for s in strikes:
        results.append({
            "id_sciopero": s.id,
            "citta": s.city,
            "settore": s.sector,
            "data_inizio": s.start_time,
            "data_fine": s.end_time,
            "descrizione_sintetica": s.description[:120] + "..." if s.description and len(s.description) > 120 else (s.description or ""),
            "fonte_nome": s.source.name if s.source else "N/D",
            "scioperoLNK": f"/api/scioperi/{s.id}"
        })
        
    return {
        "page": page,
        "size": size,
        "citta": citta,
        "total_results": total,
        "results": results
    }

@router.get("/{id}", response_model=StrikeDetailResponse)
def get_sciopero_detail(
    id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Dettagli avanzati con affected_lines per la mappa: richiede autenticazione[cite: 3]
    strike = db.query(Strike).filter(Strike.id == id).first()
    if not strike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Sciopero non trovato"
        )
    return strike