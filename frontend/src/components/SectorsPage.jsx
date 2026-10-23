import { Train, Bus, Plane, Ship, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SectorsPage({ setActiveTab, setFilterSector }) {
    const sectors = [
        {
            id: "TPL",
            title: "Trasporto Pubblico Locale",
            description: "Autobus, tram, metropolitane e servizi di mobilità urbana gestiti dalle aziende locali (es. ATM, GTT, ATAC).",
            icon: <Bus size={28} style={{ color: 'var(--accent, #dc2626)' }} />,
            garanzie: "Garantito nelle fasce orarie di garanzia (solitamente dall'inizio del servizio fino alle 8:30 e dalle 17:00 alle 20:00)."
        },
        {
            id: "Ferroviario",
            title: "Settore Ferroviario",
            description: "Treni regionali, a lunga percorrenza e treni ad alta velocità operati da Trenitalia, Italo, Trenord e altri vettori.",
            icon: <Train size={28} style={{ color: 'var(--accent, #dc2626)' }} />,
            garanzie: "I treni a lunga percorrenza schedulati prima dell'inizio dello sciopero arrivano a destinazione. Previsti treni essenziali garantiti nei giorni feriali."
        },
        {
            id: "Aereo",
            title: "Settore Aereo",
            description: "Voli nazionali, internazionali, intercontinentali, compagnie aeree e personale di terra o navigante degli aeroporti.",
            icon: <Plane size={28} style={{ color: 'var(--accent, #dc2626)' }} />,
            garanzie: "Sono sempre garantiti i voli charter autorizzati o notificati in anticipo e i voli di Stato, emergenza o soccorso."
        },
        {
            id: "Marittimo",
            title: "Settore Marittimo",
            description: "Traghetti, navi di linea e collegamenti marittimi per il trasporto passeggeri e merci (inclusi i collegamenti con le isole minori).",
            icon: <Ship size={28} style={{ color: 'var(--accent, #dc2626)' }} />,
            garanzie: "Garantiti i collegamenti essenziali diurna con le isole minori che non dispongono di alternative di trasporto."
        }
    ];

    const handleSelectSector = (sectorId) => {
        setFilterSector(sectorId);
        setActiveTab('scioperi');
    };

    return (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-section">
                <h2 className="hero-title">Settori di Trasporto</h2>
                <p className="hero-subtitle">Esplora le categorie di mobilità interessate dagli scioperi e scopri le fasce di garanzia.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', width: '100%', marginBottom: '40px' }}>
                {sectors.map((sector) => (
                    <div
                        key={sector.id}
                        className="strike-card"
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px' }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)' }}>
                                    {sector.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{sector.title}</h3>
                                    <span className="strike-badge" style={{ marginTop: '4px', display: 'inline-block' }}>{sector.id}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', opacity: 0.85, marginBottom: '16px' }}>
                                {sector.description}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', opacity: 0.75, alignItems: 'start', background: 'rgba(128,128,128,0.08)', padding: '12px', borderRadius: '8px' }}>
                                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{sector.garanzie}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSelectSector(sector.id)}
                            className="action-btn"
                            style={{ marginTop: '20px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            Visualizza Scioperi {sector.id} <ArrowRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}