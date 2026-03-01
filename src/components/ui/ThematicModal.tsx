import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThematicModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    zIndex?: number;
    scheme?: 'paper' | 'mystic';
}

const ThematicModal: React.FC<ThematicModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    footer,
    size = 'md',
    className = '',
    zIndex = 100,
    scheme = 'paper'
}) => {
    const lastFocusedElement = React.useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            lastFocusedElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        } else {
            // Restore focus when modal closes
            // We use a small timeout to allow AnimatePresence to exit, but focus restore should happen after close is triggered
            // Actually AnimatePresence handles the exit animation, but the component is unmounted after.
            // We can cleanup focus here.

            const timer = setTimeout(() => {
                if (lastFocusedElement.current) {
                    lastFocusedElement.current.focus();
                }
            }, 100);

            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);


    // Size variants
    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
        full: "max-w-[95vw] h-[95vh]"
    };

    // Theme schemes
    const isMystic = scheme === 'mystic';
    const bgClass = isMystic
        ? "bg-stone-950/95 text-stone-200 border-stone-700 shadow-glass backdrop-blur-md"
        : "bg-paper-cream text-stone-900 border-amber-gold/40 shadow-paper";

    const headerBorderClass = isMystic ? "border-stone-800" : "border-[#bfae85]/50";
    const headerBgClass = isMystic ? "bg-stone-900/50" : "bg-stone-100/30";
    const cornerColorClass = isMystic ? "text-stone-700" : "text-[#bfae85]";
    const closeBtnClass = isMystic
        ? "text-stone-500 hover:text-amber-500 hover:bg-amber-900/20 focus:ring-amber-500"
        : "text-[#5c4d41] hover:text-[#8b2e2e] hover:bg-[#8b2e2e]/10 focus:ring-[#8b2e2e]";

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 pointer-events-auto"
                    style={{ zIndex }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 ${isMystic ? 'bg-black/60 backdrop-blur-sm' : 'bg-stone-950/80 backdrop-blur-sm'}`}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={typeof title === 'string' ? title : "Modale"}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
                        className={`
                            relative w-full ${sizeClasses[size]} 
                            ${bgClass}
                            rounded-sm border-2
                            flex flex-col max-h-[90vh]
                            ${className}
                        `}
                    >
                        {/* Paper Texture Overlay (Only for Paper theme) */}
                        {!isMystic && (
                            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] rounded-sm mix-blend-multiply z-0" />
                        )}

                        {/* Mystic Glow (Only for Mystic theme) */}
                        {isMystic && (
                            <div className="absolute inset-0 pointer-events-none rounded-sm shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] z-0" />
                        )}

                        {/* Decorative Corners */}
                        <svg className={`absolute top-0 left-0 w-8 h-8 ${cornerColorClass}`} viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                        <svg className={`absolute top-0 right-0 w-8 h-8 ${cornerColorClass} rotate-90`} viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                        <svg className={`absolute bottom-0 right-0 w-8 h-8 ${cornerColorClass} rotate-180`} viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>
                        <svg className={`absolute bottom-0 left-0 w-8 h-8 ${cornerColorClass} -rotate-90`} viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v8h2V2h6V0H0z" /></svg>

                        {/* Header */}
                        <div className={`relative z-10 px-6 py-4 border-b ${headerBorderClass} flex items-center justify-between ${headerBgClass}`}>
                            <div className="flex items-center gap-3">
                                {icon && <span className={`${isMystic ? 'text-amber-500' : 'text-[#8b2e2e]'} drop-shadow-sm`}>{icon}</span>}
                                <h2 className={`text-2xl font-serif font-black tracking-wide uppercase drop-shadow-sm ${isMystic ? 'text-stone-300' : 'text-[#4a3b32]'}`}>
                                    {title}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Fermer la modale"
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center 
                                    transition-colors focus:outline-none focus:ring-2
                                    ${closeBtnClass}
                                `}
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
                            <div className={`relative z-10 px-6 py-4 border-t ${headerBorderClass} ${headerBgClass} flex justify-end gap-3 rounded-b-sm`}>
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
    return createPortal(modalContent, document.body);
};

export default ThematicModal;
