import React from 'react';
import { Loader2 } from 'lucide-react';

interface ThematicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const ThematicButton: React.FC<ThematicButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    // Base styles
    const baseStyles = "relative inline-flex items-center justify-center font-serif transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#fdfbf7]";

    // Size styles
    const sizeStyles = {
        sm: "px-3 py-1 text-sm gap-1.5 rounded-sm",
        md: "px-5 py-2 text-base gap-2 rounded",
        lg: "px-6 py-3 text-lg gap-3 rounded-md",
        xl: "px-8 py-4 text-xl gap-4 rounded-lg font-bold tracking-wider"
    };

    // Variant styles
    const variantStyles = {
        primary: "bg-[#8b2e2e] text-[#fdfbf7] hover:bg-[#a63a3a] shadow-lg border-2 border-[#5c1e1e] ring-[#8b2e2e]",
        secondary: "bg-[#e8dcb5] text-[#4a3b32] hover:bg-[#d4c59a] border-2 border-[#bfae85] shadow-sm",
        danger: "bg-[#5c1e1e] text-red-50 hover:bg-[#7a2e2e] border-2 border-[#3d1212] shadow-md",
        ghost: "bg-transparent text-[#5c4d41] hover:bg-[#5c4d41]/10 hover:text-[#2c241b]",
        outline: "bg-transparent border-2 border-[#5c4d41] text-[#5c4d41] hover:bg-[#5c4d41] hover:text-[#fdfbf7]"
    };

    // Specific effects per variant
    const getVariantEffects = () => {
        if (variant === 'primary' || variant === 'danger') {
            return (
                <>
                    {/* Inner bevel/glow */}
                    <div className="absolute inset-0 rounded-[inherit] border border-white/20 pointer-events-none"></div>
                    <div className="absolute inset-0 rounded-[inherit] border-b-2 border-black/20 pointer-events-none"></div>
                    {/* Shine effect on hover */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine pointer-events-none" />
                </>
            );
        }
        return null;
    };

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Background Texture Overlay (Optional, for parchment feel on secondary) */}
            {variant === 'secondary' && (
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none rounded-[inherit]"></div>
            )}

            {/* Content */}
            {isLoading && <Loader2 className="animate-spin mr-2" size={size === 'sm' ? 14 : 18} />}
            {!isLoading && leftIcon && <span className="relative z-10 transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>}

            <span className="relative z-10 font-bold tracking-wide drop-shadow-sm">
                {children}
            </span>

            {!isLoading && rightIcon && <span className="relative z-10 transition-transform group-hover:translate-x-0.5">{rightIcon}</span>}

            {getVariantEffects()}
        </button>
    );
};

export default ThematicButton;
