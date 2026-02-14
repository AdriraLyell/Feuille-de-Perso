import React from 'react';
import { Star } from 'lucide-react';
import { CharacterSheetData } from '../../../types/character';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyAttributesProps {
    attributeSettings?: CharacterSheetData['attributeSettings'];
    attributes?: CharacterSheetData['attributes'];
}

export const ReadOnlyAttributes: React.FC<ReadOnlyAttributesProps> = ({ attributeSettings, attributes }) => {
    return (
        <MotionFade delay={0.2}>
            <section className="bg-stone-950/20 border border-stone-800 p-6 rounded-sm shadow-inner relative overflow-hidden">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <Star size={16} /> Éclats des Attributs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(attributeSettings || []).map((setting) => {
                        const attrs = attributes?.[setting.id] || [];
                        return (
                            <div key={setting.id} className="space-y-4">
                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] mb-4 flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-sm border border-stone-800 shadow-sm">
                                    <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                    {setting.label}
                                </h4>
                                <div className="space-y-2">
                                    {attrs.map((attr, idx) => {
                                        const v1 = parseInt(attr.val1) || 0;
                                        const v2 = parseInt(attr.val2) || 0;
                                        const v3 = parseInt(attr.val3) || 0;
                                        const total = v1 + v2 + v3;
                                        return (
                                            <div key={idx} className="bg-stone-900/60 px-4 py-2.5 rounded-sm flex justify-between items-center text-sm border border-stone-800 group hover:border-amber-900/30 hover:bg-stone-800/40 transition-all shadow-sm">
                                                <span className="text-stone-400 group-hover:text-stone-200 transition-colors font-medium tracking-wide uppercase text-xs">{attr.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-1 bg-stone-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-600" style={{ width: `${(total / 15) * 100}%` }} />
                                                    </div>
                                                    <span className="font-serif font-black text-amber-500 text-lg tabular-nums">{total}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </MotionFade>
    );
};
