import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button Variants
 * Defines the visual styles for different button states and sizes
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-neutral-400 focus-visible:ring-neutral-400/50 focus-visible:ring-[3px] aria-invalid:ring-status-error/20 aria-invalid:border-status-error",
  {
    variants: {
      variant: {
        default: "bg-brand-neu text-neutral-100 hover:bg-brand-neu/90",
        destructive:
          "bg-status-error text-neutral-100 hover:bg-status-error/90 focus-visible:ring-status-error/20",
        outline:
          "border bg-background hover:bg-primary hover:text-foreground",
        secondary:
          "bg-primary text-foreground hover:bg-primary/80",
        ghost: "hover:bg-primary hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Button Props
 * Combines standard button props with variant options
 */
interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button Component
 * A flexible button component with multiple variants and sizes
 * 
 * @example
 * ```tsx
 * <Button variant="default" size="lg">Click me</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button asChild><Link href="/">Home</Link></Button>
 * ```
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Slot : "button";

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
