import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // You can replace this with a nice spinner
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Chargement...
            </div>
        );
    }

    if (!user) {
        // Redirect to the login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;
