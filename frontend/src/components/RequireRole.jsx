import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireRole = ({ children, role }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Admin has access to everything
    if (user.role === 'admin') {
        return children;
    }

    // Check specific role
    if (user.role === role) {
        return children;
    }

    // Redirect to home if unauthorized
    return <Navigate to="/" replace />;
};

export default RequireRole;
