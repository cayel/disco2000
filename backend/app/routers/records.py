from fastapi import APIRouter, Depends
from typing import List
from ..schemas.record import RecordOut, RecordCreate

router = APIRouter(prefix="/records", tags=["records"])

_fake_db: list[RecordOut] = []  # placeholder en mémoire

@router.get("/", response_model=List[RecordOut])
async def list_records() -> List[RecordOut]:
    return _fake_db

@router.post("/", response_model=RecordOut)
async def create_record(payload: RecordCreate) -> RecordOut:
    new = RecordOut(
        id=len(_fake_db) + 1,
        ajout_par="admin",
        date_ajout=__import__("datetime").datetime.utcnow(),
        **payload.dict()
    )
    _fake_db.append(new)
    return new
