from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.records import router as records_router
from .core.config import settings

app = FastAPI(title="Disco2000 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
