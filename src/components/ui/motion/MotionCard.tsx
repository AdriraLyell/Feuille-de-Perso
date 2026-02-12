import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../../utils/cn";
import React from "react";

interface MotionCardProps extends HTMLMotionProps<"div"> {
    className?: string;
    children: React.ReactNode;
    hoverEffect?: "lift" | "glow" | "scale" | "none";
}

export const MotionCard: React.FC<MotionCardProps> = ({
    className,
    children,
    hoverEffect = "lift",
    ...props
}) => {
    const getHoverStyles = () => {
        switch (hoverEffect) {
            case "lift": return { y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" };
            case "glow": return { boxShadow: "0 0 15px 2px rgba(245, 158, 11, 0.4)", borderColor: "rgba(245, 158, 11, 0.6)" };
            case "scale": return { scale: 1.02 };
            default: return {};
        }
    };

    return (
        <motion.div
            className={cn("bg-stone-900/40 border border-stone-700/50 rounded-sm shadow-sm backdrop-blur-sm", className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={getHoverStyles()}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};
