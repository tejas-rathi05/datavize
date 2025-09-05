import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import React from "react";
const typeVariants = cva("text", {
  variants: {
    size: {
      xxs: "text-xs",
      xs: "text-xs",
      sm: "text-xs md:text-sm",
      base: "text-sm md:text-base",
      lg: "text-base md:text-lg",
      xl: "text-lg md:text-xl",
    },
    textColor: {
      primary: "text-zinc-800 dark:text-zinc-50",
      secondary: "text-zinc-600 dark:text-zinc-300",
      tertiary: "text-zinc-500",
      white: "text-white",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "sm",
    textColor: "primary",
    weight: "regular",
  },
});
export interface TypeProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof typeVariants> {
  asChild?: boolean;
}
export const Type = React.forwardRef<HTMLParagraphElement, TypeProps>(
  ({ className, size, textColor, weight, asChild = false, ...props }, ref) => {
    return (
      <p
        className={cn(typeVariants({ size, textColor, className, weight }))}
        ref={ref}
      >
        {props.children}
      </p>
    );
  }
);

Type.displayName = "Type";
