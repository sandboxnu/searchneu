import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-neu4 focus-visible:ring-neu4/50 focus-visible:ring-[3px] aria-invalid:ring-red/20 aria-invalid:border-red transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neu text-neu9 [a&]:hover:bg-neu/90",
        secondary: "border-transparent bg-neu3 text-neu9 [a&]:hover:bg-neu3/90",
        destructive:
          "border-transparent bg-red text-neu1 [a&]:hover:bg-red/90 focus-visible:ring-red/20",
        outline: "text-neu9 [a&]:hover:bg-navy [a&]:hover:text-neu1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
