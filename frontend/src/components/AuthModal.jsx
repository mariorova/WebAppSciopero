import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function AuthModal({
    isOpen,
    isAuthOpen,
    onClose,
    onLoginSuccess
}) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const showModal = isOpen !== undefined ? isOpen : isAuthOpen;
    if (!showModal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                const regRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        full_name: name || email.split('@')[0],
                        username: name || email.split('@')[0]
                    })
                });

                if (!regRes.ok) {
                    const errData = await regRes.json().catch(() => ({}));
                    throw new Error(errData.detail || 'Errore durante la registrazione.');
                }
            }

            // FastAPI OAuth2PasswordRequestForm richiede application/x-www-form-urlencoded con 'username' e 'password'
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (!loginRes.ok) {
                const errData = await loginRes.json().catch(() => ({}));
                throw new Error(errData.detail || 'Credenziali non valide.');
            }

            const data = await loginRes.json();
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
            }
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            if (onLoginSuccess) onLoginSuccess(data);
            if (onClose) onClose();
        } catch (err) {
            setError(err.message || 'Errore di connessione al server.');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = (provider) => {
        window.location.href = `${API_BASE_URL}/api/auth/login/${provider}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Chiudi">
                    <X size={18} />
                </button>

                <h2 className="auth-modal-title">
                    {isRegistering ? 'Crea un account' : 'Bentornato'}
                </h2>
                <p className="auth-modal-subtitle">
                    {isRegistering
                        ? 'Registrati per salvare le tue tratte e ricevere avvisi'
                        : 'Accedi per gestire le tue notifiche sugli scioperi'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        type="button"
                        className="social-btn"
                        onClick={() => handleOAuthLogin('google')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                fill="#EA4335"
                                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5L1.6 17c1.9 3.9 5.8 7 10.4 7z"
                            />
                        </svg>
                        Accedi con Google
                    </button>

                    <button
                        type="button"
                        className="social-btn social-btn-facebook"
                        onClick={() => handleOAuthLogin('facebook')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                        </svg>
                        Accedi con Facebook
                    </button>
                </div>

                <div className="auth-divider">oppure con email</div>

                {error && (
                    <div
                        style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.12)',
                            border: '1px solid rgba(220, 38, 38, 0.4)',
                            color: '#ef4444',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isRegistering && (
                        <div className="auth-input-wrapper">
                            <User size={17} className="auth-input-icon" />
                            <input
                                type="text"
                                placeholder="Nome completo"
                                className="auth-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-input-wrapper">
                        <Mail size={17} className="auth-input-icon" />
                        <input
                            type="email"
                            placeholder="nome@email.it"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-input-wrapper">
                        <Lock size={17} className="auth-input-icon" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Attendere...' : isRegistering ? 'Registrati' : 'Accedi'}
                    </button>
                </form>

                <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                    }}
                >
                    {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
                </button>
            </div>
        </div>
    );
}