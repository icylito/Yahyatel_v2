import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
            secondary: "bg-brand-100 text-brand-700 hover:bg-brand-200",
            outline: "border border-brand-200 text-brand-700 bg-transparent hover:bg-brand-50",
            ghost: "text-brand-700 hover:bg-brand-50",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-6 py-2.5",
            lg: "px-8 py-3.5 text-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
