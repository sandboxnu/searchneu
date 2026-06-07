import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/**
 * The single source of truth for how a filter is laid out in the search panel:
 * a bold label on the left, an optional action (e.g. "Clear all" or a toggle)
 * on the right, and the control beneath it. Every filter renders through this
 * so labels and spacing stay consistent.
 */
export function FilterSection(props: {
  label: string;
  /** Associates the label with a control for accessibility. */
  htmlFor?: string;
  /** Rendered at the right edge of the label row (toggle, clear button, …). */
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={props.htmlFor} className="text-neu7 text-xs font-bold">
          {props.label}
        </Label>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

/** Loading placeholder for a filter control while its data resolves. */
export function FilterSkeleton() {
  return <div className="bg-neu3 h-10 w-full animate-pulse rounded-full" />;
}
