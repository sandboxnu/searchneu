"use client";

import { useState } from "react";
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

interface FilterMultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  placeholder?: string;
}

export function FilterMultiSelect({
  label,
  options,
  selected,
  onSelectedChange,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));

  const clearAll = () => {
    onSelectedChange([]);
  };

  const toggleOption = (optionValue: string) => {
    const option = options.find((opt) => opt.value === optionValue);
    if (!option) return;

    if (selected.includes(optionValue)) {
      onSelectedChange(selected.filter((v) => v !== optionValue));
    } else {
      onSelectedChange([...selected, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onSelectedChange(selected.filter((v) => v !== optionValue));
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted-foreground cursor-pointer text-xs font-bold"
        >
          {label}
        </button>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="cursor-pointer text-xs text-[#2180E8] hover:text-[#2180E8]/80"
            >
              Clear all
            </button>
          )}

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <PlusIcon
                  className={cn(
                    "size-5 transition-transform",
                    open && "rotate-45",
                  )}
                />
              </button>
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
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="text-xs"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        keywords={[opt.label]}
                        onSelect={toggleOption}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 px-4 py-3",
                          selected.includes(opt.value) && "font-semibold",
                        )}
                      >
                        {opt.value !== opt.label && (
                          <div
                            className={cn("text-muted-foreground font-bold", {
                              "text-foreground": selected.includes(opt.value),
                            })}
                          >
                            {opt.value}
                          </div>
                        )}
                        <div
                          className={cn("text-muted-foreground", {
                            "text-foreground font-semibold": selected.includes(
                              opt.value,
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
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.slice(0, 3).map((opt) => (
            <span
              key={opt.value}
              className="bg-secondary inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs"
            >
              <span className="flex items-center gap-2">
                {opt.value !== opt.label && (
                  <span className="text-foreground font-bold">{opt.value}</span>
                )}
                <span
                  className={cn(
                    opt.value === opt.label
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {opt.label}
                </span>
              </span>
              <button
                onClick={() => removeOption(opt.value)}
                aria-label={`Remove ${opt.label}`}
                className="cursor-pointer text-muted-foreground hover:text-foreground ml-2 rounded-full py-0.5 text-lg leading-none"
              >
                ×
              </button>
            </span>
          ))}
          {selectedOptions.length > 3 && (
            <span className="rounded-full border px-3 py-1 text-xs">
              +{selectedOptions.length - 3}
            </span>
          )}
        </div>
      )}
    </>
  );
}
