import React from 'react';
import { Target } from 'lucide-react';
import { ExperienceData } from '../../../types/system';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyExperienceProps {
    experience?: ExperienceData;
}

export const ReadOnlyExperience: React.FC<ReadOnlyExperienceProps> = ({ experience }) => {
    return (
        <MotionFade delay={0.4}>
            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <Target size={16} /> Bilan des Expériences
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {[
                        { label: "Total Acquis", value: experience?.gain, color: 'text-stone-300' },
                        { label: "Points Dépensés", value: experience?.spent, color: 'text-stone-300' },
                        { label: "Reliquat d'Énergie", value: experience?.rest, color: 'text-amber-500 font-serif font-black text-2xl animate-pulse-subtle bg-amber-900/10 px-3 py-1 rounded-sm border border-amber-900/20 shadow-glow-gold' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-2">{item.label}</span>
                            <span className={`font-serif font-black ${item.color} ${typeof item.value === 'string' ? 'text-xl' : ''}`}>
                                {item.value || '0'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </MotionFade>
    );
};
