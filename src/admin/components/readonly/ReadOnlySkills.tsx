import React from 'react';
import { Book } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlySkillsProps {
    skills?: CharacterSheetData['skills'];
    specializations?: CharacterSheetData['specializations'];
    imposedSpecializations?: CharacterSheetData['imposedSpecializations'];
    getCategoryLabel: (id: string) => string;
}

export const ReadOnlySkills: React.FC<ReadOnlySkillsProps> = ({
    skills = {},
    specializations = {},
    imposedSpecializations = {},
    getCategoryLabel
}) => {
    const activeSkillCategories = Object.entries(skills)
        .filter(([category, categorySkills]) => {
            const active = categorySkills.filter(s => s.name && s.value > 0);
            const catId = category.toUpperCase();
            return active.length > 0 &&
                !catId.includes('BACKGROUND') &&
                !catId.includes('ARRIÈRE-PLAN') &&
                catId !== 'COL_COMP_9';
        })
        .sort(([a], [b]) => a.localeCompare(b));

    if (activeSkillCategories.length === 0) return null;

    return (
        <MotionFade delay={0.25}>
            <section className="bg-stone-900/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <Book size={16} /> Grimoire des Savoirs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeSkillCategories.map(([category, categorySkills]) => (
                        <div key={category} className="space-y-3">
                            <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 border-l-2 border-amber-900/30 pl-2">
                                {getCategoryLabel(category)}
                            </h4>
                            <div className="space-y-1.5 font-sans">
                                {categorySkills.filter(s => s.name && s.value > 0).map((skill, idx) => {
                                    const personalSpecs = specializations[skill.id] || [];
                                    const imposedSpecs = imposedSpecializations[skill.id] || [];

                                    return (
                                        <div key={idx} className="bg-stone-950/40 px-3 py-2 rounded-sm border border-stone-800/60 flex flex-col gap-1.5 group hover:border-amber-900/20 transition-all">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-stone-300 font-bold group-hover:text-amber-500 transition-colors uppercase tracking-tight truncate mr-2" title={skill.name}>{skill.name}</span>
                                                <span className="font-serif font-black text-amber-600 text-sm tabular-nums">{skill.value}</span>
                                            </div>
                                            {(personalSpecs.length > 0 || imposedSpecs.length > 0) && (
                                                <div className="flex flex-wrap gap-1">
                                                    {imposedSpecs.map((spec, sIdx) => (
                                                        <span key={`imp-${sIdx}`} className="text-[8px] leading-tight px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded-sm border border-amber-900/40 font-black uppercase tracking-tighter">
                                                            {spec.name}
                                                        </span>
                                                    ))}
                                                    {personalSpecs.map((spec, sIdx) => (
                                                        <span key={`pers-${sIdx}`} className="text-[8px] leading-tight px-1.5 py-0.5 bg-stone-800/50 text-stone-500 rounded-sm italic border border-stone-800">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </MotionFade>
    );
};
