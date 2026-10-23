import { X, Calendar, MapPin, ShieldCheck, Building2, Users, Download } from 'lucide-react';

export default function StrikeDetailModal({ strike, isOpen, onClose }) {
    if (!isOpen || !strike) return null;

    // Funzione per generare e scaricare il file .ics del calendario
    const handleAddToCalendar = () => {
        const startDate = new Date(strike.data_inizio).toISOString().replace(/-|:|\.\d+/g, '');
        const endDate = new Date(strike.data_fine).toISOString().replace(/-|:|\.\d+/g, '');
        const title = `Sciopero ${strike.settore} - ${strike.cital || strike.citta}`;
        const description = `${strike.descrizione_sintetica}\\nFonte: ${strike.fonte_nome || 'Ufficiale'}`;

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `LOCATION:${strike.citta}, Italia`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sciopero_${strike.citta.toLowerCase()}_${strike.settore.toLowerCase()}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("File calendario scaricato con successo! Aprilo per aggiungerlo al tuo calendario.");
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px', padding: '32px', textAlign: 'left', position: 'relative' }}>

                {/* Pulsante di chiusura */}
                <button onClick={onClose} className="modal-close">
                    <X size={20} />
                </button>

                {/* Intestazione del Modale */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span className="strike-badge" style={{ fontSize: '13px', padding: '4px 10px' }}>{strike.settore}</span>
                    <span className="strike-city" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={16} /> {strike.citta}
                    </span>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', lineHeight: '1.4' }}>
                    {strike.descrizione_sintetica}
                </h2>

                {/* Dettagli temporali */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', borderRadius: '10px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                        <Calendar size={18} style={{ color: 'var(--accent, #dc2626)' }} />
                        <span><strong>Inizio:</strong> {new Date(strike.data_inizio).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                        <Calendar size={18} style={{ color: 'var(--accent, #dc2626)' }} />
                        <span><strong>Termine:</strong> {new Date(strike.data_fine).toLocaleString()}</span>
                    </div>
                </div>

                {/* Informazioni aggiuntive */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Users size={18} style={{ opacity: 0.6, marginTop: '2px' }} />
                        <div>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>Sigle Sindacali Proclamanti:</strong>
                            <span style={{ opacity: 0.8 }}>FILT-CGIL, FIT-CISL, UILTRASPORTI, UGL Autoferrotranvieri</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Building2 size={18} style={{ opacity: '0.6', marginTop: '2px' }} />
                        <div>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>Aziende / Comparto Coinvolto:</strong>
                            <span style={{ opacity: '0.8' }}>Società di trasporto pubblico locale e personale viaggiante di rete.</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <ShieldCheck size={18} style={{ opacity: '0.6', marginTop: '2px' }} />
                        <div>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>Fonte Ufficiale:</strong>
                            <span style={{ opacity: '0.8', color: 'var(--accent, #dc2626)', fontWeight: '500' }}>{strike.fonte_nome || 'Commissione Garanzia Scioperi'}</span>
                        </div>
                    </div>
                </div>

                {/* Pulsanti di azione (incluso Aggiungi al Calendario) */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleAddToCalendar}
                        className="action-btn"
                        style={{ flex: 1, height: '42px', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}
                    >
                        <Download size={16} /> Salva su Calendario
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, height: '42px', backgroundColor: 'transparent',
                            color: 'inherit', border: '1px solid var(--border)',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                        }}
                    >
                        Chiudi
                    </button>
                </div>

            </div>
        </div>
    );
}