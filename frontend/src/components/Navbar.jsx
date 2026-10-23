import { Train, MessageSquare, Sun, Moon, User } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ activeTab, setActiveTab, isDarkMode, setIsDarkMode, setIsAuthOpen, isLoggedIn, email, strikes, selectedSectors, selectedCities }) {
    const accentColor = isDarkMode ? '#dc2626' : '#2563eb';
    const username = email ? email.split('@')[0] : 'Utente';

    return (
        <header className="navbar">
            <div className="navbar-brand" onClick={() => setActiveTab('home')}>
                <Train size={32} color={accentColor} />
                <h1 className="navbar-title">ScioperiFacili</h1>
            </div>

            <nav className="nav-links">
                <span className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</span>
                <span className={`nav-link ${activeTab === 'scioperi' ? 'active' : ''}`} onClick={() => setActiveTab('scioperi')}>Scioperi</span>
                <span className={`nav-link ${activeTab === 'mappa' ? 'active' : ''}`} onClick={() => setActiveTab('mappa')}>Mappa</span>
                <span className={`nav-link ${activeTab === 'settori' ? 'active' : ''}`} onClick={() => setActiveTab('settori')}>Settori</span>
                <span className={`nav-link ${activeTab === 'guide' ? 'active' : ''}`} onClick={() => setActiveTab('guide')}>Guide</span>
                <span className={`nav-link ${activeTab === 'supporto' ? 'active' : ''}`} onClick={() => setActiveTab('supporto')}>Supporto</span>
            </nav>

            <div className="navbar-actions">
                {/* Mostriamo la campanella con dropdown notifiche solo se loggato */}
                {isLoggedIn && (
                    <NotificationDropdown
                        strikes={strikes}
                        selectedSectors={selectedSectors}
                        selectedCities={selectedCities}
                    />
                )}

                <a href="https://discord.com" target="_blank" rel="noreferrer" className="icon-btn" title="Discord">
                    <MessageSquare size={18} />
                </a>

                <button onClick={() => setIsDarkMode(!isDarkMode)} className="icon-btn" title="Cambia tema">
                    {isDarkMode ? <Sun size={18} color="#eab308" /> : <Moon size={18} color="#2563eb" />}
                </button>

                <div className="divider"></div>

                {isLoggedIn ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            Benvenuto, <span style={{ color: accentColor }}>{username}</span>
                        </span>
                        <button onClick={() => setIsAuthOpen(true)} className="icon-btn" title="Gestisci Account">
                            <User size={18} />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsAuthOpen(true)} className="login-btn">
                        <User size={15} /> Accedi
                    </button>
                )}
            </div>
        </header>
    );
}