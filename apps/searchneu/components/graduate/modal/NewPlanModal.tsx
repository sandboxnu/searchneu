"use client";

import { useEffect, useState } from "react";
import { FormField } from "./Modal";
import {
  Audit,
  AuditCourse,
  AuditYear,
  SeasonEnum,
  StatusEnum,
  Template,
} from "@/lib/graduate/types";
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

interface NewPlanModalProps {
  onClose: () => void;
  setSelectedPlanId: (id: number | null) => void;
}

export default function NewPlanModal({
  onClose,
  setSelectedPlanId,
}: NewPlanModalProps) {
  const catalogYearOptions = [
    { label: "2021", value: 2021 },
    { label: "2022", value: 2022 },
    { label: "2023", value: 2023 },
    { label: "2024", value: 2024 },
    { label: "2025", value: 2025 },
  ];

  const [message, setMessage] = useState("");
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [isNoMinorSelected, setIsNoMinorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState(-1);

  //majors
  const { data: supportedMajorsData, error: majorsError } =
    useSupportedMajors();
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
    onClose();
    setMessage("");
    setIsNoMajorSelected(false);
    setIsNoMinorSelected(false);
    setCatalogYear(-1);
    setMajors([]);
    setMinors([]);
    setConcentration("");
    setUseRecommendedTemplate(false);
  };

  //helper function -  generate default plan title using formatted date and time
  const generateDefaultPlanTitle = () => {
    const now = new Date();
    return `Plan ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  };

  //helper function - create empty schedule with 4 academic years and no classes
  const createEmptySchedule = (): Audit<null> => {
    const years: AuditYear<null>[] = [];

    for (let year = 1; year <= 4; year++) {
      years.push(createEmptyYear(year));
    }

    return {
      years,
    };
  };

  //helper function - create empty year w terms initialized
  const createEmptyYear = (year: number): AuditYear<null> => {
    return {
      year,
      fall: {
        season: SeasonEnum.FL,
        status: StatusEnum.CLASSES,
        classes: [],
        id: null,
      },
      spring: {
        season: SeasonEnum.SP,
        status: StatusEnum.CLASSES,
        classes: [],
        id: null,
      },
      summer1: {
        season: SeasonEnum.S1,
        status: StatusEnum.INACTIVE,
        classes: [],
        id: null,
      },
      summer2: {
        season: SeasonEnum.S2,
        status: StatusEnum.INACTIVE,
        classes: [],
        id: null,
      },
      isSummerFull: false,
    };
  };

  const createScheduleFromTemplate = (template: Template): Audit<null> => {
    const schedule = createEmptySchedule();

    try {
      // Check if we have the template data
      if (!template.templateData || !template.name) {
        console.error("Missing template data or name");
        return schedule;
      }

      // Get the plan data from the template
      const planData = template.templateData[template.name];
      if (!planData) {
        console.error("No plan data found in template");
        return schedule;
      }

      // Process each year in the template
      Object.keys(planData).forEach((yearKey) => {
        // Extract the year number from the year key (e.g., "Year 1" -> 1)
        const yearMatch = yearKey.match(/Year (\d+)/i);
        if (!yearMatch) return;

        const yearNum = parseInt(yearMatch[1], 10);
        if (isNaN(yearNum) || yearNum < 1 || yearNum > schedule.years.length)
          return;

        // Get the year object from the schedule (0-indexed)
        const yearObj = schedule.years[yearNum - 1];

        // Set all terms to inactive by default
        yearObj.fall.status = StatusEnum.INACTIVE;
        yearObj.spring.status = StatusEnum.INACTIVE;
        yearObj.summer1.status = StatusEnum.INACTIVE;
        yearObj.summer2.status = StatusEnum.INACTIVE;

        const yearData = planData[yearKey];

        // Process each term in the year
        Object.keys(yearData).forEach((termKey) => {
          const courses = yearData[termKey];
          if (!Array.isArray(courses)) return;

          // Map the term key to the schedule term
          let termObj: {
            status: StatusEnum;
            classes: AuditCourse<null>[];
          };

          switch (termKey.toLowerCase()) {
            case "fall":
              termObj = yearObj.fall;
              break;
            case "spring":
              termObj = yearObj.spring;
              break;
            case "summer 1":
              termObj = yearObj.summer1;
              break;
            case "summer 2":
              termObj = yearObj.summer2;
              break;
            default:
              return; // Skip unknown terms
          }

          // If there are courses, set status to CLASSES
          if (courses.length > 0) {
            termObj.status = StatusEnum.CLASSES;
            termObj.classes = []; // Clear any existing classes

            // Process each course
            courses.forEach((courseStr) => {
              // Parse course string format
              const courseParts = courseStr.match(/([A-Z]+)\s+(\d+[A-Z]*)(.*)/);
              if (!courseParts) {
                console.warn("Couldn't parse course:", courseStr);
                return;
              }

              const subject = courseParts[1];
              const classId = courseParts[2];

              // Create a course object
              const course: AuditCourse<null> = {
                name: courseStr,
                subject,
                classId,
                numCreditsMin: 4, // Default credits
                numCreditsMax: 4,
                id: null,
              };

              // Log the final course object for validation
              console.log(
                `Added course: ${course.subject} ${course.classId}, credits: ${course.numCreditsMin}-${course.numCreditsMax} to year ${yearNum}`,
              );

              // Add course to the term
              termObj.classes.push(course);
            });
          }
        });
      });

      console.log("Final schedule:", schedule);
      return schedule;
    } catch (error) {
      console.error("Error creating schedule from template:", error);
      return createEmptySchedule();
    }
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
          console.log("creating schedule from template");
          schedule = createScheduleFromTemplate(template);
        } catch (error) {
          console.error("error creating schedule from template:", error);
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

      console.log("Creating plan:", newPlan);

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
        throw new Error(errorData.error || "Failed to create plan");
      }

      const createdPlan = await response.json();

      setSelectedPlanId(createdPlan.id);

      handleClose();
      console.log("Plan created successfully:", createdPlan);
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
      handleClose();
    }
  };

  return (
    <>
      <Dialog open={true}>
        <DialogTrigger asChild>
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent
          className="max-w-2xl"
          aria-label="New Plan Modal content"
        >
          <DialogHeader>
            <DialogTitle className="flex justify-center">New Plan</DialogTitle>
          </DialogHeader>
          {/* outer div */}
          <div className="flex h-full w-full flex-col justify-between gap-4">
            {/* title */}
            <div className="">
              <FormField label="TITLE">
                <Input
                  placeholder={generateDefaultPlanTitle()}
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMessage(e.target.value)
                  }
                />
              </FormField>
            </div>

            {/* catalog year */}
            {!isNoMajorSelected && (
              <div className="">
                <Label
                  htmlFor="catalog-year-select"
                  className="text-neu6 text-xs font-bold"
                >
                  CATALOG YEAR
                </Label>
                <Select
                  value={catalogYear.toString()}
                  onValueChange={(newYear) => setCatalogYear(Number(newYear))}
                >
                  <SelectTrigger className="border-neu3 w-full rounded-4xl border bg-transparent">
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
            )}

            {/* majors */}
            {!isNoMajorSelected && (
              <div className="">
                <Label className="text-neu6 text-xs font-bold">MAJOR(S)</Label>
                <MultiSelect
                  values={majors}
                  onValuesChange={setMajors}
                  disabled={catalogYear == -1}
                >
                  <MultiSelectTrigger className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed">
                    <MultiSelectValue
                      placeholder={
                        isLoadingMajors ? "Loading majors..." : "Select a major"
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
            <div className="display: inline-flex gap-2">
              <input
                type="checkbox"
                checked={isNoMajorSelected}
                onChange={() => setIsNoMajorSelected(!isNoMajorSelected)}
                className="border-input h-4 w-4 rounded accent-red-500"
              />
              <Label className="text-neu6 text-sm">{`Can't find my major?`}</Label>
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
                  htmlFor="catalog-year-select"
                  className="text-neu6 mb-2 text-xs font-bold"
                >
                  CONCENTRATION
                </Label>
                <Select value={concentration} onValueChange={setConcentration}>
                  <SelectTrigger className="border-neu3 w-full rounded-4xl border bg-transparent">
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
            {!isNoMajorSelected && (
              <div className="">
                <Label className="text-neu6 text-xs font-bold">MINOR(S)</Label>
                <MultiSelect
                  values={minors}
                  onValuesChange={setMinors}
                  disabled={catalogYear == -1}
                >
                  <MultiSelectTrigger className="border-neu3 disabled:bg-neu3 w-full rounded-4xl border bg-transparent shadow-none disabled:cursor-not-allowed">
                    <MultiSelectValue
                      placeholder={
                        isLoadingMinors ? "Loading minors..." : "Select a minor"
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
            <div className="flex w-full flex-col justify-center gap-4 border-t border-gray-200 p-4">
              {hasTemplate && (
                <div className="mt-2 gap-8 rounded-xl border bg-[#F8F9F9] p-4">
                  <div className="display: mb-2 inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useRecommendedTemplate}
                      onChange={() =>
                        setUseRecommendedTemplate(!useRecommendedTemplate)
                      }
                      className="border-input h-4 w-4 rounded accent-red-500"
                      disabled={
                        majors.length === 0 && !catalogYear && isNoMajorSelected
                      }
                    />
                    <Label className="text-neu6 font-bold">
                      Use recommended template
                    </Label>
                  </div>

                  <p className="text-neu6 text-sm">
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
                  disabled={isSubmitting}
                >
                  Create Plan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
