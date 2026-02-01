
import React from 'react';
import { CharacterSheetData, ThemeConfig } from '../../types';
import {
    Palette, RotateCcw, Circle, Square, Diamond, Triangle, Hexagon, Star, Heart,
    Zap, Shield, Skull, Plus, Sword, Flame, Moon, LucideIcon,
    Crown, Ghost, Axe, Hammer, Eye, Droplets, Wind, Sun, Cloud,
    Target, Crosshair, Trophy, Key, Anchor, Feather, PawPrint,
    TreeDeciduous, Mountain, Waves
} from 'lucide-react';
import { DEFAULT_THEME } from '../../data/initialState';

interface AppearanceEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const AppearanceEditor: React.FC<AppearanceEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const theme = data.theme || DEFAULT_THEME;

    const updateTheme = (field: keyof ThemeConfig, value: string) => {
        onUpdate({
            ...data,
            theme: {
                ...theme,
                [field]: value
            }
        });
    };

    const resetTheme = () => {
        onUpdate({
            ...data,
            theme: DEFAULT_THEME
        });
        onAddLog('Thème réinitialisé aux couleurs par défaut.', 'info', 'settings');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#fdfbf7]/80 backdrop-blur-sm p-6 rounded-sm shadow-md border border-[#bfae85]/30">
                <div className="flex items-center justify-between border-b border-[#bfae85]/30 pb-2 mb-4">
                    <h4 className="font-bold text-[#5c4d41] flex items-center gap-2 uppercase tracking-widest text-sm">
                        <Palette size={18} className="text-[#8b2e2e]" /> Paramètres Visuels
                    </h4>
                    <button
                        onClick={resetTheme}
                        className="text-[10px] font-bold text-[#5c4d41]/60 hover:text-[#8b2e2e] hover:bg-[#8b2e2e]/5 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors border border-transparent hover:border-[#8b2e2e]/20"
                        title="Remettre les couleurs par défaut"
                    >
                        <RotateCcw size={12} /> Réinitialiser
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 bg-[#bfae85]/5 p-4 rounded-sm border border-[#bfae85]/20">
                        <label className="block text-[10px] font-bold text-[#8b2e2e] uppercase tracking-widest">Points à la Création</label>
                        <p className="text-[10px] text-[#5c4d41]/70 mb-2 italic">Couleur des points de base et en mode création.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={theme.creationColor}
                                onChange={(e) => updateTheme('creationColor', e.target.value)}
                                className="w-12 h-12 border-none rounded-sm cursor-pointer bg-white shadow-sm ring-1 ring-[#bfae85]/30"
                            />
                            <div className="flex-grow flex flex-col justify-center">
                                <div className="flex gap-1.5 mb-1">
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-[#bfae85] bg-transparent"></span>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#5c4d41]">{theme.creationColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-[#bfae85]/5 p-4 rounded-sm border border-[#bfae85]/20">
                        <label className="block text-[10px] font-bold text-[#8b2e2e] uppercase tracking-widest">Points via XP</label>
                        <p className="text-[10px] text-[#5c4d41]/70 mb-2 italic">Couleur des points achetés avec de l'expérience.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={theme.xpColor}
                                onChange={(e) => updateTheme('xpColor', e.target.value)}
                                className="w-12 h-12 border-none rounded-sm cursor-pointer bg-white shadow-sm ring-1 ring-[#bfae85]/30"
                            />
                            <div className="flex-grow flex flex-col justify-center">
                                <div className="flex gap-1.5 mb-1">
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-[#bfae85] bg-transparent"></span>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#5c4d41]">{theme.xpColor}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Symbol Selection */}
                <div className="mt-8 bg-[#bfae85]/5 p-4 rounded-sm border border-[#bfae85]/20 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-[#8b2e2e] uppercase tracking-widest">Forme des points</label>
                            <p className="text-[10px] text-[#5c4d41]/70 italic leading-tight">Le symbole héraldique utilisé pour marquer vos scores.</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] rounded-sm border border-[#bfae85]/30 shadow-inner">
                            <span className="text-[9px] font-bold text-[#5c4d41]/50 uppercase tracking-tighter">Aperçu :</span>
                            <div className="flex gap-1">
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.creationColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.creationColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.xpColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.xpColor} filled={false} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {Object.entries(SYMBOL_MAP).map(([name, Icon]) => (
                            <button
                                key={name}
                                onClick={() => updateTheme('dotSymbol', name)}
                                className={`p-2.5 rounded-sm border transition-all ${(theme.dotSymbol || 'circle') === name
                                    ? 'bg-[#8b2e2e] border-[#5c1e1e] text-white shadow-inner scale-105'
                                    : 'bg-white/50 border-[#bfae85]/30 text-[#5c4d41]/40 hover:border-[#8b2e2e]/40 hover:text-[#8b2e2e]/60'
                                    }`}
                                title={name.charAt(0).toUpperCase() + name.slice(1)}
                            >
                                <Icon size={18} fill={(theme.dotSymbol || 'circle') === name ? 'white' : 'transparent'} strokeWidth={2} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Helper for preview
const SymbolPreview: React.FC<{ symbol: string, color: string, filled: boolean }> = ({ symbol, color, filled }) => {
    const Icon = SYMBOL_MAP[symbol] || Circle;
    const inactiveColor = '#d6d3d1'; // stone-300

    return (
        <div className="w-4 h-4 flex items-center justify-center">
            <Icon
                size={12}
                stroke={filled ? color : inactiveColor}
                fill={filled ? color : 'transparent'}
                strokeWidth={filled ? 2.5 : 1.5}
            />
        </div>
    );
};

const SYMBOL_MAP: Record<string, LucideIcon> = {
    circle: Circle,
    square: Square,
    diamond: Diamond,
    triangle: Triangle,
    hexagon: Hexagon,
    star: Star,
    heart: Heart,
    zap: Zap,
    shield: Shield,
    skull: Skull,
    plus: Plus,
    sword: Sword,
    flame: Flame,
    moon: Moon,
    crown: Crown,
    ghost: Ghost,
    axe: Axe,
    hammer: Hammer,
    eye: Eye,
    droplets: Droplets,
    wind: Wind,
    sun: Sun,
    cloud: Cloud,
    target: Target,
    crosshair: Crosshair,
    trophy: Trophy,
    key: Key,
    anchor: Anchor,
    feather: Feather,
    paw: PawPrint,
    tree: TreeDeciduous,
    mountain: Mountain,
    waves: Waves
};

export default AppearanceEditor;
