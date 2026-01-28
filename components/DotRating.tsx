
import React from 'react';

interface DotRatingProps {
  value: number;
  creationValue?: number; // The value locked in after creation
  max?: number;
  onChange?: (val: number) => void;
  className?: string;
  readOnly?: boolean;
}

const DotRating: React.FC<DotRatingProps> = ({ value, creationValue = 0, max = 5, onChange, className = '', readOnly = false }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < value;
        const isCreationDot = index < creationValue;
        
        // Visual Logic:
        // - Creation Dot: Filled with Royal Blue (Distinct from black, visible, fits ink theme)
        // - XP Dot (Post-Creation): Filled with Dark Stone/Black
        // - Empty: Transparent with Stone border
        
        let dotStyle = 'bg-transparent border-stone-400'; // Default Empty
        
        if (filled) {
            if (isCreationDot) {
                // Création : Bleu Roi (Blue 600) avec bordure assortie
                dotStyle = 'bg-blue-600 border-blue-700'; 
            } else {
                // XP : Noir / Gris Foncé (Stone 800)
                dotStyle = 'bg-stone-800 border-stone-900';
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
            className={`w-3 h-3 rounded-full border transition-colors ${dotStyle} ${
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
