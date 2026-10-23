# Modello tabella scioperi

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from models.source import Source  # Import essenziale per registrare la relazione

class Strike(Base):
    __tablename__ = "strikes"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True, nullable=False)          # Città (es. Milano, Roma)
    sector = Column(String, index=True, nullable=False)        # Settore (es. TPL, Treni)[cite: 4]
    start_time = Column(DateTime, nullable=False)              # Data e ora inizio[cite: 4]
    end_time = Column(DateTime, nullable=False)                # Data e ora fine[cite: 4]
    description = Column(String, nullable=False)               # Motivazione / descrizione sintetica[cite: 4]
    affected_lines = Column(JSON, nullable=True)               # Dati strutturati in JSON per la mappa delle linee[cite: 4]
    
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False, default=1)
    source = relationship("Source", back_populates="strikes")