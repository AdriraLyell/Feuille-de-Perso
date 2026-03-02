import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { cn } from "../../../utils/cn";

interface MotionFadeProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    show?: boolean;
    mode?: "wait" | "sync" | "popLayout";
    tag?: string;
    usePresence?: boolean;
}

export const MotionFade: React.FC<MotionFadeProps> = ({
    children,
    className,
    delay = 0,
    duration = 0.3,
    show = true,
    mode = "sync",
    tag = "div",
    usePresence = true
}) => {
    // We use ElementType here to avoid "union type too complex" and "infinite instantiation" errors 
    // when dynamically accessing motion components.
    const DynamicMotion = ((motion as unknown as Record<string, React.ElementType>)[tag] || motion.div) as React.ElementType;

    const content = (
        <DynamicMotion
            className={cn(className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, delay }}
        >
            {children}
        </DynamicMotion>
    );

    if (!usePresence) return content;

    return (
        <AnimatePresence mode={mode}>
            {show && content}
        </AnimatePresence>
    );
};
