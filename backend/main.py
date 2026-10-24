from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

# Importa database e modelli per assicurarsi che le tabelle vengano create
from database import engine, Base
from models import user, strike, source

# Importa i router del progetto
from routers import auth, sources, strikes
# Importa lo scheduler dello spider
from scraper.scheduler import start_scheduler

# Crea le tabelle nel database SQLite all'avvio se non esistono già
Base.metadata.create_all(bind=engine)

# Definizione del ciclo di vita per avviare lo spider in background all'avvio dell'app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Avvia lo scheduler in background
    start_scheduler()
    yield

app = FastAPI(
    title="WebApp Sciopero Mezzi Italia",
    description="API per la gestione e il monitoraggio degli scioperi dei trasporti in Italia",
    version="1.0.0",
    lifespan=lifespan
)

# Aggiungiamo il SessionMiddleware richiesto da Authlib per il flusso OAuth
app.add_middleware(
    SessionMiddleware, 
    secret_key="chiave_segreta_super_sicura_da_cambiare"
)

# Configurazione CORS esplicita per risolvere il blocco del browser (porta 5173)[cite: 21]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusione dei router con il prefisso /api per allinearli al frontend[cite: 21]
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticazione"])
app.include_router(strikes.router, prefix="/api/scioperi", tags=["Scioperi"])
app.include_router(sources.router, prefix="/api/sources", tags=["Fonti"])

@app.get("/")
def read_root():
    return {"message": "Benvenuto nelle API di WebApp Sciopero Mezzi Italia! Il backend è attivo e operativo."}