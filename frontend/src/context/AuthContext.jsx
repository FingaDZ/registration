import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on load
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            // Set default axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password, retries = 3) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return { success: true };
            }
        } catch (error) {
            // S'il s'agit d'une erreur 502 (Backend pas encore prêt) et qu'il reste des essais
            if (error.response?.status === 502 && retries > 0) {
                console.warn(`Login 502 Gateway, retrying... (${retries} attempts left)`);
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(login(username, password, retries - 1));
                    }, 3000);
                });
            }

            console.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Échec de connexion (Serveur indisponible)'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
