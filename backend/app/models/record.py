from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from .base import Base

class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    discogs_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    titre: Mapped[str] = mapped_column(String(255), index=True)
    artistes: Mapped[str] = mapped_column(String(255))  # CSV simplifié provisoire
    annee: Mapped[int] = mapped_column(Integer, index=True)
    genres: Mapped[str] = mapped_column(String(255))  # CSV simplifié provisoire
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ajout_par: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_ajout: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
