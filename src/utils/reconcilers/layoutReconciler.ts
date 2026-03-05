import { CharacterSheetData } from '../../types';
import { syncLayout } from '../layoutUtils';
import { SheetLayout } from '../../hooks/useSheetLayout';

/**
 * Reconciles the custom layout configuration.
 * Generates default layouts if they don't exist in the state but are required.
 * 
 * @param newState - The draft state being reconciled
 * @param portraitLayout - The generated static portrait layout for reference
 * @param landscapeLayout - The generated static landscape layout for reference
 */
export const reconcileLayout = (
    newState: CharacterSheetData,
    portraitLayout: SheetLayout,
    landscapeLayout: SheetLayout
) => {
    newState.activeLayout = syncLayout(
        newState.activeLayout,
        portraitLayout,
        landscapeLayout
    );

    if (!newState.layoutConfigs) {
        newState.layoutConfigs = {};
    }
};
