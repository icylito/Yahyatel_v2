import React from "react";
import { cn } from "../lib/utils";

interface NewBrandLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

const NewBrandLogo: React.FC<NewBrandLogoProps> = ({ className, size = "md" }) => {
    const iconSize = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    const textSize = {
        sm: "text-base",
        md: "text-lg",
        lg: "text-2xl",
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn(
                "rounded-full bg-[#0b2744] flex items-center justify-center text-white shrink-0 shadow-lg",
                iconSize[size]
            )}>
                <svg viewBox="0 0 24 24" fill="none" className="w-2/3 h-2/3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M8 8l4 4 4-4" />
                </svg>
            </div>
            <div className="flex flex-col leading-none">
                <span className={cn("font-black text-[#0b2744] tracking-tight notranslate", textSize[size])} translate="no">YahyaTel</span>
            </div>
        </div>
    );
};

export default NewBrandLogo;
