import React from 'react';
import { InteractionMode } from '../hooks/useBookImageInteraction';

interface BookImageResizeHandlesProps {
    handleMouseDown: (e: React.MouseEvent, mode: InteractionMode) => void;
}

const BookImageResizeHandles: React.FC<BookImageResizeHandlesProps> = ({ handleMouseDown }) => {
    return (
        <>
            {/* Edge handles — thin bars centered on each edge */}
            <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 left-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
                title="Redimensionner Largeur"
                aria-label="Redimensionner Largeur Gauche"
            />
            <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-[-4px] w-[3px] h-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-col-resize z-[160] transition-colors outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
                title="Redimensionner Largeur"
                aria-label="Redimensionner Largeur Droite"
            />
            <button
                type="button"
                className="absolute left-1/2 -translate-x-1/2 top-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
                title="Redimensionner Hauteur"
                aria-label="Redimensionner Hauteur Haut"
            />
            <button
                type="button"
                className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] h-[3px] w-[40%] bg-indigo-400/40 hover:bg-indigo-600 rounded-full cursor-row-resize z-[160] transition-colors outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
                title="Redimensionner Hauteur"
                aria-label="Redimensionner Hauteur Bas"
            />

            {/* Corner handles — round dots */}
            <button
                type="button"
                className="absolute top-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-tl')}
                title="Redimensionner"
                aria-label="Redimensionner Haut Gauche"
            />
            <button
                type="button"
                className="absolute top-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-tr')}
                title="Redimensionner"
                aria-label="Redimensionner Haut Droite"
            />
            <button
                type="button"
                className="absolute bottom-[-5px] left-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nesw-resize z-[161] shadow-md hover:scale-125 transition-transform outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-bl')}
                title="Redimensionner"
                aria-label="Redimensionner Bas Gauche"
            />
            <button
                type="button"
                className="absolute bottom-[-5px] right-[-5px] w-[10px] h-[10px] bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize z-[161] shadow-md hover:scale-125 transition-transform outline-none"
                onMouseDown={(e) => handleMouseDown(e, 'resize-br')}
                title="Redimensionner"
                aria-label="Redimensionner Bas Droite"
            />
        </>
    );
};

export default BookImageResizeHandles;
