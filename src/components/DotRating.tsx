
import React from 'react';

interface DotRatingProps {
  value: number;
  creationValue?: number; // The value locked in after creation
  max?: number;
  onChange?: (val: number) => void;
  className?: string;
  readOnly?: boolean;
  creationColor?: string; // New: Dynamic creation color
  xpColor?: string;       // New: Dynamic XP color
}

const DotRating: React.FC<DotRatingProps> = ({ 
    value, 
    creationValue = 0, 
    max = 5, 
    onChange, 
    className = '', 
    readOnly = false,
    creationColor,
    xpColor
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < value;
        const isCreationDot = index < creationValue;
        
        // Visual Logic:
        // Use inline styles for dynamic user-defined colors
        
        let style: React.CSSProperties = {};
        let dotClass = 'bg-transparent border-stone-400'; // Default Empty
        
        if (filled) {
            if (isCreationDot) {
                // Creation Dot (Dynamic Color)
                if (creationColor) {
                    style = { backgroundColor: creationColor, borderColor: creationColor };
                    dotClass = ''; // Override classes
                } else {
                    // Fallback default
                    dotClass = 'bg-blue-600 border-blue-700'; 
                }
            } else {
                // XP Dot (Dynamic Color)
                if (xpColor) {
                     style = { backgroundColor: xpColor, borderColor: xpColor };
                     dotClass = ''; // Override classes
                } else {
                    // Fallback default
                    dotClass = 'bg-stone-800 border-stone-900';
                }
            }
        }

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
            style={style}
            className={`w-3 h-3 rounded-full border transition-colors ${dotClass} ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-blue-200 hover:border-blue-300'
            }`}
            aria-label={`Set rating to ${index + 1}`}
            title={isCreationDot ? "Acquis à la création (Coût: 0 XP)" : "Acquis par XP"}
          />
        );
      })}
    </div>
  );
};

export default DotRating;
