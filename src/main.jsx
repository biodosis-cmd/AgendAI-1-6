import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './index.css'

import { ModalProvider } from '@/context/ModalContext';

import ErrorBoundary from '@/components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <DataProvider>
                <ModalProvider>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </ModalProvider>
            </DataProvider>
        </AuthProvider>
    </React.StrictMode>,
)
