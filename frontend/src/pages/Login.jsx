import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css'; // Ensure we have styles

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    // Inline styles for simplicity, utilizing existing CSS vars where possible
    const pageStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
    };

    const cardStyle = {
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #e2e8f0'
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>Connexion</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Registration System</p>
                </div>

                {error && (
                    <div className="status-warning" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Utilisateur</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Mot de passe</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
