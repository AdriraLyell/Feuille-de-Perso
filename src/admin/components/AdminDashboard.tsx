
import React, { useEffect, useState } from 'react';
import { GameSettingSummary, CampaignService } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { Plus, Loader2, FileCog, Scroll, Trash2, Eye, EyeOff, Users, Copy } from 'lucide-react';
import { defaultRules } from '../../data/defaultRules'; // We might need a default template
import { INITIAL_DATA, INITIAL_SKILLS } from '../../data/initialState';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import DuplicateSettingModal from './DuplicateSettingModal';

interface AdminDashboardProps {
    onSelectSetting: (id: string, name: string, rules: RulesData) => void;
    onViewPlayers: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectSetting, onViewPlayers }) => {
    // ... (state lines 14-19 are unchanged, but we need to include them in context or skip safely)
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
    const [settingToDuplicate, setSettingToDuplicate] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const data = await CampaignService.listSettings();
        if (data) setSettings(data);
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);

        // Prep Layout keys based on INITIAL_SKILLS keys
        // We map the structure: { talents: [Obj, Obj...], ... } -> { talents: ["Apparence", "Sport"...], ... }
        const layoutDefinitions: Record<string, string[]> = {};
        const labels: Record<string, string> = {
            talents: "Talents",
            competences: "Compétences",
            competences_col_2: "Mentales / Autres",
            connaissances: "Connaissances",
            autres_competences: "Libres",
            competences2: "Physique",
            autres: "Autres",
            arrieres_plans: "Arrière-Plans", // Should probably not be here but safe to have
            counters: "Compteurs"
        };

        Object.keys(INITIAL_SKILLS).forEach(key => {
            // @ts-ignore
            layoutDefinitions[key] = INITIAL_SKILLS[key].map((s: any) => s.name || ""); // "" preserves spacers
        });

        // Use a base template for new rules
        const template: Partial<RulesData> = {
            version: '1.0.0',
            configurations: { ...defaultRules.configurations },
            definitions: {
                ...defaultRules.definitions,
                skills: layoutDefinitions, // <-- This is the Pre-Fill Layout
                labels: { ...defaultRules.definitions.labels, ...labels } // <-- This ensures headers are nice
            },
            libraries: {
                ...defaultRules.libraries,
                skills: INITIAL_DATA.skillLibrary // Inject standard skills for "Smart Linking"
            }
        };

        const newId = await CampaignService.createSetting(newName, template);
        if (newId) {
            setNewName('');
            loadSettings(); // Refresh list
        }
        setIsCreating(false);
    };

    const handleSelect = async (id: string) => {
        setIsLoading(true);
        const rules = await CampaignService.loadSetting(id);
        const settingName = settings.find(s => s.id === id)?.name || "Campagne";

        if (rules) {
            onSelectSetting(id, settingName, rules);
        } else {
            alert("Erreur lors du chargement de la campagne.");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!settingToDelete) return;
        const success = await CampaignService.deleteSetting(settingToDelete);
        if (success) {
            loadSettings();
        } else {
            alert("Erreur lors de la suppression.");
        }
    };

    const handleToggleVisibility = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation(); // Prevent opening the setting
        // Optimistic UI update could be done here, but let's just await
        const success = await CampaignService.togglePublic(id, !currentStatus);
        if (success) {
            loadSettings();
        }
    };

    const handleDuplicate = async (e: React.MouseEvent, id: string, oldName: string) => {
        e.stopPropagation();
        setSettingToDuplicate({ id, name: oldName });
    };

    const confirmDuplicate = async (newName: string) => {
        if (!settingToDuplicate) return;
        const { id } = settingToDuplicate;

        setIsLoading(true);
        const newId = await CampaignService.duplicateSetting(id, newName);
        if (newId) {
            loadSettings();
        } else {
            alert("Erreur lors de la duplication.");
        }
        setIsLoading(false);
        setSettingToDuplicate(null);
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] p-8 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-serif font-bold text-[#4a3b32] flex items-center gap-3">
                    <FileCog size={32} className="text-amber-700" />
                    Tableau de Bord MJ
                </h1>

                <button
                    onClick={onViewPlayers}
                    className="flex items-center gap-2 bg-[#8b2e2e] hover:bg-[#a33939] text-white px-4 py-2 rounded-md font-bold transition-all shadow-md"
                >
                    <Users size={18} />
                    Tous les Joueurs
                </button>
            </div>
            <p className="text-[#5c4d41] mb-8 italic">Gérez vos campagnes et configurations de règles.</p>

            {/* Actions Bar */}
            <div className="flex gap-4 mb-6 items-end bg-white p-4 rounded-lg shadow-sm border border-[#bfae85]/30">
                <div className="flex-grow">
                    <label className="block text-xs font-bold text-[#bfae85] uppercase mb-1">Nouvelle Campagne</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Chroniques de l'Ombre..."
                        className="w-full border-b border-[#bfae85] py-2 bg-transparent outline-none focus:border-amber-600 font-serif text-lg placeholder-amber-900/20"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isCreating || !newName.trim()}
                    className="bg-[#5c4d41] hover:bg-[#4a3b32] disabled:opacity-50 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all shadow-md h-10"
                >
                    {isCreating ? <Loader2 className="animate-spin" /> : <Plus />} Créer
                </button>
            </div>

            {/* List */}
            {isLoading && settings.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={48} className="animate-spin text-amber-900/20" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settings.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-10 text-gray-400 italic">
                            Aucune campagne trouvée. Créez-en une pour commencer.
                        </div>
                    )}
                    {settings.map(setting => (
                        <div
                            key={setting.id}
                            onClick={() => handleSelect(setting.id)}
                            className="bg-white group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-xl border border-[#bfae85]/30 overflow-hidden relative"
                        >
                            <div className="h-2 bg-amber-700 w-full" />
                            <div className="p-6">
                                <h3 className="font-serif font-bold text-xl text-[#4a3b32] mb-1 group-hover:text-amber-700 transition-colors pr-8">
                                    {setting.name}
                                </h3>

                                {/* Absolute Actions Top Right */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleDuplicate(e, setting.id, setting.name)}
                                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Dupliquer la campagne"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSettingToDelete(setting.id); }}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Supprimer la campagne"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#bfae85] font-bold uppercase tracking-wider mb-4">
                                    <span className="bg-amber-50 px-2 py-1 rounded">v{setting.version}</span>
                                    <span>•</span>
                                    <span>{new Date(setting.last_updated).toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={(e) => handleToggleVisibility(e, setting.id, setting.is_public)}
                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold transition-all ${setting.is_public
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        title={setting.is_public ? "Cliquer pour rendre Privé" : "Cliquer pour rendre Public"}
                                    >
                                        {setting.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {setting.is_public ? 'PUBLIQUE' : 'PRIVÉE'}
                                    </button>

                                    <button className="text-amber-700 font-bold text-sm bg-amber-50 px-3 py-1 rounded group-hover:bg-amber-700 group-hover:text-white transition-colors">
                                        Ouvrir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={!!settingToDelete}
                onClose={() => setSettingToDelete(null)}
                onConfirm={handleDelete}
                title="Supprimer la campagne ?"
                message="Attention : Cette action est irréversible. Toutes les règles, compétences et configurations associées à cette campagne seront définitivement perdues."
                confirmLabel="Supprimer définitivement"
                type="danger"
            />

            <DuplicateSettingModal
                isOpen={!!settingToDuplicate}
                onClose={() => setSettingToDuplicate(null)}
                oldName={settingToDuplicate?.name || ''}
                onConfirm={confirmDuplicate}
            />
        </div>
    );
};

export default AdminDashboard;
