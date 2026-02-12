
import React, { useEffect, useState } from 'react';
import { GameSettingSummary, CampaignService } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { Plus, Loader2, FileCog, Trash2, Eye, EyeOff, Users, Copy, LogOut, BookOpen, Scroll } from 'lucide-react';
import { defaultRules } from '../../data/defaultRules';
import { INITIAL_DATA, INITIAL_SKILLS } from '../../data/initialState';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import DuplicateSettingModal from './DuplicateSettingModal';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';
import { ErrorService } from '../../services/ErrorService';

interface AdminDashboardProps {
    onSelectSetting: (id: string, name: string, rules: RulesData) => void;
    onViewPlayers: () => void;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectSetting, onViewPlayers, onLogout }) => {
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
    const [settingToDuplicate, setSettingToDuplicate] = useState<{ id: string, name: string } | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await CampaignService.listSettings();
            if (data) setSettings(data);
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.loadSettings',
                userMessage: 'Impossible de charger les campagnes.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);
        try {

            const layoutDefinitions: Record<string, string[]> = {};
            const labels: Record<string, string> = {
                talents: "Talents",
                competences: "Compétences",
                competences_col_2: "Mentales / Autres",
                connaissances: "Connaissances",
                autres_competences: "Libres",
                competences2: "Physique",
                autres: "Autres",
                arrieres_plans: "Arrière-Plans",
                counters: "Compteurs"
            };

            Object.keys(INITIAL_SKILLS).forEach(key => {
                layoutDefinitions[key] = INITIAL_SKILLS[key].map((s) => s.name || "");
            });

            const template: Partial<RulesData> = {
                version: '1.0.0',
                configurations: { ...defaultRules.configurations },
                definitions: {
                    ...defaultRules.definitions,
                    skills: layoutDefinitions,
                    labels: { ...defaultRules.definitions.labels, ...labels }
                },
                libraries: {
                    ...defaultRules.libraries,
                    skills: INITIAL_DATA.skillLibrary
                }
            };

            const newId = await CampaignService.createSetting(newName, template);
            if (newId) {
                setNewName('');
                loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleCreate',
                userMessage: 'Erreur lors de la création de la campagne.'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelect = async (id: string) => {
        setIsLoading(true);
        try {
            const rules = await CampaignService.loadSetting(id);
            const settingName = settings.find(s => s.id === id)?.name || "Campagne";

            if (rules) {
                onSelectSetting(id, settingName, rules);
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleSelect',
                userMessage: 'Erreur lors du chargement de la campagne.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!settingToDelete) return;
        setIsLoading(true);
        try {
            const success = await CampaignService.deleteSetting(settingToDelete);
            if (success) {
                loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleDelete',
                userMessage: 'Erreur lors de la suppression de la campagne.'
            });
        } finally {
            setIsLoading(false);
            setSettingToDelete(null);
        }
    };

    const handleToggleVisibility = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        try {
            const success = await CampaignService.togglePublic(id, !currentStatus);
            if (success) {
                loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleToggleVisibility',
                userMessage: 'Impossible de modifier la visibilité.'
            });
        }
    };

    const handleToggleArchive = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        try {
            const success = await CampaignService.setArchived(id, !currentStatus);
            if (success) {
                loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.handleToggleArchive',
                userMessage: "Erreur lors de la modification de l'état d'archivage."
            });
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
        try {
            const newId = await CampaignService.duplicateSetting(id, newName);
            if (newId) {
                loadSettings();
            }
        } catch (error) {
            ErrorService.handleError(error, {
                context: 'AdminDashboard.confirmDuplicate',
                userMessage: 'Erreur lors de la duplication de la campagne.'
            });
        } finally {
            setIsLoading(false);
            setSettingToDuplicate(null);
        }
    };

    const filteredSettings = settings.filter(s => showArchived || !s.is_archived);

    return (
        <div className="flex flex-col min-h-screen bg-stone-950 p-8 w-full transition-colors duration-500 relative overflow-hidden">
            {/* Background Texture Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-900 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto w-full relative z-10">
                <MotionFade className="flex justify-between items-center mb-10" delay={0.1}>
                    <h1 className="text-4xl font-serif font-black text-amber-500 flex items-center gap-4 drop-shadow-lg">
                        <div className="relative">
                            <FileCog size={40} className="text-amber-600 animate-spin-slow opacity-80" />
                            <FileCog size={40} className="text-amber-400 absolute top-0 left-0 blur-sm opacity-50 animate-pulse" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-700">
                            Bureau du Maître
                        </span>
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${showArchived ? 'bg-amber-950/50 text-amber-500 border-amber-900/50' : 'text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-600'}`}
                            title={showArchived ? "Masquer les archives" : "Afficher les archives"}
                        >
                            {showArchived ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showArchived ? "Archives visibles" : "Voir archives"}
                        </button>

                        <button
                            onClick={onViewPlayers}
                            className="flex items-center gap-2 bg-crimson-blood/90 hover:bg-crimson-blood text-white px-5 py-2 rounded-sm font-serif font-bold transition-all shadow-lg hover:shadow-crimson-blood/50 border border-crimson-blood group"
                        >
                            <Users size={18} className="group-hover:scale-110 transition-transform" />
                            Joueurs
                        </button>

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 px-4 py-2 rounded-sm font-bold transition-all shadow-md group border border-stone-800"
                            title="Se déconnecter"
                        >
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Déconnexion
                        </button>
                    </div>
                </MotionFade>

                <MotionFade delay={0.2}>
                    <p className="text-stone-400 mb-8 italic font-serif text-lg tracking-wide border-l-2 border-amber-800/50 pl-4 max-w-2xl">
                        "Gérez vos chroniques, vos règles et le destin de vos investigateurs dans l'ombre."
                    </p>
                </MotionFade>

                {/* Actions Bar */}
                <MotionFade delay={0.3}>
                    <div className="flex gap-4 mb-10 items-end bg-stone-900/60 p-6 rounded-sm shadow-glass border border-stone-800 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Scroll size={120} className="text-stone-500 rotate-12" />
                        </div>

                        <div className="flex-grow z-10">
                            <label className="block text-xs font-bold text-amber-700 uppercase mb-2 tracking-widest">Nouvelle Chronique</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ex: Les Ombres de l'Aube..."
                                className="w-full border-b border-stone-700 py-3 bg-transparent outline-none focus:border-amber-500 text-stone-200 font-serif text-xl placeholder-stone-700 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || !newName.trim()}
                            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 px-8 py-3 rounded-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 z-10"
                        >
                            {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={20} className="stroke-[3]" />}
                            <span className="uppercase tracking-wide">Créer</span>
                        </button>
                    </div>
                </MotionFade>

                {/* List */}
                {
                    isLoading && settings.length === 0 ? (
                        <div className="flex justify-center py-32">
                            <Loader2 size={64} className="animate-spin text-amber-900/40" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredSettings.length === 0 && !isLoading && (
                                <MotionFade className="col-span-full text-center py-20 text-stone-600 italic font-serif text-xl border-2 border-dashed border-stone-800/50 rounded-xl bg-stone-900/20 backdrop-blur-sm">
                                    Le vide s'étend devant vous... <br /> Commencez par inscrire une nouvelle légende.
                                </MotionFade>
                            )}

                            {filteredSettings.map((setting, index) => (
                                <MotionCard
                                    key={setting.id}
                                    onClick={() => handleSelect(setting.id)}
                                    className={`group cursor-pointer overflow-hidden relative min-h-[280px] flex flex-col ${setting.is_archived ? 'opacity-60 grayscale hover:grayscale-0 transition-all duration-500' : ''}`}
                                    hoverEffect="lift"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                >
                                    <div className={`h-1 w-full ${setting.is_archived ? 'bg-stone-700' : 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700'}`} />

                                    {/* Card Content */}
                                    <div className="p-8 relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-serif font-bold text-2xl text-stone-200 group-hover:text-amber-400 transition-colors pr-8 line-clamp-2">
                                                {setting.name}
                                            </h3>
                                            {setting.is_archived && (
                                                <span className="shrink-0 text-[10px] uppercase tracking-widest bg-stone-950 text-stone-500 px-2 py-1 rounded border border-stone-800">
                                                    Archivée
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-[10px] text-amber-700/60 font-bold uppercase tracking-widest mb-6 border-b border-stone-800/50 pb-4">
                                            <span className="bg-stone-950/30 px-2 py-1 rounded border border-stone-800/50">v{setting.version}</span>
                                            <span className="text-stone-700">•</span>
                                            <span className="text-stone-500">{new Date(setting.last_updated).toLocaleDateString()}</span>
                                        </div>

                                        <div className="mt-auto flex justify-between items-center pt-2">
                                            <button
                                                onClick={(e) => handleToggleVisibility(e, setting.id, setting.is_public)}
                                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide transition-all border ${setting.is_public
                                                    ? 'bg-green-950/30 text-green-600 border-green-900/30 hover:bg-green-900/30 hover:text-green-400'
                                                    : 'bg-stone-950/30 text-stone-600 border-stone-800 hover:border-stone-600 hover:text-stone-400'
                                                    }`}
                                                title={setting.is_public ? "Passer en mode Privé" : "Passer en mode Public"}
                                            >
                                                {setting.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {setting.is_public ? 'Publique' : 'Privée'}
                                            </button>

                                            <span className="text-amber-600/80 font-serif font-bold text-sm group-hover:translate-x-1 transition-all flex items-center gap-1 group-hover:text-amber-500">
                                                Ouvrir <BookOpen size={14} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Actions (Hover Reveal) */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                                        <button
                                            onClick={(e) => handleToggleArchive(e, setting.id, setting.is_archived)}
                                            className={`p-2 rounded-full transition-colors shadow-lg border border-transparent ${setting.is_archived ? 'bg-amber-900/80 text-amber-500 hover:bg-amber-800 hover:border-amber-700' : 'bg-stone-800/90 text-stone-400 hover:text-stone-200 hover:bg-stone-700 hover:border-stone-600'}`}
                                            title={setting.is_archived ? "Désarchiver" : "Archiver"}
                                        >
                                            <BookOpen size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDuplicate(e, setting.id, setting.name)}
                                            className="p-2 bg-stone-800/90 text-blue-400 hover:text-blue-300 hover:bg-stone-700 rounded-full transition-colors shadow-lg border border-transparent hover:border-blue-900/50"
                                            title="Dupliquer"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSettingToDelete(setting.id); }}
                                            className="p-2 bg-stone-800/90 text-crimson-blood hover:text-red-400 hover:bg-stone-700 rounded-full transition-colors shadow-lg border border-transparent hover:border-red-900/50"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Background Decoration */}
                                    <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 rotate-12 scale-110 pointer-events-none">
                                        <FileCog size={180} />
                                    </div>
                                </MotionCard>
                            ))}
                        </div>
                    )
                }

                <ConfirmationModal
                    isOpen={!!settingToDelete}
                    onClose={() => setSettingToDelete(null)}
                    onConfirm={handleDelete}
                    title="Dissoudre la Chronique ?"
                    message="Attention : Cette action est irréversible. L'histoire, les règles et les destins liés à cette chronique seront perdus à jamais dans le néant."
                    confirmLabel="Dissoudre"
                    type="danger"
                    scheme="mystic"
                />

                <DuplicateSettingModal
                    isOpen={!!settingToDuplicate}
                    onClose={() => setSettingToDuplicate(null)}
                    oldName={settingToDuplicate?.name || ''}
                    onConfirm={confirmDuplicate}
                />
            </div>
        </div >
    );
};

export default AdminDashboard;
