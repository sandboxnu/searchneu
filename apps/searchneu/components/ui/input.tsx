import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "border-neu2 file:text-neu0 placeholder:text-neu7 focus-visible:border-neu2 focus-visible:ring-neu2/50 disabled:bg-neu2/50 aria-invalid:border-r1 aria-invalid:ring-r1/20 bg-neu0 h-8 w-full min-w-0 rounded-full border px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
