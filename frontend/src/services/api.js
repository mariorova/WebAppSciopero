const API_URL = 'http://localhost:8000'; // Modifica se usi un URL di produzione

export async function getStrikes() {
    try {
        const response = await fetch(`${API_URL}/api/scioperi`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dati scioperi ricevuti dall'API:", data);

        // Se il backend restituisce l'oggetto paginato, restituisce l'array dentro 'results'
        if (data && Array.isArray(data.results)) {
            return data.results;
        }

        // Fallback nel caso in cui sia già un array
        if (Array.isArray(data)) {
            return data;
        }

        return [];
    } catch (error) {
        console.error("API error in getStrikes:", error);
        return [];
    }
}

export async function registerUser(email, password) {
    try {
        const username = email.split('@')[0];
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Errore durante la registrazione');
        }
        return data;
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
}

export async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Credenziali non valide');
        }
        return data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}