
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
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <Palette size={18} /> Paramètres Visuels
                    </h4>
                    <button
                        onClick={resetTheme}
                        className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                        title="Remettre les couleurs par défaut"
                    >
                        <RotateCcw size={12} /> Défaut
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 uppercase">Points acquis à la Création</label>
                        <p className="text-xs text-gray-500 mb-2">Utilisé pour les points "de base" et en mode création.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={theme.creationColor}
                                onChange={(e) => updateTheme('creationColor', e.target.value)}
                                className="w-12 h-12 border-none rounded-lg cursor-pointer bg-white shadow-sm ring-1 ring-gray-200"
                            />
                            <div className="flex-grow flex flex-col justify-center">
                                <div className="flex gap-1.5 mb-1">
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.creationColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-stone-400 bg-transparent"></span>
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-600">{theme.creationColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 uppercase">Points acquis par XP</label>
                        <p className="text-xs text-gray-500 mb-2">Utilisé pour les points achetés avec de l'expérience.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={theme.xpColor}
                                onChange={(e) => updateTheme('xpColor', e.target.value)}
                                className="w-12 h-12 border-none rounded-lg cursor-pointer bg-white shadow-sm ring-1 ring-gray-200"
                            />
                            <div className="flex-grow flex flex-col justify-center">
                                <div className="flex gap-1.5 mb-1">
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.xpColor }}></span>
                                    <span className="w-4 h-4 rounded-full border border-stone-400 bg-transparent"></span>
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-600">{theme.xpColor}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Symbol Selection */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 uppercase">Forme des points</label>
                            <p className="text-xs text-gray-500">Choisissez le symbole pour les attributs et compétences.</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                            <span className="text-xs font-bold text-gray-400 uppercase">Aperçu :</span>
                            <div className="flex gap-1">
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.creationColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.creationColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.xpColor} filled={true} />
                                <SymbolPreview symbol={theme.dotSymbol || 'circle'} color={theme.xpColor} filled={false} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                        {Object.entries(SYMBOL_MAP).map(([name, Icon]) => (
                            <button
                                key={name}
                                onClick={() => updateTheme('dotSymbol', name)}
                                className={`p-2 rounded-lg border flex items-center justify-center transition-all ${(theme.dotSymbol || 'circle') === name
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                                    }`}
                                title={name.charAt(0).toUpperCase() + name.slice(1)}
                            >
                                <Icon size={16} fill={(theme.dotSymbol || 'circle') === name ? 'white' : 'transparent'} />
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
