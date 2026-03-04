import React from 'react';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../../constants';

interface BookPageBackgroundProps {
    pageCount: number;
}

export const BookPageBackground: React.FC<BookPageBackgroundProps> = ({ pageCount }) => {
    const visualPageCount = Math.ceil(pageCount / 2) * 2;

    return (
        <div
            className="absolute top-0 left-0 h-full pointer-events-none flex"
            style={{ width: `${visualPageCount * (PAGE_WIDTH + 40)}px` }}
        >
            {Array.from({ length: visualPageCount }).map((_, i) => (
                <div
                    key={i}
                    className="bg-[#fbf4e9] shadow-xl rounded-sm"
                    style={{
                        width: `${PAGE_WIDTH}px`,
                        height: `${PAGE_HEIGHT}px`,
                        marginRight: '40px',
                        flexShrink: 0,
                        position: 'relative',
                        scrollSnapAlign: 'start',
                    }}
                >
                    {/* Page Number */}
                    <div className="absolute bottom-2 w-full text-center text-stone-400 text-xs font-serif">
                        - {i + 1} -
                    </div>

                    {/* Binding Shadows */}
                    <div className="absolute top-0 right-0 h-full w-[20px] bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 h-full w-[15px] bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                </div>
            ))}
        </div>
    );
};
