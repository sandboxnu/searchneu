"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import { Option } from "@/components/ui/multi-select";
import { Label } from "../ui/label";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SPMultiselectGroups<T>(props: {
  id?: string;
  opts: Promise<{ name: string; group: string }[]>;
  spCode: string;
  placeholder: string;
  label: string;
}) {
  const resolved = use(props.opts);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(opts: { name: string; group: string }[]) {
    const params = new URLSearchParams(searchParams);
    if (opts.length === 0) {
      params.delete(props.spCode);

      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.delete(props.spCode);
    opts.forEach((s) => params.append(props.spCode, s.name));
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  const spSelected = searchParams.getAll(props.spCode);
  const selected = resolved.filter((s) => spSelected.indexOf(s.name) > -1);

  const [open, setOpen] = useState(false);

  const groups = Array.from(new Set(resolved.map((o) => o.group)));

  return (
    <>
      <div className="flex items-center justify-between">
        <Label className="text-neu7 text-xs font-[700]">{props.label}</Label>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <p
              className="text-blue hover:text-blue/80 cursor-pointer text-xs"
              onClick={() => updateSearchParams([])}
            >
              Clear all
            </p>
          )}

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <PlusIcon
                className={cn(
                  "text-muted-foreground size-4",
                  open && "rotate-45",
                )}
              />
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <Command
                filter={(value, search, keywords) => {
                  const v = value.toLowerCase();
                  const s = search.toLowerCase();
                  const label = keywords?.join(" ").toLowerCase();
                  if (v === s) return 1;
                  if (v.includes(s)) return 0.8;
                  if (label?.includes(s)) return 0.7;
                  return 0;
                }}
              >
                <CommandInput placeholder="Search options..." />
                <CommandList>
                  <CommandEmpty>No results found</CommandEmpty>
                  {groups.map((group) => (
                    <CommandGroup heading={group.toUpperCase()} key={group}>
                      {resolved
                        .filter((opt) => opt.group === group)
                        .map((opt) => (
                          <CommandItem
                            key={opt.name}
                            value={opt.name}
                            keywords={[opt.name]}
                            onSelect={(currentValue) => {
                              updateSearchParams(
                                selected.some((f) => f.name === currentValue)
                                  ? selected.filter(
                                      (f) => f.name !== currentValue,
                                    )
                                  : [...selected, opt],
                              );
                            }}
                            className={cn(
                              selected.some((f) => f.name === opt.name) &&
                                "font-[700]",
                            )}
                          >
                            <div className="flex items-center gap-2 pl-4">
                              <div
                                className={cn(
                                  selected.some((f) => f.name === opt.name)
                                    ? "text-neu7"
                                    : "text-neu6",
                                )}
                              >
                                {opt.name}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="block space-y-2 space-x-2 pt-3">
        {selected.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="bg-secondary inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-sm"
          >
            <span className="flex items-center gap-2">
              {s.name !== s.name && (
                <span className="text-neu8 font-[700]">{s.name}</span>
              )}
              <span
                className={cn(s.name === s.name ? "text-neu8" : "text-neu7")}
              >
                {s.name}
              </span>
            </span>
            <button
              onClick={() =>
                updateSearchParams(selected.filter((f) => f.name !== s.name))
              }
              aria-label={`Remove ${s.name}`}
              className="text-neu6 hover:text-neu7 ml-2 rounded-full py-0.5 text-lg leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length > 3 && (
          <span className="rounded-full border px-3 py-1">
            +{selected.length - 3}
          </span>
        )}
      </div>
    </>
  );
}
