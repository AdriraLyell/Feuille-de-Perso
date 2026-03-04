import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRosterData } from './hooks/useRosterData';
import { RosterHeader } from './components/RosterHeader';
import { RosterTimeSection } from './components/RosterTimeSection';
import { RosterAttributesTable } from './components/RosterAttributesTable';
import { RosterSkillMatrix } from './components/RosterSkillMatrix';
import { RosterTraitsGrid } from './components/RosterTraitsGrid';
import MessageWidget from '../components/messaging/MessageWidget';
import { useMessagingContacts } from '../hooks/messaging/useMessagingContacts';

/** Wrapper pour le widget MJ dans le Roster (besoin d'appeler le hook) */
const RosterMessageWidget: React.FC<{
    settingId: string;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
}> = ({ settingId, isOpen, onToggle }) => {
    const contacts = useMessagingContacts({ settingId, viewerId: 'GM', isGM: true });
    return (
        <MessageWidget
            settingId={settingId}
            viewerId="GM"
            viewerName="Meneur de Jeu"
            contacts={contacts}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};

interface RosterAppProps {
    settingId: string;
}

export const RosterApp: React.FC<RosterAppProps> = ({ settingId }) => {
    const {
        characters,
        rules,
        isLoading,
        error,
        allAttributes,
        skillMatrix,
        formatCurrentDate,
        handleAdvanceTime,
        handleRollbackTime
    } = useRosterData(settingId);

    const [showTimeManagement, setShowTimeManagement] = useState(true);
    const [isMessagingOpen, setIsMessagingOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
                <p className="text-amber-700/60 font-serif italic text-xl">Consultation des registres akashiques...</p>
            </div>
        );
    }

    if (error || !rules) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8">
                <AlertCircle className="text-rose-600 mb-4" size={48} />
                <p className="text-rose-500 font-bold uppercase tracking-widest">{error || "Erreur inconnue"}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-300 p-8 font-sans selection:bg-amber-900/50">
            <RosterHeader
                settingName={rules.settingName || "Inconnue"}
                characterCount={characters.length}
                isMessagingOpen={isMessagingOpen}
                onToggleMessaging={() => setIsMessagingOpen(!isMessagingOpen)}
            />

            {characters.length === 0 ? (
                <div className="max-w-7xl mx-auto text-center py-32 bg-stone-950/50 rounded-lg border border-stone-800/50 shadow-glass-dark">
                    <p className="text-stone-500 font-serif italic text-2xl">Le registre est vide pour cette chronique.</p>
                </div>
            ) : (
                <main className="max-w-7xl mx-auto space-y-12">
                    <RosterTimeSection
                        showTimeManagement={showTimeManagement}
                        setShowTimeManagement={setShowTimeManagement}
                        currentDate={formatCurrentDate()}
                        onAdvanceTime={handleAdvanceTime}
                        onRollbackTime={handleRollbackTime}
                    />

                    <RosterAttributesTable
                        characters={characters}
                        allAttributes={allAttributes}
                    />

                    <RosterSkillMatrix
                        characters={characters}
                        skillMatrix={skillMatrix}
                    />

                    <RosterTraitsGrid
                        characters={characters}
                    />
                </main>
            )}

            {/* Widget Messagerie MJ avec contrôle externe */}
            <RosterMessageWidget
                settingId={settingId}
                isOpen={isMessagingOpen}
                onToggle={setIsMessagingOpen}
            />
        </div>
    );
};
