const API_URL = 'http://localhost:8000'; // Modifica se usi un URL di produzione

export async function getStrikes() {
    try {
        const response = await fetch(`${API_URL}/api/scioperi/`);
        if (!response.ok) {
            throw new Error('Errore nel recupero degli scioperi');
        }
        return await response.json();
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

export async function registerUser(email, password) {
    try {
        // Generiamo uno username di default basato sulla parte iniziale dell'email
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