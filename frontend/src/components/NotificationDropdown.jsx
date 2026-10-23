import { useState, useRef, useEffect } from 'react';
import { Bell, Calendar, ShieldAlert } from 'lucide-react';

export default function NotificationDropdown({ strikes = [], selectedSectors, selectedCities }) {
    const [isOpen, setIsOpen] = useState(false);

    // Inizializziamo lo stato leggendo dal localStorage per garantire la persistenza
    const [readIds, setReadIds] = useState(() => {
        try {
            const saved = localStorage.getItem('scioperifacili_read_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const dropdownRef = useRef(null);

    // Salviamo nel localStorage ogni volta che l'array dei letti cambia
    useEffect(() => {
        try {
            localStorage.setItem('scioperifacili_read_notifications', JSON.stringify(readIds));
        } catch (e) {
            console.error("Errore nel salvataggio delle notifiche lette:", e);
        }
    }, [readIds]);

    // Filtriamo gli scioperi in base alle preferenze dell'utente
    const matchedStrikes = strikes.filter((strike) => {
        const matchSector = selectedSectors.length === 0 || selectedSectors.some(s => strike.settore && strike.settore.toLowerCase().includes(s.toLowerCase()));
        const matchCity = selectedCities.length === 0 || selectedCities.some(c => strike.citta && strike.citta.toLowerCase().includes(c.toLowerCase()));
        return matchSector || matchCity;
    });

    // Calcoliamo quanti avvisi NON sono ancora stati letti
    const unreadStrikes = matchedStrikes.filter(strike => !readIds.includes(strike.id_sciopero));

    // Funzione per segnare una notifica come letta in modo persistente
    const handleNotificationClick = (id) => {
        if (!readIds.includes(id)) {
            setReadIds(prev => [...prev, id]);
        }
    };

    // Chiudi il menu se si clicca al di fuori di esso
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Icona Campanella con badge numerico (mostra solo i non letti) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-btn"
                title="Centro Avvisi"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%' }}
            >
                <Bell size={19} />
                {unreadStrikes.length > 0 && (
                    <span style={{
                        position: 'absolute', top: '0px', right: '0px',
                        background: 'var(--accent, #dc2626)', color: '#fff',
                        fontSize: '11px', fontWeight: '700', width: '18px', height: '18px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(220, 38, 38, 0.4)'
                    }}>
                        {unreadStrikes.length}
                    </span>
                )}
            </button>

            {/* Menu a tendina (Dropdown) */}
            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, top: '48px', width: '360px',
                    maxHeight: '440px', overflowY: 'auto', background: 'var(--card-bg, #1a1a1a)',
                    border: '1px solid var(--border)', borderRadius: '16px',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.4)', zIndex: 1000, padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left'
                }}>
                    {/* Header del menu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={16} style={{ color: 'var(--accent, #dc2626)' }} />
                            <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>Centro Avvisi</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '500', padding: '2px 8px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent, #dc2626)' }}>
                            {unreadStrikes.length} {unreadStrikes.length === 1 ? 'da leggere' : 'da leggere'}
                        </span>
                    </div>

                    {/* Lista delle notifiche */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {matchedStrikes.length > 0 ? (
                            matchedStrikes.map((strike) => {
                                const isUnread = !readIds.includes(strike.id_sciopero);
                                return (
                                    <div
                                        key={strike.id_sciopero}
                                        onClick={() => handleNotificationClick(strike.id_sciopero)}
                                        style={{
                                            padding: '12px 14px', borderRadius: '10px',
                                            background: isUnread ? 'rgba(220, 38, 38, 0.05)' : 'rgba(128,128,128,0.02)',
                                            border: `1px solid ${isUnread ? 'rgba(220, 38, 38, 0.3)' : 'var(--border)'}`,
                                            display: 'flex', flexDirection: 'column', gap: '6px',
                                            cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent, #dc2626)', letterSpacing: '0.5px' }}>
                                                {strike.settore || 'TPL'} • {strike.citta || 'Nazionale'}
                                            </span>
                                            {isUnread && (
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent, #dc2626)' }} title="Da leggere"></span>
                                            )}
                                        </div>

                                        <div style={{ fontSize: '13px', fontWeight: isUnread ? '700' : '500', lineHeight: '1.4', color: 'inherit' }}>
                                            {strike.descrizione_sintetica}
                                        </div>

                                        <div style={{ fontSize: '12px', opacity: 0.65, display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '4px' }}>
                                            <Calendar size={13} /> {new Date(strike.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '30px 20px', textAlign: 'center', fontSize: '13px', opacity: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <Bell size={24} style={{ opacity: 0.3 }} />
                                <span>Nessun avviso recente per le tue preferenze salvate.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}