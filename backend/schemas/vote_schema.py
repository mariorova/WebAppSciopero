from pydantic import BaseModel

class VoteCreate(BaseModel):
    is_reliable: bool  # True per pollice su (affidabile), False per pollice giù[cite: 4]

class VoteResponse(BaseModel):
    message: str
    source_id: int
    new_reliability_score: float