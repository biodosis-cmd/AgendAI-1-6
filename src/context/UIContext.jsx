import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWeekNumber, getStartDateOfWeek } from '@/utils/dateUtils';

const UIContext = createContext();

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    // Global UI State
    const [view, setView] = useState('home'); // 'home', 'calendar', 'monthly', 'report', 'units', 'schedules'
    const [isLoading, setIsLoading] = useState(false);

    // Date State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));



    // Actions
    const changeWeek = (direction) => {
        let newDate = getStartDateOfWeek(selectedYear, selectedWeek);
        newDate.setDate(newDate.getDate() + (direction * 7));

        setSelectedYear(newDate.getFullYear());
        setSelectedMonth(newDate.getMonth());
        setSelectedWeek(getWeekNumber(newDate));
    };

    const changeMonth = (direction) => {
        const newDate = new Date(selectedYear, selectedMonth + direction, 1);

        setSelectedYear(newDate.getFullYear());
        setSelectedMonth(newDate.getMonth());
        // When navigating months in calendar view, jump to the first week of that month
        if (view === 'calendar') {
            setSelectedWeek(getWeekNumber(newDate));
        }
    };

    const goToCurrentWeek = () => {
        const today = new Date();
        const year = today.getFullYear();

        setSelectedYear(year);
        setSelectedMonth(today.getMonth());
        setSelectedWeek(getWeekNumber(today));
    };

    const goToView = (newView) => {
        setView(newView);
    };

    const toggleLoading = (loading) => {
        setIsLoading(loading);
    };

    const goToDate = (date) => {
        const newDate = new Date(date);

        setSelectedYear(newDate.getFullYear());
        setSelectedMonth(newDate.getMonth());
        setSelectedWeek(getWeekNumber(newDate));
    };

    // Helper to enforce year manually if needed
    const setSafeSelectedYear = (year) => {
        setSelectedYear(year);
    }

    const value = {
        view,
        isLoading,
        selectedYear,
        selectedMonth,
        selectedWeek,
        actions: {
            setView: goToView,
            setLoading: toggleLoading,
            changeWeek,
            changeMonth,
            goToCurrentWeek,
            setSelectedYear: setSafeSelectedYear,
            setSelectedWeek,
            setSelectedMonth,
            goToDate
        }
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};
