import React from 'react';
import { Settings, ArrowLeft, UploadCloud, Download, Upload, LogOut, AlertTriangle, Cloud } from 'lucide-react';
import { APP_VERSION } from '../../constants';

interface AdminHeaderProps {
    currentSettingName: string;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    onBack: () => void;
    onSave: () => void;
    onImport: () => void;
    onExport: () => void;
    onPublish: () => void;
    onLogout: () => void;
    onShowChangelog: () => void;
    onCheckSchema?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    currentSettingName,
    hasUnsavedChanges,
    isSaving,
    onBack,
    onSave,
    onImport,
    onExport,
    onPublish,
    onLogout,
    onShowChangelog,
    onCheckSchema
}) => {
    return (
        <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors" title="Retour au tableau de bord">
                        <ArrowLeft size={24} />
                    </button>
                    <Settings className="text-blue-400" />
                    <h1 className="text-xl font-bold tracking-wide">Éditeur <span className="text-slate-400 font-normal">| {currentSettingName || "Campagne"}</span></h1>

                    <div className="ml-4 pl-4 border-l border-slate-700 flex items-center" title={hasUnsavedChanges ? "Modifications locales non publiées" : "Synchronisé"}>
                        {hasUnsavedChanges ? (
                            <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                                <AlertTriangle size={20} />
                            </div>
                        ) : (
                            <div
                                className="flex items-center gap-2 text-green-400/50 cursor-pointer"
                                onClick={onCheckSchema}
                            >
                                <Cloud size={20} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <button
                        onClick={onShowChangelog}
                        className="bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
                        title="Voir le journal des versions"
                    >
                        v{APP_VERSION}
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-amber-900/20"
                        title="Sauvegarder en BDD"
                    >
                        <UploadCloud size={16} />
                        {isSaving ? "Sauvegarde..." : "Sauver"}
                    </button>

                    <button
                        onClick={onImport}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-blue-900/20"
                        title="Importer un JSON (Personnage ou Règles)"
                    >
                        <UploadCloud size={16} className="rotate-180" /> Importer
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-emerald-900/20"
                        title="Exporter le fichier rules.js pour usage offline"
                    >
                        <Download size={16} /> Exporter
                    </button>

                    <button
                        onClick={onPublish}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold transition-colors shadow-lg shadow-purple-900/20"
                        title="Publier sur GitHub"
                    >
                        <Upload size={16} /> Publier
                    </button>

                    <button
                        onClick={onLogout}
                        className="bg-slate-800 p-2 rounded hover:bg-red-900 text-slate-400 hover:text-white transition-colors"
                        title="Se déconnecter"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
