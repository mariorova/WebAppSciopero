# Rotte di registrazione, login ed OAuth (Google e Meta)
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv

from database import get_db
from models.user import User
from schemas.user_schema import UserCreate, UserLogin, UserResponse, Token

load_dotenv()

router = APIRouter(tags=["Autenticazione"])

# Configurazione per l'hashing delle password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configurazioni JWT
SECRET_KEY = "chiave_segreta_super_sicura_da_cambiare"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Configurazione OAuth (Google e Meta)
oauth = OAuth()

# Google OAuth
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

# Meta / Facebook OAuth (Aggiornato con scope base public_profile)
oauth.register(
    name="facebook",
    client_id=os.getenv("META_CLIENT_ID"),
    client_secret=os.getenv("META_CLIENT_SECRET"),
    access_token_url="https://graph.facebook.com/v18.0/oauth/access_token",
    authorize_url="https://www.facebook.com/v18.0/dialog/oauth",
    api_base_url="https://graph.facebook.com/v18.0/",
    client_kwargs={"scope": "public_profile"},
)

def hash_password(password: str):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata nel sistema."
        )
    
    username = getattr(user_data, "username", None) or user_data.email.split("@")[0]
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        username=username,
        email=user_data.email,
        password_hash=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- ROTTE GOOGLE OAUTH ---
@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Autenticazione Google fallita.")
        
        email = user_info.get("email")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            username = email.split("@")[0]
            dummy_password = hash_password(os.urandom(24).hex())
            user = User(username=username, email=email, password_hash=dummy_password)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
        
        frontend_url = f"http://localhost:5173/?token={access_token}&email={user.email}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore OAuth Google: {str(e)}")

# --- ROTTE META / FACEBOOK OAUTH ---
@router.get("/meta/login")
async def meta_login(request: Request):
    redirect_uri = os.getenv("META_REDIRECT_URI", "http://localhost:8000/api/auth/meta/callback")
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get("/meta/callback")
async def meta_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.facebook.authorize_access_token(request)
        resp = await oauth.facebook.get('me?fields=id,name', token=token)
        user_info = resp.json()
        
        # Genera l'email basandosi sull'ID Facebook poiché lo scope email richiede permessi avanzati
        email = f"{user_info.get('id')}@facebook.com"
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            username = user_info.get("name", email.split("@")[0]).replace(" ", "")
            dummy_password = hash_password(os.urandom(24).hex())
            user = User(username=username, email=email, password_hash=dummy_password)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
        
        frontend_url = f"http://localhost:5173/?token={access_token}&email={user.email}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore OAuth Meta: {str(e)}")