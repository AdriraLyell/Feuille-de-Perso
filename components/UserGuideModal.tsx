
import React, { useState } from 'react';
import { X, HelpCircle, User, Crown, Book, MousePointer, Settings, Save, LayoutGrid, Zap, Layers, TrendingUp, Image as ImageIcon } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'general' | 'player' | 'gm'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-stone-900 p-4 border-b border-stone-700 text-white shrink-0">
            <div>
                <h3 className="font-bold text-xl flex items-center gap-2 font-serif tracking-wide">
                    <Book className="text-amber-500" />
                    Documentation
                </h3>
                <p className="text-xs text-stone-400 opacity-90">Manuel complet de l'application</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white hover:bg-stone-800 p-2 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-stone-100 border-b border-stone-200 shrink-0">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'general' ? 'bg-white border-blue-600 text-blue-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
            >
                <HelpCircle size={18} /> Généralités
            </button>
            <button 
                onClick={() => setActiveTab('player')}
                className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'player' ? 'bg-white border-green-600 text-green-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
            >
                <User size={18} /> Guide Joueur
            </button>
            <button 
                onClick={() => setActiveTab('gm')}
                className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'gm' ? 'bg-white border-purple-600 text-purple-700' : 'border-transparent text-stone-500 hover:bg-stone-200'}`}
            >
                <Crown size={18} /> Guide MJ
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-white custom-scrollbar">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 mb-6">
                        <p className="font-bold mb-1">Bienvenue sur le gestionnaire de fiche Seigneurs des Mystères.</p>
                        <p>Cette application est conçue pour être utilisée aussi bien sur ordinateur (clavier/souris) que sur tablette (tactile). Elle remplace la fiche papier en automatisant les calculs fastidieux.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GuideSection title="Sauvegarde Automatique" icon={<Save size={18} className="text-blue-500"/>}>
                            <p>
                                L'application sauvegarde <strong>instantanément</strong> chaque modification dans la mémoire de votre navigateur (Local Storage).
                            </p>
                            <p className="mt-2 text-xs italic text-stone-500">
                                Attention : Si vous videz le cache de votre navigateur, vous perdrez vos données. Pensez à utiliser la fonction "Sauvegarder / Charger" régulièrement.
                            </p>
                        </GuideSection>

                        <GuideSection title="Interface Adaptative" icon={<LayoutGrid size={18} className="text-indigo-500"/>}>
                            <p>
                                Utilisez le bouton <strong>Portrait / Paysage</strong> en haut à gauche pour adapter l'affichage à votre écran.
                            </p>
                            <ul className="list-disc list-inside mt-2 text-xs">
                                <li><strong>Portrait :</strong> Idéal pour smartphone ou fenêtre verticale. Les blocs s'empilent.</li>
                                <li><strong>Paysage :</strong> Vue panoramique type "Tableau de bord", optimisée pour ordinateur/tablette.</li>
                            </ul>
                        </GuideSection>
                    </div>
                </div>
            )}

            {/* --- PLAYER TAB --- */}
            {activeTab === 'player' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    <GuideSection title="Remplir sa Fiche" icon={<MousePointer size={18} className="text-green-600"/>}>
                        <ul className="list-disc list-inside space-y-2">
                            <li><span className="font-bold">Compétences (Ronds) :</span> Cliquez sur un cercle pour définir le niveau. Cliquez à nouveau sur le niveau actuel pour le diminuer d'un point (ex: cliquer sur le 3ème point si vous êtes à 3 repasse à 2).</li>
                            <li><span className="font-bold">Compteurs (Carrés) :</span> La volonté et la confiance ont deux jauges. Les cercles représentent le <strong>Maximum</strong>, les carrés en dessous représentent les points <strong>Actuels</strong> (temporaires).</li>
                            <li><span className="font-bold">Champs Texte :</span> Cliquez simplement pour écrire. Les polices manuscrites sont utilisées pour l'immersion.</li>
                        </ul>
                    </GuideSection>

                    <GuideSection title="Gestion de l'Expérience (XP)" icon={<TrendingUp size={18} className="text-amber-600"/>}>
                        <p>
                            L'application calcule automatiquement le coût en XP de vos compétences et attributs.
                        </p>
                        <div className="mt-2 bg-amber-50 p-2 rounded text-xs text-amber-900 border border-amber-200">
                            <strong>Important :</strong> Pour que le calcul soit juste, vous devez définir vos valeurs de départ via le <strong>Mode Création</strong> (voir Guide MJ) ou considérer que tout ce qui est ajouté manuellement coûte de l'XP.
                        </div>
                        <p className="mt-2">
                            Allez dans l'onglet <strong>Gestion XP</strong> pour ajouter vos gains d'expérience (fin de scénario). Le panneau latéral "Expérience" sur la fiche principale se mettra à jour automatiquement (Reste = Gains - Dépenses calculées).
                        </p>
                    </GuideSection>

                    <GuideSection title="Journal & Notes" icon={<Book size={18} className="text-stone-600"/>}>
                        <p>
                            L'onglet <strong>Notes de Campagne</strong> est un journal interactif.
                        </p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Ajoutez des pages pour chaque session.</li>
                            <li><strong>Images :</strong> Vous pouvez dessiner un rectangle sur la page avec votre souris pour insérer une image à cet endroit précis. Les images sont redimensionnables et déplaçables.</li>
                            <li><strong>Groupe :</strong> L'onglet "Groupe" dans le journal permet de suivre les informations des autres PJ ou PNJ importants sous forme de tableau.</li>
                        </ul>
                    </GuideSection>

                    <GuideSection title="Spécialisations" icon={<Layers size={18} className="text-purple-600"/>}>
                        <p>
                            L'onglet <strong>Spécialisations</strong> n'affiche que les compétences pertinentes.
                        </p>
                        <p>
                            Une compétence apparaît dans cette liste uniquement si vous avez au moins <strong>1 point</strong> dedans, ou si le MJ a défini une spécialisation imposée. Le nombre de lignes disponibles dépend de votre score dans la compétence.
                        </p>
                    </GuideSection>
                </div>
            )}

            {/* --- GM TAB --- */}
            {activeTab === 'gm' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded text-sm mb-6 shadow-sm">
                        <h4 className="font-bold text-purple-900 mb-1">Philosophie de l'outil</h4>
                        <p className="text-purple-800">
                            Cette application permet au MJ de créer un "Système" (ou Template) personnalisé, de l'exporter, et de l'envoyer à ses joueurs pour qu'ils commencent avec une fiche pré-configurée.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <GuideSection title="Configuration de la Fiche" icon={<Settings size={18} className="text-slate-600"/>}>
                            <p>Via le bouton <strong>Configurer</strong> (roue crantée), vous pouvez :</p>
                            <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                                <li>Renommer n'importe quelle compétence ou catégorie.</li>
                                <li>Ajouter des compétences personnalisées.</li>
                                <li>Réorganiser l'ordre des compétences (Glisser-Déposer).</li>
                                <li>Activer/Désactiver les <strong>Attributs Secondaires</strong>.</li>
                                <li>Définir des <strong>Spécialisations Imposées</strong> (visible dans l'onglet Spécialisations).</li>
                            </ul>
                        </GuideSection>

                        <GuideSection title="Mode Création" icon={<Zap size={18} className="text-yellow-600"/>}>
                            <p>
                                Le <strong>Mode Création</strong> (activable dans les Paramètres ou via l'icône sur la fiche) est crucial.
                            </p>
                            <p className="mt-2 text-xs">
                                Lorsqu'il est actif, toutes les modifications de points sont considérées comme "gratuites" (Valeur de base). 
                                Un bandeau en bas d'écran aide à répartir les points (Attributs, Compétences, Arrière-plans) selon les règles définies (Rangs ou Points).
                            </p>
                            <p className="mt-2 text-xs font-bold">
                                Une fois la création validée, le mode se désactive et toute modification ultérieure coûtera de l'XP.
                            </p>
                        </GuideSection>
                    </div>

                    <GuideSection title="Bibliothèque de Traits & Effets" icon={<Layers size={18} className="text-teal-600"/>}>
                        <p>
                            La <strong>Bibliothèque</strong> permet de créer des Avantages/Désavantages standards.
                        </p>
                        <p className="mt-2">
                            <span className="font-bold text-slate-800">Effets Mécaniques :</span> Vous pouvez attacher des scripts aux traits.
                        </p>
                        <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                            <li><strong>Bonus XP :</strong> Ajoute ou retire de l'XP total (ex: un désavantage donnant +10 XP).</li>
                            <li><strong>Bonus Attribut :</strong> Ajoute des points "gratuits" dans un attribut (ex: +1 Force). Ces points ne comptent pas dans le calcul du coût XP.</li>
                            <li><strong>Rang Gratuit :</strong> Définit qu'une compétence est gratuite jusqu'à un certain rang (ex: Langue maternelle à 5).</li>
                        </ul>
                    </GuideSection>

                    <GuideSection title="Export & Distribution" icon={<Save size={18} className="text-blue-600"/>}>
                        <p>Le menu <strong>Sauvegarder / Charger</strong> propose plusieurs formats :</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="border p-2 rounded bg-slate-50">
                                <span className="font-bold block text-slate-800">Personnage Complet</span>
                                Sauvegarde tout (valeurs, images, journal). C'est la sauvegarde du joueur.
                            </div>
                            <div className="border p-2 rounded bg-orange-50 border-orange-200">
                                <span className="font-bold block text-orange-800">Système de Jeu (MJ)</span>
                                Exporte la <strong>Structure</strong> (noms des compétences, configuration) et la <strong>Bibliothèque</strong>, mais <span className="underline">efface</span> toutes les valeurs et données personnelles.
                                <br/><br/>
                                <em>C'est le fichier à envoyer à vos joueurs avant la partie !</em>
                            </div>
                        </div>
                    </GuideSection>

                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
            <button 
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
                Fermer
            </button>
        </div>

      </div>
    </div>
  );
};

export default UserGuideModal;
