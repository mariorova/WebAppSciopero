import { useState } from 'react';
import { Calendar, MapPin, AlertCircle, Zap, Clock, ArrowRight, Compass } from 'lucide-react';
import StrikeDetailModal from './StrikeDetailModal';

export default function StrikesList({
    strikes, loading, error,
    filterCity, setFilterCity,
    filterSector, setFilterSector,
    filterDate, setFilterDate
}) {
    const now = new Date();
    const [selectedStrike, setSelectedStrike] = useState(null);
    const [filterLine, setFilterLine] = useState(''); // Nuovo stato per la ricerca tratta/linea

    const activeStrikesNow = strikes.filter((strike) => {
        if (!strike.data_inizio || !strike.data_fine) return false;
        const start = new Date(strike.data_inizio);
        const end = new Date(strike.data_fine);

        const isLive = start <= now && end >= now;
        const matchCity = filterCity === '' || (strike.citta && strike.citta.toLowerCase().includes(filterCity.toLowerCase()));
        const matchSector = filterSector === '' || (strike.settore && strike.settore.toLowerCase().includes(filterSector.toLowerCase()));
        const matchLine = filterLine === '' || (strike.linea && strike.linea.toLowerCase().includes(filterLine.toLowerCase())) || (strike.descrizione_sintetica && strike.descrizione_sintetica.toLowerCase().includes(filterLine.toLowerCase()));

        return isLive && matchCity && matchSector && matchLine;
    });

    const futureStrikes = strikes.filter((strike) => {
        if (!strike.data_inizio) return false;
        const start = new Date(strike.data_inizio);

        const isFuture = start > now;
        const matchCity = filterCity === '' || (strike.citta && strike.citta.toLowerCase().includes(filterCity.toLowerCase()));
        const matchSector = filterSector === '' || (strike.settore && strike.settore.toLowerCase().includes(filterSector.toLowerCase()));
        const matchLine = filterLine === '' || (strike.linea && strike.linea.toLowerCase().includes(filterLine.toLowerCase())) || (strike.descrizione_sintetica && strike.descrizione_sintetica.toLowerCase().includes(filterLine.toLowerCase()));

        return isFuture && matchCity && matchSector && matchLine;
    });

    return (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>

            <div className="hero-section" style={{ width: '100%', textAlign: 'center' }}>
                <h2 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Zap size={24} style={{ color: 'var(--accent, #dc2626)' }} /> Monitoraggio Scioperi
                </h2>
                <p className="hero-subtitle">Visualizza gli scioperi in corso e consulta quelli programmati per i prossimi giorni.</p>
            </div>

            {/* Contenitore Filtri Avanzati (Città, Settore e Linea/Tratta) */}
            <div className="filters-container" style={{ width: '100%', marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                    </select>
                </div>

                <div className="filter-group" style={{ margin: 0 }}>
                    <label className="filter-label">Linea / Tratta specifica</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Es. Frecciarossa, Metro M1..."
                            value={filterLine}
                            onChange={(e) => setFilterLine(e.target.value)}
                            className="filter-input"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
            </div>

            {loading && <p className="hero-subtitle">Caricamento scioperi in corso...</p>}
            {error && (
                <div className="error-banner" style={{ backgroundColor: '#450a0a', color: '#fecaca', border: '1px solid #7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* SEZIONE 1: SCIOPERI IN CORSO ORA */}
            <div style={{ width: '100%', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '750px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={20} style={{ color: 'var(--accent, #dc2626)' }} /> In Corso Ora ({activeStrikesNow.length})
                    </h3>
                </div>

                {!loading && activeStrikesNow.length === 0 && (
                    <div className="strike-card" style={{ padding: '24px', textAlign: 'center', width: '100%', maxWidth: '750px' }}>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Nessun disservizio live trovato per i filtri o la tratta selezionata.</p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
                    {activeStrikesNow.map((strike) => (
                        <div key={strike.id_sciopero} className="strike-card" onClick={() => setSelectedStrike(strike)} style={{ cursor: 'pointer', width: '100%', maxWidth: '750px' }}>
                            <div className="strike-header">
                                <span className="strike-badge">{strike.settore}</span>
                                <span className="strike-city">
                                    <MapPin size={16} /> {strike.citta}
                                </span>
                            </div>
                            <p className="strike-desc">{strike.descrizione_sintetica}</p>
                            {strike.linea && (
                                <div style={{ fontSize: '13px', color: 'var(--accent, #dc2626)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Compass size={14} /> Tratta/Linea: {strike.linea}
                                </div>
                            )}
                            <div className="strike-footer">
                                <Calendar size={16} />
                                <span>Dal: {new Date(strike.data_inizio).toLocaleString()}</span>
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
            </div>

            {/* SEZIONE 2: FUTURI SCIOPERI IN PROGRAMMA */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '750px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} style={{ color: '#3b82f6' }} /> Prossimi Scioperi in Programma ({futureStrikes.length})
                    </h3>
                </div>

                {!loading && futureStrikes.length === 0 && (
                    <div className="strike-card" style={{ padding: '24px', textAlign: 'center', width: '100%', maxWidth: '750px' }}>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Nessun nuovo sciopero pianificato per la tratta o i filtri selezionati.</p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
                    {futureStrikes.map((strike) => (
                        <div key={strike.id_sciopero} className="strike-card" onClick={() => setSelectedStrike(strike)} style={{ borderLeft: '4px solid #3b82f6', cursor: 'pointer', width: '100%', maxWidth: '750px' }}>
                            <div className="strike-header">
                                <span className="strike-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>{strike.settore}</span>
                                <span className="strike-city">
                                    <MapPin size={16} /> {strike.citta}
                                </span>
                            </div>
                            <p className="strike-desc">{strike.descrizione_sintetica}</p>
                            {strike.linea && (
                                <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Compass size={14} /> Tratta/Linea: {strike.linea}
                                </div>
                            )}
                            <div className="strike-footer">
                                <Calendar size={16} />
                                <span>Inizio previsto: {new Date(strike.data_inizio).toLocaleString()}</span>
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
            </div>

            <StrikeDetailModal
                strike={selectedStrike}
                isOpen={!!selectedStrike}
                onClose={() => setSelectedStrike(null)}
            />

        </div>
    );
}