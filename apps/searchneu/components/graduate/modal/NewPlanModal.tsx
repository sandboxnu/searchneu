"use client";

import { useEffect, useMemo, useState } from "react";
import { Audit } from "@/lib/graduate/types";
import {
  useSupportedMajors,
  useSupportedMinors,
  useTemplate,
} from "@/lib/graduate/useGraduateApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function NewPlanModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [isNoMinorSelected, setIsNoMinorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState(-1);

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

  //templates
  const recommendedTemplateLabel = `This will pre-populate your plan with the recommended course sequence`;
  const [useRecommendedTemplate, setUseRecommendedTemplate] = useState(false);

  //form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  //template
  const hasTemplate = useTemplate(majors, catalogYear);
  const { template } = useTemplate(
    useRecommendedTemplate ? majors : null,
    useRecommendedTemplate ? catalogYear : null,
  );

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
  };

  const handleNoMajor = () => {
    setMessage("");
    setIsNoMajorSelected(true);
    setIsNoMinorSelected(true);
    setMajors([]);
    setMinors([]);
    setConcentration("");
    setUseRecommendedTemplate(false);
  };

  //change supported majors based on catalog year
  useEffect(() => {
    if (!catalogYear || !supportedMajorsData) {
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
    setIsLoadingConcentration(true);
    if (!majors || !catalogYear || !supportedMajorsData) {
      setConcentrationOptions([]);
      setConcentration("");
      return;
    }

    {
      /*NOTE: for now, concentrations are chosen from the first major that is selected */
    }
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
    setUseRecommendedTemplate(false);
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
      let schedule: Audit<null>;
      {
        /* NOTE: for now, template plans are based on the first selected major */
      }
      if (useRecommendedTemplate && template && majors[0]) {
        try {
          schedule = createScheduleFromTemplate(template);
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

      //setSelectedPlanId(createdPlan.id);
      toast(`Plan ${createdPlan.name} created successfully! Redirecting...`);
      //DENNIS TODO: redirect!!!!!!!!!
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
      <Button
        className="bg-accent hover:bg-accent/80 w-full"
        onClick={() => setIsOpen(true)}
      >
        open sesame{" "}
      </Button>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="hidden" />
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl"
            aria-label="New Plan Modal content"
          >
            <DialogHeader>
              <DialogTitle className="flex justify-center">
                New Plan
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
                  className="border-input h-3 w-3 scale-150 rounded accent-red-500"
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
              <div className="flex flex-col justify-center gap-4 border-t border-gray-200 py-4">
                {hasTemplate && !isNoMajorSelected && majors.length > 0 && (
                  <div className="mt-2 gap-8 rounded-xl border bg-[#F8F9F9] p-4">
                    <div className="display: mb-2 inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useRecommendedTemplate}
                        id="use-template"
                        onChange={() =>
                          setUseRecommendedTemplate(!useRecommendedTemplate)
                        }
                        className="h-3 w-3 scale-150 rounded accent-red-500"
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
                        Use recommended template
                      </Label>
                    </div>

                    <p className="text-neu6 ml-5 text-sm">
                      {recommendedTemplateLabel}
                    </p>
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
                        concentration.length == 0)
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
