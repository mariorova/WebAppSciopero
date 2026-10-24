import { useState, useEffect } from 'react';
import { getStrikes } from './services/api';
import Navbar from './components/Navbar';
import HomeMap from './components/HomeMap';
import StrikesList from './components/StrikesList';
import RegionsGrid from './components/RegionsGrid';
import SectorsPage from './components/SectorsPage';
import SupportPage from './components/SupportPage';
import SupportGuidePage from './components/SupportGuidePage';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { Lock } from 'lucide-react';
import './index.css';

function App() {
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [filterCity, setFilterCity] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [selectedSectors, setSelectedSectors] = useState(['TPL', 'Ferroviario']);
  const [selectedCities, setSelectedCities] = useState(['Milano', 'Roma']);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Cattura il token di ritorno da OAuth nell'URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const userEmail = queryParams.get('email');

    if (token && userEmail) {
      setIsLoggedIn(true);
      setEmail(userEmail);
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`Accesso social effettuato con successo per: ${userEmail}`);
    }
  }, []);

  useEffect(() => {
    getStrikes()
      .then((data) => {
        // Correggendo qui: 'data' è già l'array pulito restituito da getStrikes()
        setStrikes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore nel recupero degli scioperi:", err);
        setError("Impossibile connettersi al server backend.");
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setActiveTab('home');
    alert("Logout effettuato con successo.");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione è irreversibile.")) {
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setActiveTab('home');
      alert("Il tuo account è stato eliminato con successo.");
    }
  };

  const handleTabChange = (tab) => {
    const protectedTabs = ['scioperi', 'mappa', 'settori'];

    if (protectedTabs.includes(tab) && !isLoggedIn) {
      setIsAuthOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? '' : 'light-mode'}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setIsAuthOpen={setIsAuthOpen}
        isLoggedIn={isLoggedIn}
        email={email}
        strikes={strikes}
        selectedSectors={selectedSectors}
        selectedCities={selectedCities}
      />

      <main className="main-content" style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomeMap
            setActiveTab={handleTabChange}
            setFilterCity={setFilterCity}
            strikes={strikes}
            isLoggedIn={isLoggedIn}
          />
        )}

        {activeTab === 'scioperi' && isLoggedIn && (
          <StrikesList
            strikes={strikes} loading={loading} error={error}
            filterCity={filterCity} setFilterCity={setFilterCity}
            filterSector={filterSector} setFilterSector={setFilterSector}
            filterDate={filterDate} setFilterDate={setFilterDate}
          />
        )}

        {activeTab === 'mappa' && isLoggedIn && <RegionsGrid />}

        {activeTab === 'settori' && isLoggedIn && (
          <SectorsPage setActiveTab={handleTabChange} setFilterSector={setFilterSector} />
        )}

        {activeTab === 'guide' && <SupportGuidePage />}

        {activeTab === 'supporto' && <SupportPage />}

        {['scioperi', 'mappa', 'settori'].includes(activeTab) && !isLoggedIn && (
          <div className="hero-section" style={{ marginTop: '60px', padding: '40px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--card-bg)' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', marginBottom: '16px' }}>
              <Lock size={32} style={{ color: 'var(--accent, #dc2626)' }} />
            </div>
            <h2 className="hero-title">Area Riservata</h2>
            <p className="hero-subtitle" style={{ marginBottom: '24px' }}>Devi effettuare l'accesso per visualizzare questa sezione.</p>
            <button onClick={() => setIsAuthOpen(true)} className="action-btn" style={{ padding: '10px 24px', fontSize: '14px' }}>
              Accedi o Registrati
            </button>
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isAuthOpen={isAuthOpen} setIsAuthOpen={setIsAuthOpen}
        isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        setIsLoggedIn={setIsLoggedIn}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        handleDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}

export default App;