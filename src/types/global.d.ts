
import { RulesData } from '../types/rules';

declare global {
    interface Window {
        EXTERNAL_RULES?: RulesData;
        rulesStatus?: {
            loaded: boolean;
            error: string | null;
            version?: string;
            online?: boolean;
        };
    }
}

export { };
