import React from 'react';
import { X, HelpCircle, MousePointer, GripVertical, Settings, Zap, LayoutGrid, Save, BookOpen, Layers } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            {icon} {title}
        </h4>
        <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            {children}
        </div>
    </div>
);

const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-indigo-600 p-4 border-b border-indigo-700 rounded-t-xl text-white">
            <div>
                <h3 className="font-bold text-xl flex items-center gap-2">
                    <HelpCircle className="text-indigo-200" />
                    Guide d'utilisation
                </h3>
                <p className="text-xs text-indigo-200 opacity-90">Fonctionnalités et interactions principales</p>
            </div>
            <button onClick={onClose} className="text-indigo-200 hover:text-white hover:bg-indigo-500 p-2 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-white">
            
            <GuideSection title="Interactions de base" icon={<MousePointer size={18} className="text-blue-500"/>}>
                <p>
                    <span className="font-bold text-slate-800">Cocher des cases :</span> Cliquez sur les ronds (compétences) ou les carrés (volonté) pour définir une valeur. 
                    Cliquez à nouveau sur la valeur actuelle pour la réduire (ex: cliquer sur le 3ème point si vous êtes à 3 repasse à 2).
                </p>
                <p>
                    <span className="font-bold text-slate-800">Champs texte :</span> Tous les champs soulignés ou encadrés sont éditables. Les zones comme "Notes" s'agrandissent automatiquement.
                </p>
                <p>
                    <span className="font-bold text-slate-800">Infobulles :</span> Survolez les totaux d'attributs pour voir le détail des calculs (Base + Bonus de traits).
                </p>
            </GuideSection>

            <GuideSection title="Configuration & Personnalisation" icon={<Settings size={18} className="text-slate-600"/>}>
                <p>
                    Le bouton <span className="font-bold bg-slate-200 px-1 rounded">Configurer</span> en haut à droite permet de modifier la structure de la fiche.
                </p>
                <ul className="list-disc list-inside ml-2">
                    <li><span className="font-bold">Renommer :</span> Changez le nom de n'importe quelle compétence, attribut ou catégorie.</li>
                    <li><span className="font-bold">Ajouter/Supprimer :</span> Ajoutez des lignes dans les listes ou supprimez celles inutiles.</li>
                    <li><span className="font-bold">Glisser-Déposer :</span> Réorganisez l'ordre des compétences en les faisant glisser via la poignée <GripVertical size={12} className="inline"/>.</li>
                    <li><span className="font-bold">Mode Création :</span> Active un HUD en bas d'écran pour suivre la dépense de points ou de rangs à la création.</li>
                </ul>
            </GuideSection>

            <GuideSection title="Attributs Avancés" icon={<LayoutGrid size={18} className="text-purple-600"/>}>
                <p>
                    Dans l'onglet <strong>Configuration &gt; Attributs</strong>, vous pouvez :
                </p>
                <ul className="list-disc list-inside ml-2">
                    <li>Définir le nombre de colonnes (catégories) et de lignes (attributs).</li>
                    <li>Utiliser des <strong>Préréglages</strong> pour charger rapidement une structure (Standard ou Mystique).</li>
                    <li>Activer les <strong>Attributs Secondaires</strong> : Ajoute 2 attributs optionnels sous chaque catégorie (ex: Corpulence, Attraction...), séparés par une ligne.</li>
                </ul>
            </GuideSection>

            <GuideSection title="Bibliothèque & Effets" icon={<BookOpen size={18} className="text-amber-600"/>}>
                <p>
                    La bibliothèque permet de stocker des <strong>Vertus</strong> et <strong>Défauts</strong> réutilisables.
                </p>
                <p>
                    <span className="font-bold text-slate-800"><Zap size={12} className="inline text-amber-500"/> Effets Mécaniques :</span> Vous pouvez attacher des scripts aux traits de la bibliothèque (ex: "+1 en Force", "+50 XP"). 
                    Si vous ajoutez ce trait à votre personnage (Onglet Détails), les bonus s'appliquent automatiquement sur la fiche.
                </p>
            </GuideSection>

            <GuideSection title="Spécialisations" icon={<Layers size={18} className="text-green-600"/>}>
                <p>
                    L'onglet <strong>Spécialisations</strong> s'adapte dynamiquement. Une compétence n'apparait ici que si :
                </p>
                <ul className="list-disc list-inside ml-2">
                    <li>Vous avez mis au moins 1 point dedans.</li>
                    <li>OU une spécialisation "Imposée" a été définie dans la configuration.</li>
                </ul>
                <p className="mt-1 text-xs italic">
                    Astuce : Sur la fiche principale, un astérisque (*) apparait à côté des compétences ayant des spécialisations remplies. Cliquez sur le nom pour les voir.
                </p>
            </GuideSection>

            <GuideSection title="Sauvegarde & Données" icon={<Save size={18} className="text-blue-600"/>}>
                <p>
                    La sauvegarde est <strong>automatique</strong> dans votre navigateur (Local Storage).
                </p>
                <p>
                    Utilisez le bouton <strong>Sauvegarder / Charger</strong> pour :
                </p>
                <ul className="list-disc list-inside ml-2">
                    <li>Sauvegarder votre fiche en fichier <code>.json</code>.</li>
                    <li>Transférer votre fiche sur un autre appareil.</li>
                    <li>Exporter uniquement le "Système" (votre configuration personnalisée) pour l'envoyer à vos joueurs.</li>
                </ul>
            </GuideSection>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
            <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
                J'ai compris
            </button>
        </div>

      </div>
    </div>
  );
};

export default UserGuideModal;