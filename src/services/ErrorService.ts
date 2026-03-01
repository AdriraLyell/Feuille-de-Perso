export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorLogOptions {
    context?: string;      // Ex: "CharacterSync", "LibraryLoader"
    userMessage?: string;  // Message friendly pour l'utilisateur
    silent?: boolean;      // Si true, log seulement en console, pas de notification
    error?: unknown;       // L'erreur originale
}

type NotifyFn = (
    message: string,
    type?: 'success' | 'danger' | 'info',
    category?: 'sheet' | 'settings' | 'both',
    deduplicationId?: string
) => void;

export class ErrorService {
    private static notifier: NotifyFn | null = null;

    /**
     * Injecte la fonction de notification (depuis NotificationContext ou CharacterContext)
     */
    static init(notifyFn: NotifyFn) {
        this.notifier = notifyFn;
    }

    /**
     * Log une erreur et notifie l'utilisateur si nécessaire
     */
    static handleError(error: unknown, options: ErrorLogOptions = {}) {
        const { context = 'General', userMessage, silent = false } = options;

        // Extraction du message d'erreur
        const technicalMessage = error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : JSON.stringify(error);

        // 1. Console Log enrichi
        const isForbidden = technicalMessage.includes('403') || (error as any)?.status === 403 || (error as any)?.code === '42501';

        const timestamp = new Date().toLocaleTimeString();
        // eslint-disable-next-line no-console
        console.groupCollapsed(`%c[${timestamp}] [${context}] Error`, 'color: red; font-weight: bold;');
        console.error('Original Error:', error);
        // eslint-disable-next-line no-console
        if (userMessage) console.log('User Message:', userMessage);
        if (isForbidden) {
            console.warn('💡 Tip: This 403 error might be due to missing "admin" role in your Supabase app_metadata.');
        }
        // eslint-disable-next-line no-console
        console.groupEnd();

        // 2. Notification Utilisateur
        if (!silent && this.notifier) {
            let displayMsg = userMessage || `Erreur (${context}): ${technicalMessage}`;
            if (isForbidden && !userMessage) {
                displayMsg = `Accès refusé (${context}). Vérifiez vos droits administrateur.`;
            } else if (isForbidden) {
                displayMsg += " (Vérifiez vos droits administrateur)";
            }
            // On utilise 'danger' pour les erreurs
            // On log dans 'both' pour être sûr que ce soit visible dans l'historique global
            this.notifier(displayMsg, 'danger', 'both');
        }
    }

    /**
     * Wrapper pour les blocs try/catch
     */
    static async tryCatch<T>(
        promise: Promise<T>,
        options: ErrorLogOptions
    ): Promise<T | null> {
        try {
            return await promise;
        } catch (error) {
            this.handleError(error, options);
            return null;
        }
    }
}
