
import React, { useState } from 'react';
import {
    X, HelpCircle, User, Book, MousePointer, Settings, Save,
    LayoutGrid, Zap, Layers, TrendingUp, Image as ImageIcon,
    Cloud, WifiOff, FileJson, PencilLine, Target, RefreshCw, Palette, Download, UploadCloud
} from 'lucide-react';

interface UserGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GuideSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
            {icon} {title}
        </h4>
        <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            {children}
        </div>
    </div>
);

const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'modes' | 'usage' | 'edit' | 'tools'>('modes');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center bg-stone-900 p-4 border-b border-stone-700 text-white shrink-0">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2 font-serif tracking-wide">
                            <Book className="text-amber-500" />
                            Guide de l'Aventurier
                        </h3>
                        <p className="text-xs text-stone-600 opacity-90 italic">Manuel d'utilisation de la feuille de personnage</p>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-white hover:bg-[#8b2e2e] p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-stone-100 border-b border-stone-200 shrink-0">
                    <button
                        onClick={() => setActiveTab('modes')}
                        className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'modes' ? 'bg-white border-blue-600 text-blue-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
                    >
                        <Cloud size={18} /> Modes & Cloud
                    </button>
                    <button
                        onClick={() => setActiveTab('usage')}
                        className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'usage' ? 'bg-white border-green-600 text-green-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
                    >
                        <MousePointer size={18} /> Usage de la Feuille
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'edit' ? 'bg-white border-amber-600 text-amber-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
                    >
                        <Zap size={18} /> Création & Édition
                    </button>
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'tools' ? 'bg-white border-purple-600 text-purple-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
                    >
                        <Layers size={18} /> Journal & Outils
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-white custom-scrollbar">

                    {/* --- MODES & CLOUD --- */}
                    {activeTab === 'modes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                                <p className="font-bold mb-1">Architecture Hybride</p>
                                <p>L'application privilégie toujours la connexion au serveur (Cloud), mais reste parfaitement fonctionnelle sans réseau grâce à ses mécanismes de secours.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GuideSection title="Mode En Ligne (Cloud)" icon={<Cloud size={18} className="text-blue-500" />}>
                                    <p>Lorsqu'un identifiant de campagne est présent, l'app récupère les règles directement depuis la base de données.</p>
                                    <ul className="list-disc list-inside mt-2 text-xs">
                                        <li><strong>Sync Auto :</strong> Vos changements sont sauvegardés sur le serveur toutes les 10s.</li>
                                        <li><strong>Bouton Sync :</strong> Forcez une synchronisation manuelle à tout moment.</li>
                                    </ul>
                                </GuideSection>

                                <GuideSection title="Mode JSON (Fichiers)" icon={<FileJson size={18} className="text-amber-500" />}>
                                    <p>Utilisez le menu <strong>Sauvegarder / Charger</strong> pour gérer vos fichiers `.json`.</p>
                                    <ul className="list-disc list-inside mt-2 text-xs">
                                        <li><strong>Export MJ :</strong> Un fichier contenant uniquement la structure et la bibliothèque (pour vos joueurs).</li>
                                        <li><strong>Export Perso :</strong> Contient toutes vos données, y compris journal et images.</li>
                                    </ul>
                                </GuideSection>

                                <GuideSection title="Mode Hors Ligne" icon={<WifiOff size={18} className="text-slate-500" />}>
                                    <p>En cas de coupure réseau, l'application utilise un fichier de règles local (`default_rules.json`) et le cache de votre navigateur.</p>
                                    <p className="mt-2 text-xs italic">La synchronisation reprendra dès le retour de la connexion.</p>
                                </GuideSection>

                                <GuideSection title="Note sur la Mémoire" icon={<RefreshCw size={18} className="text-indigo-500" />}>
                                    <p>L'app stocke vos données dans le <strong>Local Storage</strong> du navigateur. Si vous videz votre cache, vous perdrez vos données non synchronisées ou non exportées.</p>
                                </GuideSection>
                            </div>
                        </div>
                    )}

                    {/* --- USAGE --- */}
                    {activeTab === 'usage' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <GuideSection title="Interactions de Base" icon={<MousePointer size={18} className="text-green-600" />}>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Compétences (Cercles) :</strong> Cliquez pour définir le niveau. Cliquez sur le niveau actuel pour le diminuer.</li>
                                    <li><strong>Compteurs (Carrés/Cercles) :</strong> Les cercles (extérieurs) sont le <strong>Maximum</strong>, les carrés (intérieurs) sont la valeur <strong>Actuelle</strong>. Ils peuvent être synchronisés.</li>
                                    <li><strong>Attributs :</strong> Cliquez sur les champs pour modifier les valeurs. Le coût en XP est calculé dynamiquement.</li>
                                </ul>
                            </GuideSection>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GuideSection title="Gestion de l'Expérience" icon={<TrendingUp size={18} className="text-amber-600" />}>
                                    <p>L'onglet <strong>Gestion XP</strong> permet d'ajouter vos gains. L'application déduit automatiquement le coût de vos attributs et compétences (hors valeurs de départ).</p>
                                </GuideSection>

                                <GuideSection title="Spécialisations" icon={<Target size={18} className="text-red-600" />}>
                                    <p>L'onglet <strong>Spécialisations</strong> n'affiche que les compétences où vous possédez au moins 1 point. Vos bonus d'historique s'y ajoutent automatiquement.</p>
                                </GuideSection>
                            </div>
                        </div>
                    )}

                    {/* --- CREATION & EDITION --- */}
                    {activeTab === 'edit' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <GuideSection title="Mode Création" icon={<Zap size={18} className="text-yellow-600" />}>
                                <p>Activé au démarrage ou via les réglages, ce mode permet de répartir vos points initiaux sans coût d'XP.</p>
                                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                    <li><strong>HUD de contrôle :</strong> Un bandeau en bas d'écran affiche vos budgets restants (Attributs, Rangs, Backgrounds).</li>
                                    <li><strong>Validation :</strong> Une fois terminé, validez pour figer vos bases. Toute modification ultérieure consommera de l'XP.</li>
                                </ul>
                            </GuideSection>

                            <GuideSection title="Édition Directe (Structure)" icon={<PencilLine size={18} className="text-indigo-600" />}>
                                <p>L'icône "Crayon" permet de modifier la structure même de la fiche.</p>
                                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                    <li><strong>Barre Latérale :</strong> Glissez-déposez des compétences ou historiques depuis la bibliothèque vers la fiche.</li>
                                    <li><strong>Réorganisation :</strong> Déplacez les blocs d'une catégorie à une autre.</li>
                                    <li><strong>Suppression :</strong> Une icône poubelle apparaît pour retirer les éléments inutiles.</li>
                                    <li><strong>Suggestions :</strong> Les éléments ajoutés ainsi sont notifiés au MJ pour validation.</li>
                                </ul>
                            </GuideSection>
                        </div>
                    )}

                    {/* --- TOOLS --- */}
                    {activeTab === 'tools' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <GuideSection title="Journal & Notes" icon={<Book size={18} className="text-stone-600" />}>
                                <p>L'onglet <strong>Notes de Campagne</strong> est votre journal de bord interactif.</p>
                                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                    <li><strong>Images :</strong> Dessinez un rectangle avec la souris pour insérer une image (redimensionnable).</li>
                                    <li><strong>Groupe :</strong> Suivez les informations essentielles du reste de l'équipe.</li>
                                </ul>
                            </GuideSection>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GuideSection title="Personnalisation" icon={<Palette size={18} className="text-pink-600" />}>
                                    <p>Changez l'apparence de la fiche (Thèmes, Polices) via le menu <strong>Thème</strong> dans la barre de navigation.</p>
                                </GuideSection>

                                <GuideSection title="Interface & Affichage" icon={<LayoutGrid size={18} className="text-indigo-500" />}>
                                    <p>Basculez entre le mode <strong>Portrait</strong> (smartphone) et <strong>Paysage</strong> (tablette/PC) pour optimiser votre visibilité.</p>
                                </GuideSection>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
                    >
                        Fermer le guide
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UserGuideModal;
