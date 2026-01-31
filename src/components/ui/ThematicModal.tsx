import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ThematicModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

const ThematicModal: React.FC<ThematicModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    size = 'md',
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    // Size variants
    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
        full: "max-w-[95vw] h-[95vh]"
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`
                    relative w-full ${sizeClasses[size]} 
                    bg-[#fdfbf7] text-[#2c241b]
                    shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                    rounded-sm border-2 border-[#bfae85]/50
                    flex flex-col max-h-[90vh]
                    transform transition-all duration-300 ease-out
                    ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
                    ${className}
                `}
            >
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] rounded-sm mix-blend-multiply z-0"></div>

                {/* Decorative Corners (Pseudo-elements in CSS better, but SVG here for ease) */}
                <svg className="absolute top-0 left-0 w-8 h-8 text-[#bfae85]" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                <svg className="absolute top-0 right-0 w-8 h-8 text-[#bfae85] rotate-90" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                <svg className="absolute bottom-0 right-0 w-8 h-8 text-[#bfae85] rotate-180" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                <svg className="absolute bottom-0 left-0 w-8 h-8 text-[#bfae85] -rotate-90" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>

                {/* Header */}
                <div className="relative z-10 px-6 py-4 border-b border-[#bfae85]/50 flex items-center justify-between bg-stone-100/30">
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-[#8b2e2e] drop-shadow-sm">{icon}</span>}
                        <h2 className="text-2xl font-serif font-black tracking-wide text-[#4a3b32] uppercase drop-shadow-sm">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="
                            w-10 h-10 rounded-full flex items-center justify-center 
                            text-[#5c4d41] hover:text-[#8b2e2e] hover:bg-[#8b2e2e]/10 
                            transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]
                        "
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="relative z-10 p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="relative z-10 px-6 py-4 border-t border-[#bfae85]/50 bg-stone-100/30 flex justify-end gap-3 rounded-b-sm">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThematicModal;
