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

    const login = async (username, password) => {
        try {
            // Adjust URL based on environment (Vite proxy handles /api usually, but explicit here if needed)
            // Using relative path assuming proxy or same origin
            const response = await axios.post('/api/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data;

                // Save to storage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Set state
                setUser(user);

                // Set header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return { success: true };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Échec de connexion'
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
