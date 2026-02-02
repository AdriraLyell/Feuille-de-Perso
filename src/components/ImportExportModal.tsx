
import React, { useState } from 'react';
import { CharacterSheetData } from '../types';
import { Download, Upload, Save } from 'lucide-react';
import { useCharacter } from '../context/CharacterContext';
import ThematicModal from './ui/ThematicModal';
import { APP_VERSION } from '../constants';
import ExportPanel from './import-export/ExportPanel';
import ImportPanel from './import-export/ImportPanel';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportSuccess?: () => void;
    onImportSuccess?: (newData: CharacterSheetData) => void;
    variant: 'player' | 'gm';
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onExportSuccess, onImportSuccess, variant }) => {
    const { data } = useCharacter();
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

    if (!isOpen) return null;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={variant === 'gm' ? "Gestion de Campagne (MJ)" : "Grimoire de Sauvegarde"}
            icon={<Save size={24} />}
            size="lg"
            footer={
                <div className="w-full flex justify-between items-center text-xs text-stone-500">
                    <span>Un grand pouvoir implique une grande responsabilité de sauvegarde.</span>
                    <span>v{APP_VERSION}</span>
                </div>
            }
        >
            <div className="flex flex-col h-full gap-6">

                {/* Tabs */}
                <div className="flex gap-2 border-b-2 border-[#bfae85]/50 pb-2 mb-2">
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 font-serif font-bold text-lg transition-colors rounded-t-lg ${activeTab === 'export' ? 'bg-[#8b2e2e] text-[#fdfbf7]' : 'hover:bg-[#bfae85]/20 text-[#5c4d41]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Download size={20} />
                            Exportation
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`px-4 py-2 font-serif font-bold text-lg transition-colors rounded-t-lg ${activeTab === 'import' ? 'bg-[#8b2e2e] text-[#fdfbf7]' : 'hover:bg-[#bfae85]/20 text-[#5c4d41]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Upload size={20} />
                            Importation
                        </div>
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'export' && (
                    <ExportPanel
                        data={data}
                        variant={variant}
                        onExportSuccess={onExportSuccess}
                    />
                )}

                {activeTab === 'import' && (
                    <ImportPanel
                        data={data}
                        variant={variant}
                        onImportSuccess={onImportSuccess}
                        onClose={onClose}
                        onRequestExport={() => setActiveTab('export')}
                    />
                )}

            </div>
        </ThematicModal>
    );
};

export default ImportExportModal;
