"use client";

import { useEffect, useMemo, useState } from "react";
import { Audit } from "@/lib/graduate/types";
import {
  useHasTemplate,
  useSupportedMajors,
  useSupportedMinors,
  useTemplate,
} from "@/lib/graduate/useGraduateApi";
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
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";
import {
  createEmptySchedule,
  createScheduleFromTemplate,
  generateDefaultPlanTitle,
} from "@/lib/graduate/auditPlanUtils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/graduate/useLocalStorage";
import { CreateAuditPlanInput } from "@/lib/graduate/api-dtos";

interface NewPlanModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isGuest: boolean;
}

export default function NewPlanModal({
  open: controlledOpen,
  onOpenChange,
  isGuest,
}: NewPlanModalProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? (v: boolean) => onOpenChange?.(v)
    : setUncontrolledOpen;
  const [message, setMessage] = useState("");
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [isNoMinorSelected, setIsNoMinorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState(-1);
  //const { data: session } = authClient.useSession();

  //majors
  const { data: supportedMajorsData, error: majorsError } =
    useSupportedMajors();

  const catalogYearOptions = useMemo(() => {
    if (!supportedMajorsData) return [];
    return Object.keys(supportedMajorsData.supportedMajors)
      .map(Number)
      .sort()
      .map((year) => ({ label: String(year), value: year }));
  }, [supportedMajorsData]);
  const isLoadingMajors = !supportedMajorsData && !majorsError;
  const [majorOptions, setMajorOptions] = useState<{ majorName: string }[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const noMajorHelperLabel = `If your major isn't currently supported, please choose "Can't find my major" to still use the planner!`;

  //minors
  const { data: supportedMinorsData, error: minorsError } =
    useSupportedMinors();
  const isLoadingMinors = !supportedMinorsData && !minorsError;
  const [minorOptions, setMinorOptions] = useState<{ minorName: string }[]>([]);
  const [minors, setMinors] = useState<string[]>([]);

  //concentrations
  const [concentration, setConcentration] = useState("");
  const [concentrationOptions, setConcentrationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingConcentration, setIsLoadingConcentration] = useState(false);

  // guest plan
  const [, setGuestPlan] = useLocalStorage<CreateAuditPlanInput | null>(
    "guest-plan",
    null,
  );

  //templates
  const recommendedTemplateLabel = `This will pre-populate your plan with the recommended course sequence`;
  const [useRecommendedTemplate, setUseRecommendedTemplate] = useState(false);
  const [selectedTemplateOption, setSelectedTemplateOption] = useState("");

  //form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  //template
  const { hasTemplate, isLoading: isTemplateLoading } = useHasTemplate(
    majors,
    catalogYear,
  );
  const { template } = useTemplate(
    useRecommendedTemplate ? majors : null,
    useRecommendedTemplate ? catalogYear : null,
  );

  const templateOptionNames = useMemo(() => {
    if (!template?.templateData) return [];
    return Object.keys(template.templateData).filter(
      (value) => value != "metadata",
    );
  }, [template]);

  // Auto-select if there's only one template option
  useEffect(() => {
    if (templateOptionNames.length === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateOption(templateOptionNames[0]);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateOption("");
    }
  }, [templateOptionNames]);

  //helper function - close modal
  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setIsNoMajorSelected(false);
    setIsNoMinorSelected(false);
    setCatalogYear(-1);
    setMajors([]);
    setMinors([]);
    setConcentration("");
    setUseRecommendedTemplate(false);
    setSelectedTemplateOption("");
  };

  const handleNoMajor = () => {
    setMessage("");
    setIsNoMajorSelected(true);
    setIsNoMinorSelected(true);
    setMajors([]);
    setMinors([]);
    setConcentration("");
    setUseRecommendedTemplate(false);
    setSelectedTemplateOption("");
  };

  //change supported majors based on catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMajorsData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMajorOptions([]);
      setMajors([]);
      return;
    }
    const majorsForYear = supportedMajorsData.supportedMajors[catalogYear];

    if (majorsForYear) {
      const options = Object.keys(majorsForYear)
        .sort()
        .map((majorName) => ({
          majorName: majorName,
        }));

      setMajorOptions(options);
    } else {
      setMajorOptions([]);
    }

    setMajors([]);
  }, [catalogYear, supportedMajorsData]);

  //change supported minors based on catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMinorsData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMinorOptions([]);
      setMinors([]);
      return;
    }

    const minorsForYear = supportedMinorsData.supportedMinors[catalogYear];

    if (minorsForYear) {
      const options = Object.keys(minorsForYear)
        .sort()
        .map((minorName) => ({
          minorName: minorName,
        }));

      setMinorOptions(options);
    } else {
      setMinorOptions([]);
    }

    setMinors([]);
  }, [catalogYear, supportedMinorsData]);

  //change concentrations based on major
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingConcentration(true);
    if (!majors || !catalogYear || !supportedMajorsData) {
      setConcentrationOptions([]);
      setConcentration("");
      return;
    }

    // NOTE: for now, concentrations are chosen from the first major that is selected */
    const majorData =
      supportedMajorsData.supportedMajors[catalogYear]?.[majors[0]];

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

  //reset template when major or catalog year changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUseRecommendedTemplate(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTemplateOption("");
  }, [majors, catalogYear]);

  //create plan
  const handleCreatePlan = async () => {
    //validation
    if (!isNoMajorSelected) {
      if (!catalogYear) {
        console.error("Catalog year is required");
        return;
      }
      if (!majors || majors.length === 0 || majors.every((m) => !m)) {
        console.error("At least one major is required");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let schedule: Audit;
      // NOTE: for now, template plans are based on the first selected major */
      if (
        useRecommendedTemplate &&
        template?.templateData &&
        selectedTemplateOption &&
        majors[0]
      ) {
        try {
          schedule = createScheduleFromTemplate(
            template.templateData[selectedTemplateOption],
          );
        } catch (error) {
          console.error("error creating schedule from template:", error);
          toast(
            "Failed to create schedule with template, creating empty plan.",
          );
          schedule = createEmptySchedule();
        }
      } else {
        schedule = createEmptySchedule();
      }

      const newPlan = {
        name: message || generateDefaultPlanTitle(),
        schedule: schedule,
        majors: isNoMajorSelected ? undefined : majors,
        minors: isNoMinorSelected || !minors?.length ? undefined : minors,
        catalogYear: isNoMajorSelected ? undefined : catalogYear,
        concentration: isNoMajorSelected
          ? undefined
          : concentration || undefined,
      };

      if (isGuest) {
        setGuestPlan(newPlan);

        const courseKeys = new Set<string>();
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

        const queryParams = new URLSearchParams();
        for (const m of newPlan.majors ?? []) queryParams.append("majors", m);
        for (const m of newPlan.minors ?? []) queryParams.append("minors", m);
        if (newPlan.catalogYear)
          queryParams.set("catalogYear", String(newPlan.catalogYear));
        if (courseKeys.size)
          queryParams.set("courses", [...courseKeys].join(","));

        toast(`Plan ${newPlan.name} created locally! Redirecting...`);
        router.push(`/graduate/guest?${queryParams.toString()}`);
        return;
      }

      const response = await fetch("/api/audit/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newPlan),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast(
          `Invalid response from server: ${errorData.error || "No error data received"}`,
        );
        throw new Error(errorData.error || "Failed to create plan");
      }

      const createdPlan = await response.json();

      toast(`Plan ${createdPlan.name} created successfully! Redirecting...`);
      router.push(`/graduate/${createdPlan.id}`);

      handleClose();
    } catch (error) {
      toast(`Plan creation failed, ${error}`);
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
      handleClose();
    }
  };

  return (
    <>
      {!isControlled && (
        <Button
          className="bg-accent hover:bg-accent/80 w-full"
          onClick={() => setIsOpen(true)}
        >
          open sesame{" "}
        </Button>
      )}
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            className="max-w-2xl"
            aria-label="New Plan Modal content"
          >
            <DialogHeader>
              <DialogTitle className="flex justify-center">
                New {isGuest ? "Guest " : ""}Plan
              </DialogTitle>
            </DialogHeader>
            {/* outer div */}
            <div className="flex h-full w-full flex-col justify-between gap-4">
              {/* title */}
              <div>
                <Label htmlFor="title" className="text-neu6 text-xs font-bold">
                  TITLE
                </Label>
                <Input
                  placeholder={generateDefaultPlanTitle()}
                  value={message}
                  id="title"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMessage(e.target.value)
                  }
                />
              </div>

              {/* catalog year */}
              {
                <div className="">
                  <Label
                    htmlFor="year-select"
                    className="text-neu6 text-xs font-bold"
                  >
                    CATALOG YEAR
                  </Label>
                  <Select
                    value={catalogYear.toString()}
                    onValueChange={(newYear) => setCatalogYear(Number(newYear))}
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
              }

              {/* majors */}
              {!isNoMajorSelected && (
                <div>
                  <Label
                    className="text-neu6 text-xs font-bold"
                    htmlFor="majors-select"
                  >
                    MAJOR(S)
                  </Label>
                  <MultiSelect
                    values={majors}
                    onValuesChange={setMajors}
                    disabled={catalogYear == -1}
                  >
                    <MultiSelectTrigger
                      className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed"
                      id="majors-select"
                    >
                      <MultiSelectValue
                        placeholder={
                          isLoadingMajors
                            ? "Loading majors..."
                            : "Select a major"
                        }
                        displayTagsUnderneath={true}
                      />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {majorOptions
                        .sort((a, b) => a.majorName.length - b.majorName.length)
                        .map((major) => (
                          <MultiSelectItem
                            key={major.majorName}
                            value={major.majorName}
                          >
                            {major.majorName}
                          </MultiSelectItem>
                        ))}
                    </MultiSelectContent>
                  </MultiSelect>

                  {/* selected major tags */}
                  {majors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {majors.map((major) => (
                        <div
                          key={major}
                          className="bg-neu2 text-neu6 flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                        >
                          <span>{major}</span>
                          <button
                            onClick={() =>
                              setMajors(majors.filter((m) => m !== major))
                            }
                            className="ml-1 cursor-pointer hover:opacity-70"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/*  major checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isNoMajorSelected}
                  onChange={
                    isNoMajorSelected
                      ? () => setIsNoMajorSelected(!isNoMajorSelected)
                      : handleNoMajor
                  }
                  className="border-input accent-red h-3 w-3 scale-150 rounded"
                  id="no-major-check"
                />
                <Label
                  className="text-neu6 text-sm font-bold"
                  htmlFor="no-major-check"
                >{`Can't find my major?`}</Label>
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
              </div>

              {/* Concentration */}
              {concentrationOptions.length > 0 && !isNoMajorSelected && (
                <div className="">
                  <Label
                    htmlFor="concentration-select"
                    className="text-neu6 mb-2 text-xs font-bold"
                  >
                    CONCENTRATION
                  </Label>
                  <Select
                    value={concentration}
                    onValueChange={setConcentration}
                  >
                    <SelectTrigger
                      className="border-neu3 w-full rounded-4xl border bg-transparent"
                      id="concentration-select"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingConcentration
                            ? "Concentrations loadin..."
                            : "Select a Concentration"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {concentrationOptions
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
                  <MultiSelect
                    values={minors}
                    onValuesChange={setMinors}
                    disabled={catalogYear == -1}
                  >
                    <MultiSelectTrigger
                      className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed"
                      id="minor-select"
                    >
                      <MultiSelectValue
                        placeholder={
                          isLoadingMinors
                            ? "Loading minors..."
                            : "Select a minor"
                        }
                        displayTagsUnderneath={true}
                      />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {minorOptions
                        .sort((a, b) => a.minorName.length - b.minorName.length)
                        .map((minor) => (
                          <MultiSelectItem
                            key={minor.minorName}
                            value={minor.minorName}
                          >
                            {minor.minorName}
                          </MultiSelectItem>
                        ))}
                    </MultiSelectContent>
                  </MultiSelect>

                  {/* selected minor tags */}
                  {minors.length > 0 &&
                    !isNoMajorSelected &&
                    majors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {minors.map((minor) => (
                          <div
                            key={minor}
                            className="bg-neu2 text-neu6 flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                          >
                            <span>{minor.split(",")[0].trim()}</span>
                            <button
                              onClick={() =>
                                setMinors(minors.filter((m) => m !== minor))
                              }
                              className="ml-1 cursor-pointer hover:opacity-70"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* modal footer */}
              <div className="border-neu25 flex flex-col justify-center gap-4 border-t py-4">
                {isTemplateLoading && <p>fetching template...</p>}
                {hasTemplate &&
                  !isNoMajorSelected &&
                  majors.length > 0 &&
                  !isTemplateLoading && (
                    <div className="bg-neu2 mt-2 gap-8 rounded-xl border p-4">
                      <div className="display: mb-2 inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useRecommendedTemplate}
                          id="use-template"
                          onChange={() => {
                            const next = !useRecommendedTemplate;
                            setUseRecommendedTemplate(next);
                            if (!next) setSelectedTemplateOption("");
                          }}
                          className="accent-red h-3 w-3 scale-150 rounded"
                          disabled={
                            majors.length === 0 &&
                            !catalogYear &&
                            isNoMajorSelected
                          }
                        />
                        <Label
                          className="text-neu7 font-bold"
                          htmlFor="use-template"
                        >
                          Use recommended template for {majors[0]}
                        </Label>
                      </div>

                      <p className="text-neu6 ml-5 text-sm">
                        {recommendedTemplateLabel}
                      </p>

                      {useRecommendedTemplate &&
                        templateOptionNames.length > 1 && (
                          <div className="mt-3 ml-5">
                            <Label
                              htmlFor="template-option-select"
                              className="text-neu6 text-xs font-bold"
                            >
                              SELECT A PLAN OPTION
                            </Label>
                            <Select
                              value={selectedTemplateOption}
                              onValueChange={setSelectedTemplateOption}
                            >
                              <SelectTrigger
                                className="border-neu3 mt-1 w-full rounded-4xl border bg-transparent"
                                id="template-option-select"
                              >
                                <SelectValue placeholder="Select a template option" />
                              </SelectTrigger>
                              <SelectContent>
                                {templateOptionNames.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>
                  )}
                <div className="mt-2 flex justify-center gap-4">
                  <Button
                    className=""
                    variant="secondary"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className=""
                    variant="default"
                    size="sm"
                    onClick={handleCreatePlan}
                    disabled={
                      isSubmitting ||
                      (!isNoMajorSelected && majors.length == 0) ||
                      catalogYear <= 2000 ||
                      (concentrationOptions.length > 0 &&
                        concentration.length == 0) ||
                      (useRecommendedTemplate &&
                        templateOptionNames.length > 1 &&
                        !selectedTemplateOption)
                    }
                  >
                    Create Plan
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
