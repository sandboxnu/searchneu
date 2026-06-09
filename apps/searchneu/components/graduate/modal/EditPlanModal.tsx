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
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  useSupportedMajors,
  useSupportedMinors,
} from "@/lib/graduate/useGraduateApi";

type PlanInfo = {
  id?: number;
  name: string;
  majors?: { name: string }[] | null;
  minors?: { name: string }[] | null;
  catalogYear?: number | null;
  concentration?: string | null;
};

interface EditPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanInfo;
  isGuest?: boolean;
  onGuestSave?: (updatedPlan: Record<string, unknown>) => void;
  onPlanUpdated?: () => void;
}

export default function EditPlanModal({
  open,
  onOpenChange,
  plan,
  isGuest = false,
  onGuestSave,
  onPlanUpdated,
}: EditPlanModalProps) {
  const router = useRouter();
  const majorsAnchorRef = useComboboxAnchor();
  const minorsAnchorRef = useComboboxAnchor();

  const [message, setMessage] = useState(plan.name);
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(
    !plan.majors?.length,
  );
  const [catalogYear, setCatalogYear] = useState(plan.catalogYear ?? -1);
  const [majors, setMajors] = useState<string[]>(
    plan.majors?.map((m) => m.name) ?? [],
  );
  const [minors, setMinors] = useState<string[]>(
    plan.minors?.map((m) => m.name) ?? [],
  );
  const [concentration, setConcentration] = useState(plan.concentration ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // majors
  const { data: supportedMajorsData, error: majorsError } =
    useSupportedMajors();
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

  // minors
  const { data: supportedMinorsData, error: minorsError } =
    useSupportedMinors();
  const isLoadingMinors = !supportedMinorsData && !minorsError;
  const [minorOptions, setMinorOptions] = useState<{ minorName: string }[]>([]);

  // concentrations
  const [concentration_options, setConcentrationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingConcentration, setIsLoadingConcentration] = useState(false);

  // re-seed all form state whenever the modal opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line
      setMessage(plan.name);
      setCatalogYear(plan.catalogYear ?? -1);
      setMajors(plan.majors?.map((m) => m.name) ?? []);
      setMinors(plan.minors?.map((m) => m.name) ?? []);
      setConcentration(plan.concentration ?? "");
      setIsNoMajorSelected(!plan.majors?.length);
    }
  }, [open, plan]);

  // majors options driven by catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMajorsData) {
      // eslint-disable-next-line
      setMajorOptions([]);
      return;
    }
    const majorsForYear = supportedMajorsData.supportedMajors[catalogYear];
    setMajorOptions(
      majorsForYear
        ? Object.keys(majorsForYear)
            .sort()
            .map((majorName) => ({ majorName }))
        : [],
    );
  }, [catalogYear, supportedMajorsData]);

  // minor options driven by catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMinorsData) {
      // eslint-disable-next-line
      setMinorOptions([]);
      return;
    }
    const minorsForYear = supportedMinorsData.supportedMinors[catalogYear];
    setMinorOptions(
      minorsForYear
        ? Object.keys(minorsForYear)
            .sort()
            .map((minorName) => ({ minorName }))
        : [],
    );
  }, [catalogYear, supportedMinorsData]);

  // concentration options driven by major
  useEffect(() => {
    // eslint-disable-next-line
    setIsLoadingConcentration(true);
    if (!majors.length || !catalogYear || !supportedMajorsData) {
      setConcentrationOptions([]);
      setConcentration("");
      setIsLoadingConcentration(false);
      return;
    }
    const majorData =
      supportedMajorsData.supportedMajors[catalogYear]?.[majors[0]];
    if (majorData?.concentrations?.length) {
      setConcentrationOptions(
        majorData.concentrations.map((name) => ({ value: name, label: name })),
      );
    } else {
      setConcentrationOptions([]);
      setConcentration("");
    }
    setIsLoadingConcentration(false);
  }, [majors, catalogYear, supportedMajorsData]);

  function handleClose() {
    // reset to plan values on cancel
    setMessage(plan.name);
    setCatalogYear(plan.catalogYear ?? -1);
    setMajors(plan.majors?.map((m) => m.name) ?? []);
    setMinors(plan.minors?.map((m) => m.name) ?? []);
    setConcentration(plan.concentration ?? "");
    setIsNoMajorSelected(!plan.majors?.length);
    onOpenChange(false);
  }

  function handleNoMajor() {
    setIsNoMajorSelected(true);
    setMajors([]);
    setMinors([]);
    setConcentration("");
    // also clear catalog year — no major means none of these fields are meaningful
    setCatalogYear(-1);
  }

  function handleCatalogYearChange(v: string) {
    setCatalogYear(Number(v));
    // cascade: different year = different requirements, wipe dependent fields
    setMajors([]);
    setMinors([]);
    setConcentration("");
    setIsNoMajorSelected(false);
  }

  async function handleEditPlan() {
    setIsSubmitting(true);
    try {
      const majorData =
        supportedMajorsData?.supportedMajors[catalogYear]?.[majors[0]];
      const validConcentrations = majorData?.concentrations ?? [];
      const finalConcentration = validConcentrations.includes(concentration)
        ? concentration
        : "";

      if (isGuest && onGuestSave) {
        const current = JSON.parse(localStorage.getItem("guest-plan") ?? "{}");
        const updatedPlan = {
          ...current,
          name: message || plan.name,
          majors: isNoMajorSelected ? undefined : majors,
          minors: !minors?.length ? undefined : minors,
          catalogYear: isNoMajorSelected ? undefined : catalogYear,
          concentration: isNoMajorSelected
            ? undefined
            : (finalConcentration ?? undefined),
        };
        onGuestSave(updatedPlan);

        const courseKeys = new Set<string>();
        const schedule = current.schedule;
        if (schedule?.years) {
          for (const year of schedule.years) {
            for (const term of [
              year.fall,
              year.spring,
              year.summer1,
              year.summer2,
            ]) {
              for (const c of term.classes)
                courseKeys.add(`${c.subject}-${c.classId}`);
            }
          }
        }

        const queryParams = new URLSearchParams();
        for (const m of updatedPlan.majors ?? [])
          queryParams.append("majors", m);
        for (const m of updatedPlan.minors ?? [])
          queryParams.append("minors", m);
        if (updatedPlan.catalogYear)
          queryParams.set("catalogYear", String(updatedPlan.catalogYear));
        if (courseKeys.size)
          queryParams.set("courses", [...courseKeys].join(","));

        toast(`Plan "${updatedPlan.name}" updated successfully!`);
        onOpenChange(false);
        router.push(`/graduate/guest?${queryParams.toString()}`);
        return;
      }

      const response = await fetch(`/api/audit/plan/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: message || plan.name,
          majors: isNoMajorSelected ? null : majors,
          minors: !minors?.length ? null : minors,
          catalogYear: isNoMajorSelected ? null : catalogYear,
          concentration: isNoMajorSelected ? "" : finalConcentration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          `Failed to update plan: ${errorData.error ?? "Unknown error"}`,
        );
        throw new Error(errorData.error ?? "Failed to update plan");
      }

      const updatedPlan = await response.json();
      toast(`Plan "${updatedPlan.name}" updated successfully!`);
      onPlanUpdated?.();
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-2xl" aria-label="Edit Plan Modal content">
        <DialogHeader>
          <DialogTitle className="flex justify-center">Edit Plan</DialogTitle>
        </DialogHeader>

        <div className="flex h-full w-full flex-col justify-between gap-4">
          {/* title */}
          <div>
            <Label htmlFor="title" className="text-neu6 text-xs font-bold">
              TITLE
            </Label>
            <Input
              placeholder={plan.name}
              value={message}
              id="title"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessage(e.target.value)
              }
            />
          </div>

          {/* catalog year */}
          <div>
            <Label
              htmlFor="year-select"
              className="text-neu6 text-xs font-bold"
            >
              CATALOG YEAR
            </Label>
            <Select
              value={catalogYear === -1 ? "" : catalogYear.toString()}
              onValueChange={handleCatalogYearChange}
            >
              <SelectTrigger
                className="border-neu3 w-full rounded-4xl border bg-transparent"
                id="year-select"
              >
                <SelectValue placeholder="Select catalog year" />
              </SelectTrigger>
              <SelectContent>
                {catalogYearOptions.map((t) => (
                  <SelectItem key={t.label} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* majors */}
          {!isNoMajorSelected && (
            <div>
              <Label
                className="text-neu6 text-xs font-bold"
                htmlFor="majors-select"
              >
                MAJOR(S)
              </Label>
              <Combobox
                items={majorOptions
                  .map((major) => major.majorName)
                  .sort((a, b) => a.length - b.length)}
                multiple
                value={majors}
                onValueChange={(newMajors: string[]) => {
                  setMajors(newMajors);
                  setConcentration(""); // changing major clears concentration
                }}
                disabled={catalogYear === -1}
              >
                <ComboboxChips
                  ref={majorsAnchorRef}
                  className={cn(
                    "border-neu3 w-full rounded-4xl bg-transparent",
                    catalogYear === -1 &&
                      "bg-neu3 cursor-not-allowed opacity-50",
                  )}
                >
                  <ComboboxValue>
                    {(values: string[]) =>
                      values.map((major) => (
                        <ComboboxChip key={major} aria-label={major}>
                          {major}
                        </ComboboxChip>
                      ))
                    }
                  </ComboboxValue>
                  <ComboboxChipsInput
                    id="majors-select"
                    placeholder={
                      isLoadingMajors ? "Loading majors..." : "Select a major"
                    }
                  />
                </ComboboxChips>
                <ComboboxContent anchor={majorsAnchorRef}>
                  <ComboboxEmpty>No results found</ComboboxEmpty>
                  <ComboboxList>
                    {(major: string) => (
                      <ComboboxItem key={major} value={major}>
                        {major}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          )}

          {/* can't find my major */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isNoMajorSelected}
              onChange={
                isNoMajorSelected
                  ? () => setIsNoMajorSelected(false)
                  : handleNoMajor
              }
              className="border-input h-3 w-3 scale-150 rounded accent-red-500"
              id="no-major-check"
            />
            <Label
              className="text-neu6 text-sm font-bold"
              htmlFor="no-major-check"
            >
              {`Can't find my major?`}
            </Label>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <CircleQuestionMark size="18" color="#858585" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{noMajorHelperLabel}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* concentration */}
          {concentration_options.length > 0 && !isNoMajorSelected && (
            <div>
              <Label
                htmlFor="concentration-select"
                className="text-neu6 mb-2 text-xs font-bold"
              >
                CONCENTRATION
              </Label>
              <Select value={concentration} onValueChange={setConcentration}>
                <SelectTrigger
                  className="border-neu3 w-full rounded-4xl border bg-transparent"
                  id="concentration-select"
                >
                  <SelectValue
                    placeholder={
                      isLoadingConcentration
                        ? "Loading..."
                        : "Select a Concentration"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {concentration_options
                    .sort((a, b) => a.label.length - b.label.length)
                    .map((t) => (
                      <SelectItem key={t.label} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* minors */}
          {!isNoMajorSelected && majors.length > 0 && (
            <div>
              <Label
                htmlFor="minor-select"
                className="text-neu6 text-xs font-bold"
              >
                MINOR(S)
              </Label>
              <Combobox
                items={minorOptions
                  .map((minor) => minor.minorName)
                  .sort((a, b) => a.length - b.length)}
                multiple
                value={minors}
                onValueChange={setMinors}
                disabled={catalogYear === -1}
              >
                <ComboboxChips
                  ref={minorsAnchorRef}
                  className={cn(
                    "border-neu3 w-full rounded-4xl bg-transparent",
                    catalogYear === -1 &&
                      "bg-neu3 cursor-not-allowed opacity-50",
                  )}
                >
                  <ComboboxValue>
                    {(values: string[]) =>
                      values.map((minor) => (
                        <ComboboxChip key={minor} aria-label={minor}>
                          {minor.split(",")[0].trim()}
                        </ComboboxChip>
                      ))
                    }
                  </ComboboxValue>
                  <ComboboxChipsInput
                    id="minor-select"
                    placeholder={
                      isLoadingMinors ? "Loading minors..." : "Select a minor"
                    }
                  />
                </ComboboxChips>
                <ComboboxContent anchor={minorsAnchorRef}>
                  <ComboboxEmpty>No results found</ComboboxEmpty>
                  <ComboboxList>
                    {(minor: string) => (
                      <ComboboxItem key={minor} value={minor}>
                        {minor}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          )}

          {/* footer */}
          <div className="flex flex-col justify-center gap-4 border-t border-gray-200 py-4">
            <div className="mt-2 flex justify-center gap-4">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleEditPlan}
                disabled={
                  isSubmitting ||
                  (!isNoMajorSelected && majors.length === 0) ||
                  (!isNoMajorSelected && catalogYear <= 0) ||
                  (!isNoMajorSelected &&
                    concentration_options.length > 0 &&
                    concentration.length === 0)
                }
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
