"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, use } from "react";
import { Label } from "@/components/ui/label";
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
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface Option {
  label: string;
  value: string;
}

// generally these very abstracted functions are bad, but in this case
// the four multiselects are nearly the same so some abstraction saves
// LoC

// SPMultiselect is a multiselect component that stores the state in the
// search params
export function SPMultiselect<T>(props: {
  id?: string;
  opts: Promise<T[]>;
  spCode: string;
  transform: (opts: T[]) => Option[];
  placeholder: string;
  label: string;
}) {
  const resolved = use(props.opts);
  const options = props
    .transform(resolved)
    // put in alphabetical order
    .sort((a, b) => a.label.localeCompare(b.label));

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(opts: Option[]) {
    const params = new URLSearchParams(searchParams);
    if (opts.length === 0) {
      params.delete(props.spCode);

      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.delete(props.spCode);
    opts.forEach((s) => params.append(props.spCode, s.value));
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  const spSelected = searchParams.getAll(props.spCode);
  const selected = options.filter((s) => spSelected.indexOf(s.value) > -1);

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <Label className="text-neu7 text-xs font-semibold">{props.label}</Label>
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
                  "text-neu6 size-5 md:size-4",
                  open && "rotate-45",
                )}
              />
            </PopoverTrigger>
            <PopoverContent
              className="mr-[3.5px] w-[calc(100vw-30px)] p-0 md:w-[246px]"
              align="end"
            >
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
                className=""
              >
                <CommandInput
                  placeholder="Search options..."
                  className="text-lg md:text-sm"
                />
                <CommandList className="bg-neu1 max-h-[180px] md:max-h-[300px]">
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        keywords={[opt.label]}
                        onSelect={(currentValue) => {
                          updateSearchParams(
                            selected.some((f) => f.value === currentValue)
                              ? selected.filter((f) => f.value !== currentValue)
                              : [...selected, opt],
                          );
                        }}
                        className={cn(
                          "-mx-1 flex items-center gap-2 rounded-none py-3 pr-3 pl-4 text-sm",
                          selected.some((f) => f.value === opt.value) &&
                            "font-semibold",
                        )}
                      >
                        {opt.value !== opt.label && (
                          <div
                            className={cn("text-neu6 font-bold", {
                              "text-neu8": selected.some(
                                (f) => f.value === opt.value,
                              ),
                            })}
                          >
                            {opt.value}
                          </div>
                        )}
                        <div
                          className={cn("text-neu6", {
                            "text-neu7 font-semibold": selected.some(
                              (f) => f.value === opt.value,
                            ),
                          })}
                        >
                          {opt.label}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
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
              {s.value !== s.label && (
                <span className="text-neu8 font-[700]">{s.value}</span>
              )}
              <span
                className={cn(s.value === s.label ? "text-neu8" : "text-neu7")}
              >
                {s.label}
              </span>
            </span>
            <button
              onClick={() =>
                updateSearchParams(selected.filter((f) => f.value !== s.value))
              }
              aria-label={`Remove ${s.label}`}
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
