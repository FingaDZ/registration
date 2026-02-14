import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FormSelector from './components/FormSelector';
import ParticuliersForm from './components/ParticuliersForm';
import EntrepriseForm from './components/EntrepriseForm';
import DocumentHistory from './components/DocumentHistory';

function App() {
    return (
        <Router>
            <div className="app">
                <nav className="navbar">
                    <div className="nav-container">
                        <Link to="/" className="nav-logo">
                            <img src="/logo.jpg" alt="Logo" className="nav-logo-img" />
                            <span>SARL AIRBAND</span>
                        </Link>
                        <div className="nav-links">
                            <Link to="/" className="nav-link">Accueil</Link>
                            <Link to="/history" className="nav-link">Historique</Link>
                        </div>
                    </div>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<FormSelector />} />
                        <Route path="/particuliers" element={<ParticuliersForm />} />
                        <Route path="/entreprise" element={<EntrepriseForm />} />
                        <Route path="/history" element={<DocumentHistory />} />
                    </Routes>
                </main>

                <footer className="footer">
                    <p>© 2026 Système d'Enregistrement - Tous droits réservés</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
