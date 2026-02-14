import React from 'react';
import { Award } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyBackgroundsProps {
    skills?: CharacterSheetData['skills'];
    specializations?: CharacterSheetData['specializations'];
    imposedSpecializations?: CharacterSheetData['imposedSpecializations'];
}

export const ReadOnlyBackgrounds: React.FC<ReadOnlyBackgroundsProps> = ({
    skills = {},
    specializations = {},
    imposedSpecializations = {}
}) => {
    const backgrounds = Object.entries(skills)
        .filter(([category]) =>
            category.toLowerCase().includes('background') ||
            category.toLowerCase().includes('arrière-plan') ||
            category === 'Col_Comp_8'
        )
        .flatMap(([_, categorySkills]) => categorySkills.filter(s => s.name && s.value > 0))
        .sort((a, b) => a.name.localeCompare(b.name));

    if (backgrounds.length === 0) return null;

    return (
        <MotionFade delay={0.3}>
            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <Award size={16} /> Chroniques Antérieures
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {backgrounds.map((bg, idx) => {
                        const personalSpecs = specializations[bg.id] || [];
                        const imposedSpecs = imposedSpecializations[bg.id] || [];

                        return (
                            <div key={idx} className="bg-stone-900/60 p-4 rounded-sm border border-stone-800 flex flex-col gap-2 group hover:border-amber-900/20 transition-all shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start z-10">
                                    <div className="flex flex-col">
                                        <span className="font-serif font-black text-lg text-stone-200 group-hover:text-amber-500 transition-all uppercase tracking-wide">{bg.name}</span>
                                        {bg.variant && <span className="text-[10px] text-stone-500 italic font-medium uppercase tracking-widest mt-0.5">{bg.variant}</span>}
                                    </div>
                                    <span className="font-serif font-black text-amber-600 text-xl tabular-nums bg-stone-950/50 w-10 h-10 flex items-center justify-center rounded-sm border border-stone-800">{bg.value}</span>
                                </div>
                                {(personalSpecs.length > 0 || imposedSpecs.length > 0) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                                        {imposedSpecs.map((spec, sIdx) => (
                                            <span key={`imp-${sIdx}`} className="text-[8px] leading-tight px-2 py-0.5 bg-amber-900/30 text-amber-500 rounded-sm border border-amber-900/30 font-black uppercase tracking-widest">
                                                {spec.name}
                                            </span>
                                        ))}
                                        {personalSpecs.map((spec, sIdx) => (
                                            <span key={`pers-${sIdx}`} className="text-[8px] leading-tight px-2 py-0.5 bg-stone-800/80 text-stone-500 rounded-sm italic border border-stone-700/50">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <Award size={64} className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500" />
                            </div>
                        );
                    })}
                </div>
            </section>
        </MotionFade>
    );
};
