import time
from fastapi import Request, HTTPException, status
from collections import defaultdict

# Dizionario in memoria per tracciare le richieste per singolo IP: {ip: [timestamp]}
_request_counts = defaultdict(list)

# Parametri configurabili
RATE_LIMIT_WINDOW = 60      # Finestra temporale in secondi (1 minuto)
MAX_REQUESTS_GENERAL = 120  # Max richieste generali consentite al minuto
MAX_REQUESTS_AUTH = 10      # Max tentativi di login/auth consentiti al minuto

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Applica un limite più rigido sulle rotte di autenticazione/login
    is_auth_route = "/api/auth/" in request.url.path
    max_allowed = MAX_REQUESTS_AUTH if is_auth_route else MAX_REQUESTS_GENERAL

    # Rimuove i timestamp scaduti fuori dalla finestra temporale
    timestamps = _request_counts[client_ip]
    _request_counts[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]

    if len(_request_counts[client_ip]) >= max_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Troppe richieste effettuate da questo indirizzo IP. Riprova tra qualche minuto."
        )

    _request_counts[client_ip].append(now)