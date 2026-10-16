"""CareDesk FastAPI application: health checks, appointments API, metrics."""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, get_db
from app.routes.appointments import router as appointments_router
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.seed_on_startup:
        try:
            db = SessionLocal()
            try:
                seed_if_empty(db)
            finally:
                db.close()
        except Exception:
            # Never block startup when the DB is not reachable yet (probes report it).
            pass
    yield


app = FastAPI(title="CareDesk API", version="1.0.0", lifespan=lifespan)
app.include_router(appointments_router)
Instrumentator().instrument(app).expose(app, endpoint="/metrics")


@app.get("/", summary="Service root")
def root() -> dict:
    return {"service": "CareDesk API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", summary="Cheap liveness check (no DB)")
def health() -> dict:
    return {"status": "ok"}


@app.get("/ready", summary="Readiness check (verifies DB connectivity)")
def ready(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=503, content={"status": "NOT_READY", "detail": str(exc)})
    return {"status": "READY"}
