import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuthChanges, logout } from '@/services/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(({ user, error }) => {
            if (error) console.error(error);
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        logout
    };

    if (loading) {
        return <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
