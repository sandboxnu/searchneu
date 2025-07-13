"use client";

import { X } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";

import { Badge } from "./badge";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "./command";
import { cn } from "@/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { ChevronDown, CheckIcon } from "lucide-react";

export function NMultiselect({
  options,
  placeholder,
  value,
  onChange,
  className,
  id,
}: {
  options: Option[];
  placeholder?: string;
  value: Option[];
  onChange: (arg1: Option[]) => void;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Option[]>(value);

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          id={id ?? ""}
          className={cn(
            "bg-neu2 hover:bg-neu2 w-full justify-between rounded-lg",
            className,
          )}
        >
          <span className="flex w-full items-center gap-2 overflow-hidden">
            {selected.length > 0 && (
              <Badge onClick={() => setSelected([])}>
                <X className="size-2" />
                {selected.length} selected
              </Badge>
            )}
            <p className="text-neu6 min-w-0 overflow-hidden overflow-ellipsis">
              {placeholder}
            </p>
          </span>
          <ChevronDown className="text-neu6/50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command
          filter={(value, search, keywords) => {
            const label = keywords?.join(" ");
            if (value === search) return 1;
            if (value.includes(search)) return 0.8;
            if (label?.includes(search)) return 0.7;
            return 0;
          }}
        >
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  keywords={[opt.label]}
                  onSelect={(currentValue) => {
                    setSelected(
                      selected.some((f) => f.value === currentValue)
                        ? selected.filter((f) => f.value !== currentValue)
                        : [...selected, opt],
                    );
                  }}
                >
                  <div
                    className="data-[selected=true]:bg-neu9 data-[selected=true]:text-neu1 data-[selected=true]:border-neu9 pointer-events-none size-4 shrink-0 rounded-[4px] border transition-all select-none *:[svg]:opacity-0 data-[selected=true]:*:[svg]:opacity-100"
                    data-selected={selected.some((f) => f.value === opt.value)}
                  >
                    <CheckIcon className="size-3.5 text-current" />
                  </div>
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  /** fixed option that can't be removed. */
  fixed?: boolean;
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
}
