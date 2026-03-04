import React from 'react';
import { CharacterSheetData } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import ImportOptionsSection from './ImportOptionsSection';
import CloudConflictResolver from './CloudConflictResolver';
import { useImportLogic } from './hooks/useImportLogic';
import { FileDropZone } from './FileDropZone';
import { FileAnalysisHeader } from './FileAnalysisHeader';
import { MigrationSuccessModal } from './MigrationSuccessModal';

interface ImportPanelProps {
    data: CharacterSheetData;
    variant: 'player' | 'gm';
    onImportSuccess?: (newData: CharacterSheetData) => void;
    onClose: () => void;
    onRequestExport?: () => void;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ data, variant, onImportSuccess, onClose, onRequestExport }) => {
    const isGM = variant === 'gm';

    const {
        pendingFile,
        setPendingFile,
        analysis,
        setAnalysis,
        importAction,
        setImportAction,
        conflicts,
        resolutionMap,
        isResolvingConflicts,
        setIsResolvingConflicts,
        migrationReport,
        handleFileLoad,
        executeImport,
        handleSuccessClose,
        handleResolutionChoice,
        resolveAll
    } = useImportLogic({ data, variant, onImportSuccess, onClose });

    // Conflict Resolution View
    if (isResolvingConflicts) {
        return (
            <CloudConflictResolver
                conflicts={conflicts}
                resolutionMap={resolutionMap}
                onResolutionChoice={handleResolutionChoice}
                onResolveAll={resolveAll}
                onCancel={() => setIsResolvingConflicts(false)}
                onConfirm={executeImport}
            />
        );
    }

    // Main Import View
    return (
        <div className="flex-1 bg-white p-6 flex flex-col animate-in fade-in duration-300">
            {!pendingFile ? (
                <FileDropZone onFileSelect={handleFileLoad} />
            ) : (
                <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">

                    {analysis && (
                        <FileAnalysisHeader
                            analysis={analysis}
                            onClear={() => { setPendingFile(null); setAnalysis(null); }}
                        />
                    )}

                    {isGM && (
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            Choisir une action
                        </h4>
                    )}

                    <div className="flex-grow overflow-y-auto pr-1">
                        {analysis && (
                            <ImportOptionsSection
                                analysis={analysis}
                                variant={variant}
                                importAction={importAction}
                                onActionChange={setImportAction}
                            />
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                            onClick={executeImport}
                            disabled={!importAction}
                            className="w-full py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition"
                        >
                            <CheckCircle2 size={20} />
                            {variant === 'player' ? 'Confirmer le chargement' : "Confirmer le chargement"}
                        </button>
                    </div>
                </div>
            )}

            <MigrationSuccessModal
                report={migrationReport}
                onClose={handleSuccessClose}
                onSave={() => {
                    if (onRequestExport) onRequestExport();
                    handleSuccessClose();
                }}
            />
        </div>
    );
};

export default ImportPanel;
