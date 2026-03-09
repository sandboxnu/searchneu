"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import { toast } from "sonner";
import { useSupportedMajors, useSupportedMinors } from "@/lib/graduate/useGraduateApi";

type PlanInfo = {
  id: number;
  name: string;
  majors?: string[] | null;
  minors?: string[] | null;
  catalogYear?: number | null;
  concentration?: string | null;
};

interface EditPlanModalProps {
  plan: PlanInfo;
  onPlanUpdated?: () => void;
}

export default function EditPlanModal({
  plan,
  onPlanUpdated,
}: EditPlanModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(plan.name);
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(
    !plan.majors?.length,
  );
  const [catalogYear, setCatalogYear] = useState(plan.catalogYear ?? -1);
  const [majors, setMajors] = useState<string[]>(plan.majors ?? []);
  const [minors, setMinors] = useState<string[]>(plan.minors ?? []);
  const [concentration, setConcentration] = useState(plan.concentration ?? "");

  //majors
  const { data: supportedMajorsData, error: majorsError } = useSupportedMajors();
  const isLoadingMajors = !supportedMajorsData && !majorsError;
  const [majorOptions, setMajorOptions] = useState<{ majorName: string }[]>([]);
  const noMajorHelperLabel = `If your major isn't currently supported, please choose "Can't find my major" to still use the planner!`;

  const catalogYearOptions = useMemo(() => {
    if (!supportedMajorsData) return [];
    return Object.keys(supportedMajorsData.supportedMajors)
      .map(Number)
      .sort()
      .map((year) => ({ label: String(year), value: year }));
  }, [supportedMajorsData]);

  //minors
  const { data: supportedMinorsData, error: minorsError } = useSupportedMinors();
  const isLoadingMinors = !supportedMinorsData && !minorsError;
  const [minorOptions, setMinorOptions] = useState<{ minorName: string }[]>([]);

  //concentrations
  const [concentration_options, setConcentrationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingConcentration, setIsLoadingConcentration] = useState(false);

  //form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  //get info of plan when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage(plan.name);
      setCatalogYear(plan.catalogYear ?? -1);
      setMajors(plan.majors ?? []);
      setMinors(plan.minors ?? []);
      setConcentration(plan.concentration ?? "");
      setIsNoMajorSelected(!plan.majors?.length);
    }
  }, [plan, isOpen]);

  //change supported majors based on catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMajorsData) {
      setMajorOptions([]);
      return;
    }
    const majorsForYear = supportedMajorsData.supportedMajors[catalogYear];
    if (majorsForYear) {
      const options = Object.keys(majorsForYear)
        .sort()
        .map((majorName) => ({ majorName }));
      setMajorOptions(options);
    } else {
      setMajorOptions([]);
    }
  }, [catalogYear, supportedMajorsData]);

  //change supported minors based on catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMinorsData) {
      setMinorOptions([]);
      return;
    }
    const minorsForYear = supportedMinorsData.supportedMinors[catalogYear];
    if (minorsForYear) {
      const options = Object.keys(minorsForYear)
        .sort()
        .map((minorName) => ({ minorName }));
      setMinorOptions(options);
    } else {
      setMinorOptions([]);
    }
  }, [catalogYear, supportedMinorsData]);

  //change concentrations based on major
  useEffect(() => {
    setIsLoadingConcentration(true);
    if (!majors.length || !catalogYear || !supportedMajorsData) {
      setConcentrationOptions([]);
      setConcentration(""); // clear concentration when majors are cleared
      return;
    }
    const majorData = supportedMajorsData.supportedMajors[catalogYear]?.[majors[0]];
    if (majorData?.concentrations && majorData.concentrations.length > 0) {
      const options = majorData.concentrations.map((name) => ({
        value: name,
        label: name,
      }));
      setConcentrationOptions(options);
    } else {
      setConcentrationOptions([]);
      setConcentration("");
    }
    setIsLoadingConcentration(false);
  }, [majors, catalogYear, supportedMajorsData]);

  const handleClose = () => {
    setMessage(plan.name);
    setCatalogYear(plan.catalogYear ?? -1);
    setMajors(plan.majors ?? []);
    setMinors(plan.minors ?? []);
    setConcentration(plan.concentration ?? "");
    setIsNoMajorSelected(!plan.majors?.length);
    setIsOpen(false);
  };

  const handleNoMajor = () => {
    setIsNoMajorSelected(true);
    setMajors([]);
    setMinors([]);
    setConcentration("");
  };

  // editing the plan
  const handleEditPlan = async () => {
    setIsSubmitting(true);
    try {
      // only send concentration if it's valid for the current major
      const majorData = supportedMajorsData?.supportedMajors[catalogYear]?.[majors[0]];
      const validConcentrations = majorData?.concentrations ?? [];
      const finalConcentration = validConcentrations.includes(concentration) 
        ? concentration 
        : undefined;
  
        console.log("DEBUG:", {
            majors,
            catalogYear,
            concentration,
            validConcentrations,
            finalConcentration,
          });
      const response = await fetch(`/api/audit/plan/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: message || plan.name,
          majors: isNoMajorSelected ? null : majors,
          minors: !minors?.length ? null : minors,
          catalogYear: isNoMajorSelected ? null : catalogYear,
          concentration: isNoMajorSelected ? undefined : finalConcentration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast(`Failed to update plan: ${errorData.error || "Unknown error"}`);
        throw new Error(errorData.error || "Failed to update plan");
      }

      const updatedPlan = await response.json();
      toast(`Plan ${updatedPlan.name} updated successfully!`);
      onPlanUpdated?.();
      handleClose();
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Edit Plan
      </Button>

      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl" aria-label="Edit Plan Modal content">
            <DialogHeader>
              <DialogTitle className="flex justify-center">Edit Plan</DialogTitle>
            </DialogHeader>

            <div className="flex h-full w-full flex-col justify-between gap-4">
              {/* title */}
              <div>
                <Label htmlFor="title" className="text-neu6 text-xs font-bold">TITLE</Label>
                <Input
                  placeholder={plan.name}
                  value={message}
                  id="title"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                />
              </div>

              {/* catalog year */}
              <div>
                <Label htmlFor="year-select" className="text-neu6 text-xs font-bold">CATALOG YEAR</Label>
                <Select
                  value={catalogYear === -1 ? "" : catalogYear.toString()}
                  onValueChange={(v) => {
                    setCatalogYear(Number(v));
                    setMajors([]);
                    setMinors([]);
                    setConcentration("");
                    setIsNoMajorSelected(false);
                  }}
                >
                  <SelectTrigger className="border-neu3 w-full rounded-4xl border bg-transparent" id="year-select">
                    <SelectValue placeholder="Select catalog year" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogYearOptions.map((t) => (
                      <SelectItem key={t.label} value={String(t.value)}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* majors */}
              {!isNoMajorSelected && (
                <div>
                  <Label className="text-neu6 text-xs font-bold" htmlFor="majors-select">MAJOR(S)</Label>
                  <MultiSelect values={majors} 
                  onValuesChange={(newMajors) => {
                    setMajors(newMajors);
                    setConcentration("");
                  }} 
                  disabled={catalogYear == -1}>
                    <MultiSelectTrigger
                      className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed"
                      id="majors-select"
                    >
                      <MultiSelectValue
                        placeholder={isLoadingMajors ? "Loading majors..." : "Select a major"}
                        displayTagsUnderneath={true}
                      />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {majorOptions
                        .sort((a, b) => a.majorName.length - b.majorName.length)
                        .map((major) => (
                          <MultiSelectItem key={major.majorName} value={major.majorName}>
                            {major.majorName}
                          </MultiSelectItem>
                        ))}
                    </MultiSelectContent>
                  </MultiSelect>
                  {majors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {majors.map((major) => (
                        <div key={major} className="bg-neu2 text-neu6 flex items-center gap-1 rounded-full px-3 py-1 text-sm">
                          <span>{major}</span>
                          <button onClick={() => setMajors(majors.filter((m) => m !== major))} className="ml-1 cursor-pointer hover:opacity-70">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* no major checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isNoMajorSelected}
                  onChange={isNoMajorSelected ? () => setIsNoMajorSelected(false) : handleNoMajor}
                  className="border-input h-3 w-3 scale-150 rounded accent-red-500"
                  id="no-major-check"
                />
                <Label className="text-neu6 text-sm font-bold" htmlFor="no-major-check">{`Can't find my major?`}</Label>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <CircleQuestionMark size="18" color="#858585" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{noMajorHelperLabel}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* concentration */}
              {concentration_options.length > 0 && !isNoMajorSelected && (
                <div>
                  <Label htmlFor="concentration-select" className="text-neu6 mb-2 text-xs font-bold">CONCENTRATION</Label>
                  <Select value={concentration} onValueChange={setConcentration}>
                    <SelectTrigger className="border-neu3 w-full rounded-4xl border bg-transparent" id="concentration-select">
                      <SelectValue placeholder={isLoadingConcentration ? "Loading..." : "Select a Concentration"} />
                    </SelectTrigger>
                    <SelectContent>
                      {concentration_options
                        .sort((a, b) => a.label.length - b.label.length)
                        .map((t) => (
                          <SelectItem key={t.label} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* minors */}
              {!isNoMajorSelected && majors.length > 0 && (
                <div>
                  <Label htmlFor="minor-select" className="text-neu6 text-xs font-bold">MINOR(S)</Label>
                  <MultiSelect values={minors} onValuesChange={setMinors} disabled={catalogYear == -1}>
                    <MultiSelectTrigger
                      className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed"
                      id="minor-select"
                    >
                      <MultiSelectValue
                        placeholder={isLoadingMinors ? "Loading minors..." : "Select a minor"}
                        displayTagsUnderneath={true}
                      />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {minorOptions
                        .sort((a, b) => a.minorName.length - b.minorName.length)
                        .map((minor) => (
                          <MultiSelectItem key={minor.minorName} value={minor.minorName}>
                            {minor.minorName}
                          </MultiSelectItem>
                        ))}
                    </MultiSelectContent>
                  </MultiSelect>
                  {minors.length > 0 && !isNoMajorSelected && majors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {minors.map((minor) => (
                        <div key={minor} className="bg-neu2 text-neu6 flex items-center gap-1 rounded-full px-3 py-1 text-sm">
                          <span>{minor.split(",")[0].trim()}</span>
                          <button onClick={() => setMinors(minors.filter((m) => m !== minor))} className="ml-1 cursor-pointer hover:opacity-70">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* footer */}
              <div className="flex flex-col justify-center gap-4 border-t border-gray-200 py-4">
                <div className="mt-2 flex justify-center gap-4">
                  <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleEditPlan}
                    disabled={
                      isSubmitting ||
                      (!isNoMajorSelected && majors.length == 0) ||
                      (!isNoMajorSelected && catalogYear <= 0) ||
                      (concentration_options.length > 0 && concentration.length == 0)
                    }
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}