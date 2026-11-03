import { useState } from 'react';
import { Calendar, MapPin, AlertCircle, Zap, Clock, ArrowRight, SearchX, RefreshCw } from 'lucide-react';
import StrikeDetailModal from './StrikeDetailModal';

export default function StrikesList({
    strikes = [], loading, error, onRetry,
    filterCity, setFilterCity,
    filterSector, setFilterSector,
    filterDate, setFilterDate
}) {
    const [selectedStrike, setSelectedStrike] = useState(null);
    const [filterLine, setFilterLine] = useState('');

    // Filtro pulito e permissivo basato sui campi effettivi restituiti dall'API
    const filteredStrikes = strikes.filter((strike) => {
        const matchCity = !filterCity || (strike.citta && strike.citta.toLowerCase().includes(filterCity.toLowerCase()));
        const matchSector = !filterSector || (strike.settore && strike.settore.toLowerCase().includes(filterSector.toLowerCase()));
        const matchLine = !filterLine || (strike.descrizione_sintetica && strike.descrizione_sintetica.toLowerCase().includes(filterLine.toLowerCase()));

        return matchCity && matchSector && matchLine;
    });

    // Divisione sicura basata sul campo 'stato' calcolato dal backend
    const activeStrikesNow = filteredStrikes.filter((strike) => strike.stato === 'in_corso');
    const otherStrikes = filteredStrikes.filter((strike) => strike.stato !== 'in_corso');

    // Verifica se sono stati applicati dei filtri di ricerca
    const isFiltered = filterCity !== '' || filterSector !== '' || filterLine !== '';

    return (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', paddingBottom: '40px' }}>

            <div className="hero-section" style={{ width: '100%', textAlign: 'center' }}>
                <h2 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Zap size={24} style={{ color: 'var(--accent, #dc2626)' }} /> Monitoraggio Scioperi
                </h2>
                <p className="hero-subtitle">Visualizza gli scioperi in corso e consulta quelli programmati per i prossimi giorni in tempo reale.</p>
            </div>

            {/* Filtri Avanzati */}
            <div className="filters-container" style={{ width: '100%', marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="filter-group" style={{ margin: 0 }}>
                    <label className="filter-label">Città / Regione</label>
                    <input
                        type="text"
                        placeholder="Es. Milano, Roma..."
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        className="filter-input"
                    />
                </div>

                <div className="filter-group" style={{ margin: 0 }}>
                    <label className="filter-label">Mezzo / Settore</label>
                    <select
                        value={filterSector}
                        onChange={(e) => setFilterSector(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tutti i settori</option>
                        <option value="TPL">TPL / Locale</option>
                        <option value="Ferroviario">Ferroviario</option>
                        <option value="Aereo">Aereo</option>
                        <option value="Marittimo">Marittimo</option>
                        <option value="Sciopero Generale">Sciopero Generale</option>
                    </select>
                </div>

                <div className="filter-group" style={{ margin: 0 }}>
                    <label className="filter-label">Parola chiave / Tratta</label>
                    <input
                        type="text"
                        placeholder="Es. Trenord, ATM, Metro..."
                        value={filterLine}
                        onChange={(e) => setFilterLine(e.target.value)}
                        className="filter-input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* GESTIONE STATO DI ERRORE */}
            {error && (
                <div className="error-banner" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <AlertCircle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px' }}>Errore di connessione o recupero dati</strong>
                            <span style={{ fontSize: '13px', opacity: 0.9 }}>{error}</span>
                        </div>
                    </div>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                        >
                            <RefreshCw size={14} /> Riprova
                        </button>
                    )}
                </div>
            )}

            {/* GESTIONE STATO DI CARICAMENTO */}
            {loading && strikes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', width: '100%' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px', border: '3px solid rgba(220, 38, 38, 0.2)', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p className="hero-subtitle" style={{ margin: 0 }}>Sincronizzazione dati ufficiali in corso...</p>
                </div>
            )}

            {/* STATO VUOTO (NESSUN RISULTATO DAI FILTRI) */}
            {!loading && strikes.length > 0 && filteredStrikes.length === 0 && (
                <div className="strike-card" style={{ padding: '40px 24px', textAlign: 'center', width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <SearchX size={40} style={{ opacity: 0.4, color: 'var(--accent, #dc2626)' }} />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Nessun risultato trovato</h3>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.7, maxWidth: '400px' }}>Nessuno sciopero corrisponde ai criteri di ricerca o ai filtri applicati. Prova a reimpostarli.</p>
                    <button
                        onClick={() => { setFilterCity(''); setFilterSector(''); setFilterLine(''); }}
                        style={{ marginTop: '8px', background: 'transparent', border: '1px solid currentColor', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Resetta filtri
                    </button>
                </div>
            )}

            {/* SEZIONE 1: SCIOPERI IN CORSO ORA */}
            {filteredStrikes.length > 0 && (
                <div style={{ width: '100%', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '750px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} style={{ color: 'var(--accent, #dc2626)' }} /> In Corso Ora ({activeStrikesNow.length})
                        </h3>
                    </div>

                    {activeStrikesNow.length === 0 ? (
                        <div className="strike-card" style={{ padding: '20px', textAlign: 'center', width: '100%', maxWidth: '750px' }}>
                            <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>Nessun disservizio live al momento.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
                            {activeStrikesNow.map((strike) => (
                                <div key={strike.id_sciopero} className="strike-card" onClick={() => setSelectedStrike(strike)} style={{ cursor: 'pointer', width: '100%', maxWidth: '750px' }}>
                                    <div className="strike-header">
                                        <span className="strike-badge">{strike.settore}</span>
                                        <span className="strike-city">
                                            <MapPin size={16} /> {strike.citta}
                                        </span>
                                    </div>
                                    <p className="strike-desc">{strike.descrizione_sintetica}</p>
                                    <div className="strike-footer">
                                        <Calendar size={16} />
                                        <span>Dal: {new Date(strike.data_inizio).toLocaleString()} al {new Date(strike.data_fine).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(128,128,128,0.2)', fontSize: '12px' }}>
                                        <span style={{ opacity: 0.8 }}>Fonte: {strike.fonte_nome}</span>
                                        <span style={{ color: 'var(--accent, #dc2626)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Dettagli <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SEZIONE 2: ALTRI SCIOPERI IN PROGRAMMA */}
            {filteredStrikes.length > 0 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '750px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} style={{ color: '#3b82f6' }} /> Altri Scioperi in Programma ({otherStrikes.length})
                        </h3>
                    </div>

                    {otherStrikes.length === 0 ? (
                        <div className="strike-card" style={{ padding: '20px', textAlign: 'center', width: '100%', maxWidth: '750px' }}>
                            <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>Nessun altro sciopero in programma al momento.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
                            {otherStrikes.map((strike) => (
                                <div key={strike.id_sciopero} className="strike-card" onClick={() => setSelectedStrike(strike)} style={{ borderLeft: '4px solid #3b82f6', cursor: 'pointer', width: '100%', maxWidth: '750px' }}>
                                    <div className="strike-header">
                                        <span className="strike-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>{strike.settore}</span>
                                        <span className="strike-city">
                                            <MapPin size={16} /> {strike.citta}
                                        </span>
                                    </div>
                                    <p className="strike-desc">{strike.descrizione_sintetica}</p>
                                    <div className="strike-footer">
                                        <Calendar size={16} />
                                        <span>Inizio: {new Date(strike.data_inizio).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(128,128,128,0.2)', fontSize: '12px' }}>
                                        <span style={{ opacity: 0.8 }}>Fonte: {strike.fonte_nome}</span>
                                        <span style={{ color: '#3b82f6', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Dettagli <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <StrikeDetailModal
                strike={selectedStrike}
                isOpen={!!selectedStrike}
                onClose={() => setSelectedStrike(null)}
            />

        </div>
    );
}