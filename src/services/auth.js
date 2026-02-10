import { supabase } from './supabase';

/**
 * Suscribe a los cambios de estado de autenticación de Supabase.
 * @param {function} callback - Recibe { user, error }
 * @returns {function} - Función para desuscribirse.
 */
export const subscribeToAuthChanges = (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback({ user: session?.user || null, error: null });
    });

    return () => subscription.unsubscribe();
};

/**
 * Inicia sesión con correo y contraseña.
 * @param {string} email 
 * @param {string} password 
 */
export const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
};

/**
 * Cierra la sesión actual.
 */
export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};
