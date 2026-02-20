import React from 'react';
import { InteractionMode } from '../hooks/useBookImageInteraction';

interface BookImageResizeHandlesProps {
    handleMouseDown: (e: React.MouseEvent, mode: InteractionMode) => void;
}

const BookImageResizeHandles: React.FC<BookImageResizeHandlesProps> = ({ handleMouseDown }) => {
    return (
        <>
            {/* Edge handles — thin bars centered on each edge */}
            <div
                className="absolute top-1/2 -translate-y-1/2 left-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                title="Redimensionner Largeur"
            />
            <div
                className="absolute top-1/2 -translate-y-1/2 right-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                title="Redimensionner Largeur"
            />
            <div
                className="absolute left-1/2 -translate-x-1/2 top-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
                title="Redimensionner Hauteur"
            />
            <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
                title="Redimensionner Hauteur"
            />

            {/* Corner handles — round dots */}
            <div
                className="absolute top-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'resize-tl')}
                title="Redimensionner"
            />
            <div
                className="absolute top-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'resize-tr')}
                title="Redimensionner"
            />
            <div
                className="absolute bottom-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'resize-bl')}
                title="Redimensionner"
            />
            <div
                className="absolute bottom-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, 'resize-br')}
                title="Redimensionner"
            />
        </>
    );
};

export default BookImageResizeHandles;
