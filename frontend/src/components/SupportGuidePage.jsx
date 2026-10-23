import { Clock, FileText, CheckCircle, ExternalLink, Globe } from 'lucide-react';

export default function SupportGuidePage() {
    return (
        <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>

            {/* Intestazione */}
            <div className="hero-section">
                <h2 className="hero-title">Guide Utili & Fasce di Garanzia</h2>
                <p className="hero-subtitle">Tutto quello che c'è da sapere sui tuoi diritti e sulle normative durante gli scioperi in Italia.</p>
            </div>

            {/* Contenuto delle Guide */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Card 1: Fasce di Garanzia */}
                <div className="strike-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex' }}>
                            <Clock size={24} style={{ color: 'var(--accent, #dc2626)' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Le Fasce Orarie di Garanzia</h3>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, marginBottom: '16px' }}>
                        Per legge (L. 146/1990), nei servizi pubblici essenziali come il trasporto locale, ferroviario e aereo, devono essere garantite determinate fasce orarie in cui i collegamenti non possono essere interrotti.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6', opacity: 0.85, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Trasporto Locale (TPL / Metro / Bus):</strong> Solitamente garantito dall'inizio del servizio diurno fino alle 08:59 e dalle 17:00 alle 19:59.</li>
                        <li><strong>Trasporto Ferroviario (Trenitalia / Italo):</strong> Fasce orarie protette solitamente dalle 06:00 alle 09:00 e dalle 18:00 alle 21:00 nei giorni feriali.</li>
                        <li><strong>Voli Aerei:</strong> Sono sempre garantiti i voli intercontinentali in arrivo e i voli schedulati nelle fasce protette (generalmente 07:00-10:00 e 18:00-21:00).</li>
                    </ul>
                </div>

                {/* Card 2: Diritti del Passeggero e Rimborsi */}
                <div className="strike-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'inline-flex' }}>
                            <FileText size={24} style={{ color: '#3b82f6' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Diritti dei Passeggeri e Rimborsi</h3>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, marginBottom: '16px' }}>
                        In caso di cancellazione o ritardo prolungato causato da uno sciopero proclamato regolarmente:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)' }}>
                            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Treni & Bus</strong>
                            <span style={{ fontSize: '13px', opacity: 0.8, lineHeight: '1.4' }}>Hai diritto al rimborso integrale del biglietto o alla riprotezione sul primo treno utile disponibile.</span>
                        </div>
                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)' }}>
                            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Voli Aerei</strong>
                            <span style={{ fontSize: '13px', opacity: 0.8, lineHeight: '1.4' }}>La compagnia aerea è tenuta a offrire l'assistenza (pasti e bevande), il rimborso o un volo alternativo, sebbene lo sciopero sia considerato "circostanza eccezionale".</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: L'Affidabilità delle Segnalazioni */}
                <div className="strike-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'inline-flex' }}>
                            <CheckCircle size={24} style={{ color: '#10b981' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>L'Affidabilità delle Segnalazioni</h3>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, margin: 0 }}>
                        Tutti i dati visualizzati su <strong>ScioperiFacili</strong> provengono dalla Commissione di Garanzia dell'attuazione della legge sullo sciopero nei servizi pubblici essenziali e dai canali ufficiali delle aziende di trasporto. Gli utenti registrati possono inoltre validare l'accuratezza delle fonti in tempo reale direttamente dalla schermata principale.
                    </p>
                </div>

                {/* Card 4: Link Ufficiali e Portali di Riferimento */}
                <div className="strike-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'inline-flex' }}>
                            <Globe size={24} style={{ color: '#a855f7' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Link Ufficiali e Fonti di Riferimento</h3>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, marginBottom: '16px' }}>
                        Per approfondimenti normativi e per verificare gli elenchi completi pubblicati dagli enti istituzionali, puoi consultare i seguenti link ufficiali:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <a
                            href="https://www.cgsiglio.it"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '12px 16px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)', color: 'inherit', textDecoration: 'none', transition: 'background 0.2s' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>Commissione di Garanzia Scioperi</span>
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>Calendario ufficiale e proclamazioni nazionali</span>
                            </div>
                            <ExternalLink size={16} style={{ opacity: 0.6 }} />
                        </a>

                        <a
                            href="https://www.mit.gov.it"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '12px 16px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>Ministero delle Infrastrutture e dei Trasporti</span>
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>Normative sui trasporti e ordinanze di riduzioni</span>
                            </div>
                            <ExternalLink size={16} style={{ opacity: 0.6 }} />
                        </a>

                        <a
                            href="https://www.enac.gov.it"
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '12px 16px', borderRadius: '8px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>ENAC (Ente Nazionale Aviazione Civile)</span>
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>Informazioni sui voli garantiti in caso di sciopero aereo</span>
                            </div>
                            <ExternalLink size={16} style={{ opacity: 0.6 }} />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}