import React from 'react';
import { User } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyIdentityProps {
    header?: CharacterSheetData['header'];
}

export const ReadOnlyIdentity: React.FC<ReadOnlyIdentityProps> = ({ header }) => {
    return (
        <MotionFade delay={0.1}>
            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass relative overflow-hidden group">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <User size={16} /> Registre d'Identité
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Nom du Personnage", value: header?.name },
                        { label: "Nom du Joueur", value: header?.player },
                        { label: "Chronique", value: header?.chronicle },
                        { label: "Nature Secrète", value: header?.nature }
                    ].map((item, i) => (
                        <div key={i} className="group-hover:translate-x-1 transition-transform">
                            <span className="text-stone-600 block text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</span>
                            <span className="font-serif font-bold text-lg text-stone-200">{item.value || '-'}</span>
                        </div>
                    ))}
                </div>
            </section>
        </MotionFade>
    );
};
