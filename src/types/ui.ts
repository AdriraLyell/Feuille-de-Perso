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

export interface LayoutItem {
    i: string; // ID du bloc (ex: 'Col_Comp_1', 'counter_volonte')
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface LayoutConfig {
    lg?: LayoutItem[]; // Paysage (Desktop)
    md?: LayoutItem[]; // Tablette
    sm?: LayoutItem[]; // Portrait (Mobile)
}
