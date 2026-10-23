from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class SourceResponse(BaseModel):
    id: int
    name: str
    url: str
    reliability_score: float
    is_active: bool

    class Config:
        from_attributes = True

class StrikeResponse(BaseModel):
    id: int
    city: str
    sector: str
    start_time: datetime
    end_time: datetime
    description: str
    
    class Config:
        from_attributes = True

class StrikeDetailResponse(StrikeResponse):
    source: SourceResponse
    affected_lines: Optional[Dict[str, Any]] = None  # Dati strutturati in JSON per la mappa delle linee[cite: 4]