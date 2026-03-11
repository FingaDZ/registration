import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Inactivity timeout in ms (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * Decode JWT payload without a library (base64url → JSON)
 */
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return null;
    }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    // exp is in seconds, Date.now() in ms
    return decoded.exp * 1000 < Date.now();
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef(null);

    // --- Logout function ---
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    }, []);

    // --- Inactivity Timer ---
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        // Only run if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            inactivityTimer.current = setTimeout(() => {
                console.warn('[Auth] Session expirée pour inactivité (30 min)');
                logout();
                window.location.reload(); // Force redirect to login
            }, INACTIVITY_TIMEOUT);
        }
    }, [logout]);

    // --- On mount: check stored token ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            // Check if token is still valid
            if (isTokenExpired(token)) {
                console.warn('[Auth] Token expiré, déconnexion automatique');
                logout();
            } else {
                setUser(JSON.parse(storedUser));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                resetInactivityTimer();
            }
        }
        setLoading(false);
    }, [logout, resetInactivityTimer]);

    // --- Axios 401/403 interceptor ---
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && [401, 403].includes(error.response.status)) {
                    // Skip auto-logout on login route itself
                    const url = error.config?.url || '';
                    if (!url.includes('/api/auth/login')) {
                        console.warn('[Auth] Réponse 401/403, token invalide → déconnexion');
                        logout();
                        window.location.reload();
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [logout]);

    // --- User activity listeners (reset inactivity timer) ---
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handler = () => resetInactivityTimer();

        events.forEach(e => window.addEventListener(e, handler, { passive: true }));
        return () => events.forEach(e => window.removeEventListener(e, handler));
    }, [resetInactivityTimer]);

    // --- Login ---
    const login = async (username, password, retries = 3) => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                resetInactivityTimer();
                return { success: true };
            }
        } catch (error) {
            // If 502 (backend not ready yet) and retries remain
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

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

