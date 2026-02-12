
import { RulesData } from '../types/rules';

declare global {
    interface Window {

        rulesStatus?: {
            loaded: boolean;
            error: string | null;
            version?: string;
            online?: boolean;
        };
    }
}

export { };
