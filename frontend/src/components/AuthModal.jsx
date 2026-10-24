import { useState } from 'react';
import { Lock, Mail, X, Check, AlertCircle } from 'lucide-react';
import { registerUser, loginUser } from '../services/api';

export default function AuthModal({
    isAuthOpen, setIsAuthOpen,
    isLoginMode, setIsLoginMode,
    email, setEmail,
    password, setPassword,
    setIsLoggedIn,
    isLoggedIn,
    handleLogout,
    handleDeleteAccount
}) {
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isAuthOpen) return null;

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&._-]/.test(password);

    const isPasswordValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!isLoginMode) {
            if (!isPasswordValid) {
                setErrorMsg("La password non rispetta tutti i requisiti di sicurezza.");
                return;
            }
            if (password !== confirmPassword) {
                setErrorMsg("Le password non coincidono.");
                return;
            }
        }

        setLoading(true);
        try {
            if (isLoginMode) {
                await loginUser(email, password);
                setIsLoggedIn(true);
                alert(`Bentornato, ${email}! Accesso effettuato con successo.`);
                setIsAuthOpen(false);
            } else {
                await registerUser(email, password);
                setIsLoggedIn(true);
                alert(`Account registrato e accesso effettuato con successo per: ${email}`);
                setIsAuthOpen(false);
            }
        } catch (err) {
            setErrorMsg(err.message || "Errore di connessione al server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'var(--card-bg, #1e1e1e)', border: '1px solid var(--border)',
                borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '30px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <button
                    onClick={() => setIsAuthOpen(false)}
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
                >
                    <X size={20} />
                </button>

                {isLoggedIn ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <Lock size={24} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Il tuo Account</h3>
                        <p style={{ fontSize: '13px', opacity: 0.7 }}>Accesso effettuato come:<br /><strong style={{ color: 'var(--accent)' }}>{email}</strong></p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                                    background: 'rgba(255, 255, 255, 0.08)', fontWeight: '600', cursor: 'pointer', color: 'inherit'
                                }}
                            >
                                Esci (Logout)
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                style={{
                                    padding: '12px', borderRadius: '10px', border: 'none',
                                    background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Elimina Account
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
                                {isLoginMode ? 'Bentornato' : 'Crea Account'}
                            </h3>
                            <p style={{ fontSize: '13px', opacity: 0.7 }}>
                                {isLoginMode ? 'Accedi per gestire le notifiche e preferenze' : 'Registrati per sbloccare tutte le funzioni'}
                            </p>
                        </div>

                        {errorMsg && (
                            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
                                {errorMsg}
                            </div>
                        )}

                        {/* Pulsanti Social Login con loghi SVG ufficiali */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Pulsante Google */}
                            <button
                                type="button"
                                onClick={() => { window.location.href = "http://localhost:8000/api/auth/google/login"; }}
                                style={{
                                    padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                                    background: '#ffffff', color: '#000000', fontWeight: '700', fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.17 21.32 7.24 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.19C.43 8.13 0 9.86 0 12s.43 3.87 1.19 5.39l4.08-3.15z" />
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.17 2.68 1.19 6.61l4.08 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
                                </svg>
                                Accedi con Google
                            </button>

                            {/* Pulsante Facebook */}
                            <button
                                type="button"
                                onClick={() => { window.location.href = "http://localhost:8000/api/auth/meta/login"; }}
                                style={{
                                    padding: '12px', borderRadius: '10px', border: 'none',
                                    background: '#1877f2', color: '#ffffff', fontWeight: '700', fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Accedi con Facebook
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5, fontSize: '12px', textAlign: 'center' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                            <span>oppure con email</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8 }}>Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
                                <Mail size={16} style={{ opacity: 0.5 }} />
                                <input
                                    type="email" required placeholder="nome@email.it"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', width: '100%', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8 }}>Password</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
                                <Lock size={16} style={{ opacity: 0.5 }} />
                                <input
                                    type="password" required placeholder="••••••••"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', width: '100%', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        {!isLoginMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(128,128,128,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', opacity: 0.7, textTransform: 'uppercase' }}>Requisiti Password:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                                    <span style={{ color: hasMinLength ? '#10b981' : 'inherit', opacity: hasMinLength ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {hasMinLength ? <Check size={12} /> : <AlertCircle size={12} />} Min. 8 caratteri
                                    </span>
                                    <span style={{ color: hasUpperCase ? '#10b981' : 'inherit', opacity: hasUpperCase ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {hasUpperCase ? <Check size={12} /> : <AlertCircle size={12} />} Una maiuscola
                                    </span>
                                    <span style={{ color: hasNumber ? '#10b981' : 'inherit', opacity: hasNumber ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {hasNumber ? <Check size={12} /> : <AlertCircle size={12} />} Un numero
                                    </span>
                                    <span style={{ color: hasSpecialChar ? '#10b981' : 'inherit', opacity: hasSpecialChar ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {hasSpecialChar ? <Check size={12} /> : <AlertCircle size={12} />} Un simbolo
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isLoginMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', opacity: '0.8' }}>Conferma Password</label>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.05)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
                                    <Lock size={16} style={{ opacity: 0.5 }} />
                                    <input
                                        type="password" required placeholder="••••••••"
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', width: '100%', fontSize: '14px' }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '10px', padding: '12px', borderRadius: '10px', border: 'none',
                                background: 'var(--accent, #dc2626)', color: '#fff', fontWeight: '700',
                                cursor: 'pointer', opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Attendere...' : (isLoginMode ? 'Accedi' : 'Registrati')}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                            <button
                                type="button"
                                onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent, #dc2626)', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {isLoginMode ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}