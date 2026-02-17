import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import FormSelector from './components/FormSelector';
import ParticuliersForm from './components/ParticuliersForm';
import EntrepriseForm from './components/EntrepriseForm';
import DocumentHistory from './components/DocumentHistory';
import RequireRole from './components/RequireRole';
import UserManagement from './pages/UserManagement';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/*" element={
                        <RequireAuth>
                            <MainLayout />
                        </RequireAuth>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

import { useAuth } from './context/AuthContext';

function MainLayout() {
    const { logout, user } = useAuth();

    return (
        <div className="app">
            <nav className="navbar">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <img src="/logo.jpg" alt="Logo" className="nav-logo-img" />
                        <span>SARL AIRBAND</span>
                    </Link>
                    <div className="nav-links">
                        <Link to="/" className="nav-link">Accueil</Link>

                        {/* Admin Only Links */}
                        {user?.role === 'admin' && (
                            <>
                                <Link to="/history" className="nav-link">Historique</Link>
                                <Link to="/users" className="nav-link">Utilisateurs</Link>
                            </>
                        )}

                        <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
                            Déconnexion ({user?.username})
                        </button>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<FormSelector />} />
                    <Route path="/particuliers" element={<ParticuliersForm />} />
                    <Route path="/entreprise" element={<EntrepriseForm />} />

                    {/* Protected Admin Routes */}
                    <Route path="/history" element={
                        <RequireRole role="admin">
                            <DocumentHistory />
                        </RequireRole>
                    } />

                    <Route path="/users" element={
                        <RequireRole role="admin">
                            <UserManagement />
                        </RequireRole>
                    } />
                </Routes>
            </main>

            <footer className="footer">
                <p>© 2026 Système d'Enregistrement - Tous droits réservés</p>
            </footer>
        </div>
    );
}

export default App;
