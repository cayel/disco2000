from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import depuis le backend existant
from backend.app.routers.records import router as records_router
from backend.app.core.config import settings

app = FastAPI(title="Disco2000 API (Vercel)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Préfixe commun /api
app.include_router(records_router, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "ok"}
