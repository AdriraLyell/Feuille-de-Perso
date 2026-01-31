import React, { createContext, useContext } from 'react';

// Signature exacte de la fonction addLog dans App.tsx
type AddLogFn = (
    message: string, 
    type?: 'success' | 'danger' | 'info', 
    category?: 'sheet' | 'settings' | 'both', 
    deduplicationId?: string
) => void;

// Création du contexte avec une fonction vide par défaut (pour éviter les crashs si utilisé hors provider)
const NotificationContext = createContext<AddLogFn>(() => {});

// Hook personnalisé pour faciliter l'utilisation
export const useNotification = () => useContext(NotificationContext);

// Export du Provider pour envelopper l'application
export const NotificationProvider = NotificationContext.Provider;
