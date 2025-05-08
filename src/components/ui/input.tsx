import * as React from "react";

import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-neu9 placeholder:text-neu6 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-lg bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // "focus-visible:border-ring focus-visible:ring-neu4/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-red/20 dark:aria-invalid:ring-red/40 aria-invalid:border-red",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
