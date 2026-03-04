import React from 'react';
import { Package } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface ReadOnlyInventoryProps {
    inventory?: string;
}

export const ReadOnlyInventory: React.FC<ReadOnlyInventoryProps> = ({ inventory }) => {
    if (!inventory || inventory.trim() === '') return null;

    return (
        <MotionFade delay={0.45}>
            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                    <Package size={16} /> Inventaire & Effets
                </h3>
                <div className="bg-stone-900/40 p-5 rounded-sm border border-stone-800 shadow-inner min-h-[100px] font-sans text-stone-300 leading-relaxed whitespace-pre-wrap italic opacity-80 decoration-stone-800">
                    {inventory}
                </div>
            </section>
        </MotionFade>
    );
};
