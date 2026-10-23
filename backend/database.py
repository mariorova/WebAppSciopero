# Configurazione e connessione al database PostgreSQL (SQLAlchemy)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL di connessione al database PostgreSQL
# Formato: postgresql://username:password@localhost:5432/nome_database
SQLALCHEMY_DATABASE_URL = "postgresql://mariorova@localhost:5432/scioperi_db"

# Creazione dell'engine di connessione
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Creazione della Sessione per comunicare con il DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base dichiarativa per definire i modelli delle tabelle
Base = declarative_base()

# Funzione di utilità per ottenere la sessione del database nelle rotte FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()