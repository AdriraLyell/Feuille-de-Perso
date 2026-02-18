
import React from 'react';
import ThematicModal from './ui/ThematicModal';
import ThematicButton from './ui/ThematicButton';
import AppearanceEditor from './settings/AppearanceEditor';
import { Palette, X } from 'lucide-react';
import { CharacterSheetData } from '../types';
import { RulesData } from '../types/rules';

interface AppearanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    rules: RulesData | null;
}

const AppearanceModal: React.FC<AppearanceModalProps> = ({ isOpen, onClose, data, onUpdate, rules }) => {
    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Apparence & Thème"
            icon={<Palette size={24} />}
            size="lg"
            footer={
                <div className="flex justify-end w-full">
                    <ThematicButton onClick={onClose} variant="primary" leftIcon={<X size={16} />}>
                        Fermer
                    </ThematicButton>
                </div>
            }
        >
            <div className="p-4">
                {/* Reuse existing logic directly from AppearanceEditor */}
                <AppearanceEditor data={data} onUpdate={onUpdate} onAddLog={() => { }} rules={rules} />
            </div>
        </ThematicModal>
    );
};

export default AppearanceModal;
