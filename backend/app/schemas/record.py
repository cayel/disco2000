from datetime import datetime
from pydantic import BaseModel

class RecordBase(BaseModel):
    discogs_id: str
    titre: str
    artistes: list[str]
    annee: int
    genres: list[str]
    cover_url: str | None = None

class RecordCreate(RecordBase):
    pass

class RecordOut(RecordBase):
    id: int
    ajout_par: str | None
    date_ajout: datetime

    class Config:
        from_attributes = True
