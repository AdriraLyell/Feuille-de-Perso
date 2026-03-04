import { DotEntry } from './primitives';

export interface DropPayload {
    type: 'sheet_item' | 'library_item' | 'lib_skill' | 'custom_lib_item';
    data: Partial<DotEntry> & {
        id: string;
        name: string;
        isVariable?: boolean;
        categoryType?: 'skill' | 'background' | 'counter';
        // Allow other fields for legacy/flexibility during transition
        [key: string]: any;
    };
    categoryType?: 'skill' | 'background' | 'counter';
}
