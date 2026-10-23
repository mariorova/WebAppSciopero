# Modello tabella fonti e voti

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, unique=True, nullable=False)
    reliability_score = Column(Float, default=50.0)  # Punteggio da 0 a 100
    is_active = Column(Boolean, default=True)        # Disattivazione automatica se scende sotto soglia[cite: 4]

    # Relazione con i voti
    votes = relationship("Vote", back_populates="source")
    strikes = relationship("Strike", back_populates="source")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    is_reliable = Column(Boolean, nullable=False)    # True = Affidabile, False = Non affidabile[cite: 4]
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="votes")