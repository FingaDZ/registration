import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

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

    return (
        <div className="app" style={{ justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle at center, #1e1e1e 0%, #000000 100%)' }}>

            <div style={{
                background: 'rgba(18, 18, 18, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '3rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '0px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{
                        fontFamily: "'Chakra Petch', sans-serif",
                        fontSize: '1.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)'
                    }}>
                        Bienvenue
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', function: '0.9rem' }}>Système d'Enregistrement</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                            Identifiant
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                background: '#000',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                padding: '0.875rem',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                            className="login-input"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                background: '#000',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                padding: '0.875rem',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                            className="login-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: 'var(--primary)',
                            color: 'black',
                            border: 'none',
                            padding: '1rem',
                            borderRadius: '999px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            cursor: isLoading ? 'wait' : 'pointer',
                            transition: 'transform 0.2s',
                            opacity: isLoading ? 0.7 : 1
                        }}
                        onMouseOver={(e) => !isLoading && (e.target.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#52525b' }}>
                        &copy; 2026 SARL AIRBAND
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
