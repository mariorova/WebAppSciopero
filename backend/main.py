import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

# Importa database e modelli per assicurarsi che le tabelle vengano create
from database import engine, Base
from models import user, strike, source, spider_log

# Importa i router del progetto
from routers import auth, sources, strikes, logs
# Importa lo scheduler dello spider
from scraper.scheduler import start_scheduler, stop_scheduler
# Importa il rate limiter
from middleware.rate_limiter import check_rate_limit

# Crea le tabelle nel database all'avvio se non esistono già
Base.metadata.create_all(bind=engine)

# Definizione del ciclo di vita per avviare lo spider in background all'avvio dell'app e fermarlo alla chiusura
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="WebApp Sciopero Mezzi Italia",
    description="API per la gestione e il monitoraggio degli scioperi dei trasporti in Italia",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware di Rate Limiting globale basato su IP (esclude la documentazione Swagger)
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path not in ["/docs", "/openapi.json", "/redoc"]:
        try:
            check_rate_limit(request)
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    
    response = await call_next(request)
    return response

# SessionMiddleware richiesto da Authlib per il flusso OAuth
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "chiave_segreta_super_sicura_da_cambiare")
)

# Configurazione CORS esplicita per il frontend sulla porta 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusione dei router con i rispettivi prefissi
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticazione"])
app.include_router(strikes.router, prefix="/api/scioperi", tags=["Scioperi"])
app.include_router(sources.router, prefix="/api/sources", tags=["Fonti"])
app.include_router(logs.router, prefix="", tags=["Monitoraggio Log"])

@app.get("/")
def read_root():
    return {"message": "Benvenuto nelle API di WebApp Sciopero Mezzi Italia! Il backend è attivo e operativo."}