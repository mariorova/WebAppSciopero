# Rotte per fonti e voti (/api/fonti/...)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.source import Source, Vote
from models.user import User
from schemas.strike_schema import SourceResponse
from schemas.vote_schema import VoteCreate, VoteResponse
from routers.strikes import get_current_user  # Riutilizziamo la protezione della rotta

router = APIRouter(prefix="/api/fonti", tags=["Fonti e Voti"])

@router.get("", status_code=status.HTTP_200_OK)
def get_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    return {
        "total_sources": len(sources),
        "sources": sources
    }

@router.post("/{id}/voti", response_model=VoteResponse, status_code=status.HTTP_200_OK)
def vote_source(
    id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),  # Richiede autenticazione
    db: Session = Depends(get_db)
):
    # Verifica che la fonte esista nel database
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fonte non trovata"
        )
    
    # Controlla se l'utente ha già votato questa fonte per aggiornare il voto o crearne uno nuovo
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.source_id == id
    ).first()

    if existing_vote:
        existing_vote.is_reliable = vote_data.is_reliable
    else:
        new_vote = Vote(
            user_id=current_user.id,
            source_id=id,
            is_reliable=vote_data.is_reliable
        )
        db.add(new_vote)
    
    db.commit()

    # Algoritmo di ricalcolo del punteggio di affidabilità (percentuale di voti positivi da 0 a 100)
    all_votes = db.query(Vote).filter(Vote.source_id == id).all()
    if all_votes:
        positive_votes = sum(1 for v in all_votes if v.is_reliable)
        score = (positive_votes / len(all_votes)) * 100
        source.reliability_score = round(score, 2)
        db.commit()

    return {
        "message": "Voto registrato con successo",
        "source_id": source.id,
        "new_reliability_score": source.reliability_score
    }