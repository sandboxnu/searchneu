"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Audit, AuditCourse, ParsedCourse } from "@/lib/graduate/types";
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
import { CircleQuestionMark, FileUp } from "lucide-react";
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
  const [uploadedCourses, setUploadedCourses] = useState<ParsedCourse[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // handler for PDF upload
  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      (file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf"))
    ) {
      toast("Please upload a PDF file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/audit/utils/parse-pdf", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to parse PDF";
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText);
            if (parsed && typeof parsed === "object" && "error" in parsed) {
              errorMessage =
                (parsed as { error?: string }).error || errorMessage;
            } else {
              errorMessage = errorText;
            }
          } catch {
            errorMessage = errorText;
          }
        }
        toast(errorMessage);
        throw new Error(errorMessage);
      }

      const courses: ParsedCourse[] = await response.json();
      setUploadedCourses(courses);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "An unexpected error occurred while parsing the PDF.";
      toast(message);
    }
  };

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
    setUploadedCourses([]);
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
      let schedule: Audit;
      // NOTE: for now, template plans are based on the first selected major */
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

      if (isGuest) {
        setGuestPlan(newPlan);
        toast(`Plan ${newPlan.name} created locally! Redirecting...`);
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

      if (uploadedCourses.length > 0) {
        let existingTransferCourses: AuditCourse[] = [];
        try {
          const meta = await fetch("/api/audit/student", {
            credentials: "include",
          });
          if (meta.ok) {
            const metaData = await meta.json();
            existingTransferCourses = metaData.transferCourses ?? [];
          }
        } catch {
          // keep going with empty existing list
        }

        const existingKeys = new Set(
          existingTransferCourses.map((course) => `${course.subject}-${course.classId}`),
        );
        const newCourses: AuditCourse[] = uploadedCourses
          .filter((course) => !existingKeys.has(`${course.subject}-${course.classId}`))
          .map(({subject, classId}) => ({
            name: `${subject} ${classId}`,
            subject: subject,
            classId: classId,
            numCreditsMin: 0,
            numCreditsMax: 0,
            id: null,

          }));

        if (newCourses.length > 0) {
          const merged = [...existingTransferCourses, ...newCourses];
          await fetch("/api/audit/student", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ transferCourses: merged }),
          });
        }
      }

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

            <div className="flex flex-col items-center">
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  ref={fileInputRef}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                />
                <Button className="border-r1 bg-r1/30 flex items-center gap-2 rounded-4xl border p-2 pr-5 pl-5 font-bold text-[#E63946]">
                  <FileUp />
                  Import from UAchieve
                </Button>
              </div>
              {uploadedCourses.length > 0 && (
                <span className="text-sm text-green-500">
                  ✓ {uploadedCourses.length} courses
                </span>
              )}
            </div>

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
                          onChange={() =>
                            setUseRecommendedTemplate(!useRecommendedTemplate)
                          }
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
