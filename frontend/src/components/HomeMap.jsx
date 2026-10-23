import { useState } from 'react';
import { MapPin, ArrowRight, Zap, ThumbsUp, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import StrikeDetailModal from './StrikeDetailModal';

export default function HomeMap({ setActiveTab, setFilterCity, strikes = [], isLoggedIn }) {
    const now = new Date();
    const [selectedStrike, setSelectedStrike] = useState(null);
    const [votedStrikes, setVotedStrikes] = useState({});

    const activeStrikesNow = strikes.filter((strike) => {
        if (!strike.data_inizio || !strike.data_fine) return false;
        const start = new Date(strike.data_inizio);
        const end = new Date(strike.data_fine);
        return start <= now && end >= now;
    });

    const handleStrikeClick = (strike) => {
        setSelectedStrike(strike);
    };

    const handleVote = (id_sciopero, fonteNome) => {
        setVotedStrikes((prev) => ({ ...prev, [id_sciopero]: true }));
        alert(`Grazie per il voto! Hai confermato l'affidabilità della fonte: ${fonteNome}`);
    };

    const hasActiveStrikes = activeStrikesNow.length > 0;
    const showSidebar = isLoggedIn && hasActiveStrikes;

    return (
        <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Hero Section */}
            <div className="hero-section" style={{ marginBottom: '20px' }}>
                <h2 className="hero-title">Monitoraggio in Tempo Reale</h2>
                <p className="hero-subtitle">Mappa interattiva delle regioni con scioperi attivi in questo momento.</p>
            </div>

            {/* Indicatore di Stato Nazionale della Circolazione con link "Esplora dettagli" */}
            <div style={{
                width: '100%',
                maxWidth: '1100px',
                marginBottom: '30px',
                padding: '14px 20px',
                borderRadius: '12px',
                background: hasActiveStrikes ? 'rgba(220, 38, 38, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${hasActiveStrikes ? 'rgba(220, 38, 38, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {hasActiveStrikes ? (
                        <AlertTriangle size={20} style={{ color: '#dc2626' }} />
                    ) : (
                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        Stato circolazione nazionale: {' '}
                        <strong style={{ color: hasActiveStrikes ? '#dc2626' : '#10b981' }}>
                            {hasActiveStrikes ? `Attenzione: ${activeStrikesNow.length} scioperi attivi` : 'Regolare (Nessun disservizio live)'}
                        </strong>
                    </span>
                </div>

                <button
                    onClick={() => setActiveTab('scioperi')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        padding: 0
                    }}
                >
                    Esplora dettagli <ArrowRight size={14} />
                </button>
            </div>

            {/* Contenitore dinamico a due colonne se c'è la sidebar, altrimenti a colonna singola centrata */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: showSidebar ? '320px 1fr' : '1fr',
                gap: '24px',
                width: '100%',
                alignItems: 'start',
                marginBottom: '40px',
                justifyContent: 'center'
            }}>

                {/* COLONNA SINISTRA: Voto Affidabilità Fonti */}
                {showSidebar && (
                    <div className="strike-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} style={{ color: 'var(--accent, #dc2626)' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Vota Affidabilità Fonti</h3>
                        </div>
                        <p style={{ fontSize: '13px', opacity: 0.7, margin: 0, lineHeight: '1.4' }}>
                            Conferma l'accuratezza delle fonti per gli scioperi rilevati live in questo momento.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                            {activeStrikesNow.map((strike) => {
                                const hasVoted = votedStrikes[strike.id_sciopero];
                                return (
                                    <div key={strike.id_sciopero} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, marginBottom: '4px' }}>
                                            {strike.citta} ({strike.settore})
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--accent, #dc2626)' }}>
                                            Fonte: {strike.fonte_nome || 'Ufficiale'}
                                        </div>

                                        <button
                                            onClick={() => handleVote(strike.id_sciopero, strike.fonte_nome)}
                                            disabled={hasVoted}
                                            className="action-btn"
                                            style={{
                                                width: '100%',
                                                padding: '6px 10px',
                                                fontSize: '12px',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                backgroundColor: hasVoted ? '#10b981' : 'var(--accent, #dc2626)',
                                                cursor: hasVoted ? 'default' : 'pointer'
                                            }}
                                        >
                                            <ThumbsUp size={14} /> {hasVoted ? 'Fonte Convalidata ✓' : 'Vota Affidabile'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* COLONNA MAPPA */}
                <div className="map-container" style={{ width: '100%', height: '520px', margin: '0 auto' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    <img
                        src="/src/assets/italy-map.png"
                        alt="Mappa Italia Regioni"
                        className="map-image"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />

                    {activeStrikesNow.map((strike) => {
                        const isMilano = strike.citta && strike.citta.toLowerCase().includes('milano');
                        const topPos = isMilano ? '23%' : '45%';
                        const leftPos = isMilano ? '40%' : '50%';

                        return (
                            <div
                                key={strike.id_sciopero}
                                className="map-marker"
                                onClick={() => handleStrikeClick(strike)}
                                style={{ top: topPos, left: leftPos }}
                                title={`Sciopero attivo a ${strike.citta}`}
                            >
                                <div className="map-marker-dot"></div>
                                <div className="map-marker-label">{strike.citta} ({strike.settore})</div>
                            </div>
                        );
                    })}

                    <div className="map-info-box">
                        <span>{activeStrikesNow.length} scioperi live</span>
                        <button className="action-btn" onClick={() => setActiveTab('scioperi')}>
                            Vedi Tutti i Live
                        </button>
                    </div>
                </div>

            </div>

            {/* Sezione Scioperi in Corso Ora sotto */}
            <div style={{ width: '100%', textAlign: 'left' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} style={{ color: 'var(--accent, #dc2626)' }} /> Scioperi in Corso Ora
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', width: '100%' }}>
                    {hasActiveStrikes ? (
                        activeStrikesNow.map((strike) => (
                            <div
                                key={strike.id_sciopero}
                                className="strike-card"
                                onClick={() => handleStrikeClick(strike)}
                                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="strike-badge">{strike.settore}</span>
                                        <span className="strike-city"><MapPin size={14} /> {strike.citta}</span>
                                    </div>
                                    <p style={{ fontSize: '15px', fontWeight: '550', margin: '8px 0', lineHeight: '1.4' }}>
                                        {strike.descrizione_sintetica}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(128,128,128,0.2)', fontSize: '12px', opacity: 0.8 }}>
                                    <span>Termina il: {new Date(strike.data_fine).toLocaleString()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--accent, #dc2626)' }}>
                                        Dettagli <ArrowRight size={14} />
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="strike-card" style={{ padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>
                            <p style={{ margin: 0, fontSize: '15px', opacity: 0.8 }}>Nessuno sciopero attivo in questo momento esatto. La circolazione è regolare.</p>
                        </div>
                    )}
                </div>
            </div>

            <StrikeDetailModal
                strike={selectedStrike}
                isOpen={!!selectedStrike}
                onClose={() => setSelectedStrike(null)}
            />

        </div>
    );
}