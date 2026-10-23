import {
    Mountain, Landmark, Waves, Building2, Palmtree,
    Sun, Trees, Compass, Castle, Anchor, Flame, Sparkles, MapPin
} from 'lucide-react';

export default function RegionsGrid() {
    // Mappa delle regioni italiane con icone caratteristiche dedicate
    const regions = [
        { name: 'Abruzzo', icon: Mountain },
        { name: 'Basilicata', icon: Castle },
        { name: 'Calabria', icon: Waves },
        { name: 'Campania', icon: Landmark },
        { name: 'Emilia-Romagna', icon: Building2 },
        { name: 'Friuli-Venezia Giulia', icon: Compass },
        { name: 'Lazio', icon: Landmark },
        { name: 'Liguria', icon: Anchor },
        { name: 'Lombardia', icon: Building2 },
        { name: 'Marche', icon: Trees },
        { name: 'Molise', icon: Sparkles },
        { name: 'Piemonte', icon: Mountain },
        { name: 'Puglia', icon: Sun },
        { name: 'Sardegna', icon: Palmtree },
        { name: 'Sicilia', icon: Flame },
        { name: 'Toscana', icon: Trees },
        { name: 'Trentino-Alto Adige', icon: Mountain },
        { name: 'Umbria', icon: Trees },
        { name: 'Valle d\'Aosta', icon: Mountain },
        { name: 'Veneto', icon: Landmark }
    ];

    const handleRegionClick = (regionName) => {
        alert(`Hai selezionato la regione: ${regionName}. Visualizzazione dettagli e scioperi in corso...`);
    };

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Header della sezione */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>Esplora per Regione</h2>
                <p style={{ fontSize: '15px', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                    Seleziona una regione per visualizzare i dettagli specifici e monitorare in tempo reale i trasporti e gli scioperi locali.
                </p>
            </div>

            {/* Griglia pulita con maggiore spaziatura */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
                width: '100%'
            }}>
                {regions.map((reg) => {
                    const IconComponent = reg.icon || MapPin;
                    return (
                        <div
                            key={reg.name}
                            onClick={() => handleRegionClick(reg.name)}
                            style={{
                                background: 'var(--card-bg, #1a1a1a)',
                                border: '1px solid var(--border)',
                                borderRadius: '14px',
                                padding: '22px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.borderColor = 'var(--accent, #dc2626)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                        >
                            {/* Box icona stilizzato */}
                            <div style={{
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'rgba(220, 38, 38, 0.1)',
                                color: 'var(--accent, #dc2626)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <IconComponent size={22} />
                            </div>

                            {/* Nome della regione */}
                            <span style={{ fontSize: '16px', fontWeight: '700', color: 'inherit' }}>
                                {reg.name}
                            </span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}