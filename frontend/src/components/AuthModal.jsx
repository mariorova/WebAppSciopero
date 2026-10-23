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

    // Regole di validazione della password robusta
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
                // Chiamata API Login reale
                await loginUser(email, password);
                setIsLoggedIn(true);
                alert(`Bentornato, ${email}! Accesso effettuato con successo.`);
                setIsAuthOpen(false);
            } else {
                // Chiamata API Registrazione reale
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
                {/* Pulsante chiusura */}
                <button
                    onClick={() => setIsAuthOpen(false)}
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
                >
                    <X size={20} />
                </button>

                {isLoggedIn ? (
                    /* SEZIONE GESTIONE ACCOUNT SE LOGGATO */
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
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Esci (Logout)
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    color: '#dc2626',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Elimina Account
                            </button>
                        </div>
                    </div>
                ) : (
                    /* SEZIONE LOGIN / REGISTRAZIONE */
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

                        {/* Checklist requisiti password robusta (visibile solo in registrazione) */}
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
                                        {hasSpecialChar ? <Check size={12} /> : <AlertCircle size={12} />} Un simbolo (@$!...)
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isLoginMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8 }}>Conferma Password</label>
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
                                cursor: 'pointer', transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1
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