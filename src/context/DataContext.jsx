import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToClasses, subscribeToUnits, subscribeToSchedules } from '@/services/db';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [clases, setClases] = useState([]);
    const [units, setUnits] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    const LOCAL_USER_ID = 'local-user'; // Ensure consistency with db.js

    useEffect(() => {
        // FALLBACK: If no authenticated user, use LOCAL_USER_ID for Dexie.
        // This supports the "sin admin" / local-first mode.
        // FIX: Supabase user object uses 'id', not 'uid'.
        const currentUserId = currentUser?.id || LOCAL_USER_ID;

        setLoading(true);

        // Suscripciones al subscribirse a este ID específico
        const unsubClasses = subscribeToClasses(currentUserId, (data) => setClases(data));
        const unsubUnits = subscribeToUnits(currentUserId, (data) => setUnits(data));
        const unsubSchedules = subscribeToSchedules(currentUserId, (data) => {
            const sorted = [...data].sort((a, b) => b.id - a.id);
            setSchedules(sorted);
            console.log("DataContext Loaded for", currentUserId, ":", sorted.length, "schedules");
            setLoading(false);
        });

        return () => {
            if (unsubClasses) unsubClasses();
            if (unsubUnits) unsubUnits();
            if (unsubSchedules) unsubSchedules();
        };
    }, [currentUser]);

    const value = {
        clases,
        units,
        schedules,
        loading
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
