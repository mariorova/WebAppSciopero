import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState(null);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    const faqs = [
        {
            q: "Da dove provengono i dati sugli scioperi?",
            a: "I dati vengono sincronizzati regolarmente dai database ufficiali e dalle fonti autorizzate dei trasporti (come ATM, Trenitalia e Commissione di Garanzia Scioperi)."
        },
        {
            q: "Come posso filtrare gli scioperi per la mia città?",
            a: "Vai nella sezione 'Scioperi' dal menu in alto e digita il nome della tua città o seleziona il settore di tuo interesse nell'apposita barra dei filtri."
        },
        {
            q: "Il servizio di notifica e avvisi è gratuito?",
            a: "Sì, creando un account potrai accedere a tutte le funzionalità di monitoraggio e avviso in modo completamente gratuito."
        },
        {
            q: "Cosa devo fare se riscontri un errore in uno sciopero?",
            a: "Puoi inviarci una segnalazione diretta compilando il modulo di contatto sottostante in questa pagina di supporto."
        }
    ];

    const handleContactSubmit = (e) => {
        e.preventDefault();
        alert(`Grazie ${contactName}! La tua richiesta di supporto è stata inviata con successo.`);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
    };

    return (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-section">
                <h2 className="hero-title">Centro Supporto & FAQ</h2>
                <p className="hero-subtitle">Hai bisogno di aiuto? Trova le risposte alle domande frequenti o inviaci una segnalazione.</p>
            </div>

            <div style={{ width: '100%', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={22} color="var(--accent, #dc2626)" /> Domande Frequenti (FAQ)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div
                                key={index}
                                onClick={() => setOpenFaq(isOpen ? null : index)}
                                className="strike-card"
                                style={{ cursor: 'pointer', padding: '18px 24px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', fontSize: '15px' }}>{faq.q}</span>
                                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                                {isOpen && (
                                    <p style={{ marginTop: '12px', fontSize: '14px', opacity: 0.8, lineHeight: '1.5', borderTop: '1px solid rgba(128,128,128,0.2)', paddingTop: '12px' }}>
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="strike-card" style={{ width: '100%', padding: '32px', boxSizing: 'border-box' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Invia una Segnalazione</h3>
                <p className="hero-subtitle" style={{ textAlign: 'left', marginBottom: '24px' }}>Hai riscontrato un errore o desideri contattare il nostro team? Compila il form qui sotto.</p>

                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
                            <label className="filter-label">Il tuo Nome</label>
                            <input
                                type="text"
                                required
                                placeholder="Mario Rossi"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="filter-input"
                            />
                        </div>
                        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
                            <label className="filter-label">La tua Email</label>
                            <input
                                type="email"
                                required
                                placeholder="nome@esempio.it"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Messaggio / Segnalazione</label>
                        <textarea
                            required
                            rows="4"
                            placeholder="Descrivi il problema o la richiesta..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="filter-input"
                            style={{ height: 'auto', resize: 'vertical' }}
                        />
                    </div>

                    <button type="submit" className="action-btn" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                        <Send size={16} /> Invia Messaggio
                    </button>
                </form>
            </div>
        </div>
    );
}