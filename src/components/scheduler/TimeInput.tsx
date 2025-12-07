"use client";

import { useState } from "react";
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

function generateTimeOptions(
  startHour: number,
  endHour: number,
  intervalMinutes: number
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
      // Skip times after the end hour
      if (hour === endHour && minutes > 0) break;
      
      const timeValue = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${minutes.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
      
      options.push({ value: timeValue, label });
    }
  }
  
  return options;
}

export function TimeInput({ 
  value, 
  onChange,
  startHour = 6,
  endHour = 24,
  intervalMinutes = 15,
}: TimeInputProps) {
  const [open, setOpen] = useState(false);
  
  const timeOptions = generateTimeOptions(startHour, endHour, intervalMinutes);
  
  const selectedOption = timeOptions.find((option) => option.value === value);
  const displayValue = selectedOption?.label || "-- : -- --";

  return (      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 bg-transparent font-medium text-muted-foreground hover:text-foreground/80 focus:outline-none">
            <span className="inline-block w-full text-left text-sm">{displayValue}</span>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[130px] p-0" align="end">
          <Command>
            <CommandInput placeholder="-- : --" />
            <CommandList>
              <CommandEmpty>No time found.</CommandEmpty>
              <CommandGroup>
                {timeOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`${
                        option.value === value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  );
}
