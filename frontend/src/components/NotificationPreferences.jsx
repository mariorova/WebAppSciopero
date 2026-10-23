import { useState } from 'react';
import { Bell, Check, Sliders, MapPin, Train } from 'lucide-react';

export default function NotificationPreferences({
    isLoggedIn,
    setActiveTab,
    selectedSectors,
    setSelectedSectors,
    selectedCities,
    setSelectedCities
}) {
    const [customCityInput, setCustomCityInput] = useState('');
    const [savedSuccess, setSavedSuccess] = useState(false);

    if (!isLoggedIn) {
        return (
            <div className="hero-section" style={{ marginTop: '60px', padding: '40px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--card-bg)', maxWidth: '600px', margin: '60px auto' }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', marginBottom: '16px' }}>
                    <Bell size={32} style={{ color: 'var(--accent, #dc2626)' }} />
                </div>
                <h2 className="hero-title">Gestione Notifiche</h2>
                <p className="hero-subtitle" style={{ marginBottom: '24px' }}>Devi effettuare l'accesso per configurare le tue preferenze di notifica personalizzate.</p>
                <button onClick={() => setActiveTab('home')} className="action-btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
                    Torna alla Home
                </button>
            </div>
        );
    }

    const availableSectors = [
        { id: 'TPL', label: 'TPL / Mezzi Locali' },
        { id: 'Ferroviario', label: 'Ferroviario (Treni)' },
        { id: 'Aereo', label: 'Aereo (Voli)' },
        { id: 'Marittimo', label: 'Marittimo (Traghetti)' }
    ];

    const toggleSector = (sectorId) => {
        if (selectedSectors.includes(sectorId)) {
            setSelectedSectors(selectedSectors.filter(s => s !== sectorId));
        } else {
            setSelectedSectors([...selectedSectors, sectorId]);
        }
    };

    const addCity = (e) => {
        e.preventDefault();
        if (customCityInput.trim() && !selectedCities.includes(customCityInput.trim())) {
            setSelectedCities([...selectedCities, customCityInput.trim()]);
            setCustomCityInput('');
        }
    };

    const removeCity = (cityToRemove) => {
        setSelectedCities(selectedCities.filter(c => c !== cityToRemove));
    };

    const handleSavePreferences = (e) => {
        e.preventDefault();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    return (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>

            <div className="hero-section">
                <h2 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Sliders size={24} style={{ color: 'var(--accent, #dc2626)' }} /> Preferenze Notifiche
                </h2>
                <p className="hero-subtitle">Seleziona i mezzi e le città di tuo interesse per ricevere avvisi mirati sugli scioperi.</p>
            </div>

            <form onSubmit={handleSavePreferences} className="strike-card" style={{ width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', boxSizing: 'border-box' }}>

                {/* Sezione 1: Selezione Mezzi / Settori */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Train size={18} style={{ color: 'var(--accent, #dc2626)' }} /> Mezzi e Settori di Interesse
                    </h3>
                    <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                        Seleziona quali categorie di trasporto vuoi monitorare attivamente.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {availableSectors.map((sector) => {
                            const isSelected = selectedSectors.includes(sector.id);
                            return (
                                <div
                                    key={sector.id}
                                    onClick={() => toggleSector(sector.id)}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isSelected ? 'var(--accent, #dc2626)' : 'var(--border)'}`,
                                        background: isSelected ? 'rgba(220, 38, 38, 0.05)' : 'rgba(128,128,128,0.03)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{sector.label}</span>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '4px',
                                        border: `1px solid ${isSelected ? 'var(--accent, #dc2626)' : 'var(--border)'}`,
                                        background: isSelected ? 'var(--accent, #dc2626)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                                    }}>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', width: '100%' }}></div>

                {/* Sezione 2: Selezione Città / Regioni */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} style={{ color: 'var(--accent, #dc2626)' }} /> Città o Regioni Monitorate
                    </h3>
                    <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                        Aggiungi le località per cui desideri ricevere avvisi tempestivi.
                    </p>

                    {/* Form aggiunta città */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Es. Bologna, Firenze, Napoli..."
                            value={customCityInput}
                            onChange={(e) => setCustomCityInput(e.target.value)}
                            className="filter-input"
                            style={{ flex: 1, height: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={addCity}
                            className="action-btn"
                            style={{ padding: '0 20px', height: '40px', fontSize: '13px', fontWeight: '600' }}
                        >
                            Aggiungi
                        </button>
                    </div>

                    {/* Tag città selezionate */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedCities.map((city) => (
                            <div
                                key={city}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 12px', borderRadius: '20px',
                                    background: 'rgba(128,128,128,0.1)', border: '1px solid var(--border)',
                                    fontSize: '13px', fontWeight: '500'
                                }}
                            >
                                <span>{city}</span>
                                <button
                                    type="button"
                                    onClick={() => removeCity(city)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center' }}
                                    title="Rimuovi"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {selectedCities.length === 0 && (
                            <span style={{ fontSize: '13px', opacity: 0.6, fontStyle: 'italic' }}>Nessuna città specifica selezionata (riceverai gli avvisi nazionali generali).</span>
                        )}
                    </div>
                </div>

                {/* Pulsante di salvataggio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <button
                        type="submit"
                        className="action-btn"
                        style={{ width: '100%', height: '44px', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}
                    >
                        Salva Preferenze Notifiche
                    </button>

                    {savedSuccess && (
                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center', fontSize: '13px', fontWeight: '500' }}>
                            Preferenze aggiornate con successo! Le modifiche sono state salvate.
                        </div>
                    )}
                </div>

            </form>

        </div>
    );
}