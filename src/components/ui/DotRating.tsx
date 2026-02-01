
import {
  Circle, Square, Diamond, Triangle, Hexagon, Star, Heart,
  Zap, Shield, Skull, Plus, Sword, Flame, Moon, LucideIcon,
  Crown, Ghost, Axe, Hammer, Eye, Droplets, Wind, Sun, Cloud,
  Target, Crosshair, Trophy, Key, Anchor, Feather, PawPrint,
  TreeDeciduous, Mountain, Waves
} from 'lucide-react';

interface DotRatingProps {
  value: number;
  creationValue?: number; // The value locked in after creation
  max?: number;
  onChange?: (val: number) => void;
  className?: string;
  readOnly?: boolean;
  creationColor?: string; // New: Dynamic creation color
  xpColor?: string;       // New: Dynamic XP color
  symbol?: string;        // New: Custom symbol shape
}

// Icon Mapping for easy lookup
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

const DotRating: React.FC<DotRatingProps> = ({
  value,
  creationValue = 0,
  max = 5,
  onChange,
  className = '',
  readOnly = false,
  creationColor,
  xpColor,
  symbol = 'circle'
}) => {
  const IconComponent = SYMBOL_MAP[symbol] || Circle;
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < value;
        const isCreationDot = index < creationValue;

        const activeColor = isCreationDot ? (creationColor || '#2563eb') : (xpColor || '#292524');
        const inactiveColor = '#d6d3d1'; // stone-300

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (readOnly || !onChange) return;
              const newValue = index + 1;
              onChange(newValue === value ? newValue - 1 : newValue);
            }}
            className={`w-3 h-3 flex items-center justify-center transition-all ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125'
              }`}
            aria-label={`Set rating to ${index + 1}`}
            title={isCreationDot ? "Acquis à la création (Coût: 0 XP)" : "Acquis par XP"}
          >
            <IconComponent
              size={12}
              stroke={filled ? activeColor : inactiveColor}
              fill={filled ? activeColor : 'transparent'}
              strokeWidth={filled ? 2.5 : 1.5}
            />
          </button>
        );
      })}
    </div>
  );
};

export default DotRating;
