import React from 'react';
import { Download, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';
import ThematicButton from '../ui/ThematicButton';

interface MigrationSuccessModalProps {
    report: { oldVersion: string; newVersion: string } | null;
    onClose: () => void;
    onSave: () => void;
}

export const MigrationSuccessModal: React.FC<MigrationSuccessModalProps> = ({ report, onClose, onSave }) => {
    if (!report) return null;

    return (
        <ThematicModal
            isOpen={true}
            onClose={onClose}
            title="Migration Réussie"
            icon={<CheckCircle2 size={24} className="text-green-600" />}
            size="md"
            footer={
                <div className="flex gap-3">
                    <ThematicButton variant="secondary" onClick={onClose}>
                        Plus tard
                    </ThematicButton>
                    <ThematicButton variant="primary" onClick={onSave}>
                        Sauvegarder maintenant
                    </ThematicButton>
                </div>
            }
        >
            <div className="flex flex-col items-center text-center space-y-4 py-4">
                <div className="bg-green-100 p-4 rounded-full text-green-600 mb-2 animate-bounce">
                    <Download size={32} />
                </div>
                <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-800">Votre personnage a été mis à jour !</p>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                        <span>v{report.oldVersion}</span>
                        <ArrowRight size={12} />
                        <span className="font-bold text-blue-600">v{report.newVersion}</span>
                    </div>
                    <p className="text-sm text-slate-600 max-w-sm">
                        Toutes les anciennes données ont été migrées vers le nouveau format.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-left">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-bold block mb-1">⚠️ Action recommandée</span>
                        Nous vous conseillons de sauvegarder votre personnage immédiatement.
                    </div>
                </div>
            </div>
        </ThematicModal>
    );
};
