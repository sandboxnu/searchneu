import { useEffect, useState } from "react";
import {
  Button,
  FormField,
  Input,
  Modal,
  Checkbox,
  ModalFooter,
} from "./Modal";
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
import {
  useSupportedMajors,
  useSupportedMinors,
} from "@/lib/graduate/useGraduateApi";

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated?: () => void;
  plan: {
    id: number;
    name: string;
    majors?: string[];
    minors?: string[];
    catalogYear?: number;
    concentration?: string;
  };
}

export default function EditPlanModal({
  isOpen,
  onClose,
  onPlanUpdated,
  plan,
}: EditPlanModalProps) {
  const catalogYearOptions = [
    { label: "2021", value: 2021 },
    { label: "2022", value: 2022 },
    { label: "2023", value: 2023 },
    { label: "2024", value: 2024 },
    { label: "2025", value: 2025 },
  ];

  const [message, setMessage] = useState(plan.name);
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(
    !plan.majors?.length,
  );
  const [isNoMinorSelected, setIsNoMinorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState(plan.catalogYear ?? -1);
  const [majors, setMajors] = useState<string[]>(plan.majors ?? []);
  const [minors, setMinors] = useState<string[]>(plan.minors ?? []);
  const [concentration, setConcentration] = useState(
    plan.concentration ?? "",
  );

  //majors
  const { data: supportedMajorsData, error: majorsError } =
    useSupportedMajors();
  const isLoadingMajors = !supportedMajorsData && !majorsError;
  const [majorOptions, setMajorOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const noMajorHelperLabel = `Major isn't currently supported`;

  //minors
  const { data: supportedMinorsData, error: minorsError } =
    useSupportedMinors();
  const isLoadingMinors = !supportedMinorsData && !minorsError;
  const [minorOptions, setMinorOptions] = useState<
    { value: string; label: string }[]
  >([]);

  //concentrations
  const [concentrationOptions, setConcentrationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingConcentration, setIsLoadingConcentration] = useState(false);

  //form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  //helper function - generate default plan title
  const generateDefaultPlanTitle = () => {
    const now = new Date();
    return `Plan ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  };

  //helper function - reset form to original plan values on close/cancel
  const handleClose = () => {
    setMessage(plan.name);
    setCatalogYear(plan.catalogYear ?? -1);
    setMajors(plan.majors ?? []);
    setMinors(plan.minors ?? []);
    setConcentration(plan.concentration ?? "");
    setIsNoMajorSelected(!plan.majors?.length);
    setIsNoMinorSelected(false);
    onClose();
  };

  //pre-fill form when modal opens with latest plan data
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
        .map((majorName) => ({ value: majorName, label: majorName }));
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
        .map((minorName) => ({ value: minorName, label: minorName }));
      setMinorOptions(options);
    } else {
      setMinorOptions([]);
    }
  }, [catalogYear, supportedMinorsData]);

  //change concentrations based on major
  useEffect(() => {
    setIsLoadingConcentration(true);
    if (!majors || !catalogYear || !supportedMajorsData) {
      setConcentrationOptions([]);
      return;
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

  //edit plan
  const handleEditPlan = async () => {
    const nothingChanged =
      message === plan.name &&
      catalogYear === (plan.catalogYear ?? -1) &&
      JSON.stringify(majors) === JSON.stringify(plan.majors ?? []) &&
      JSON.stringify(minors) === JSON.stringify(plan.minors ?? []) &&
      concentration === (plan.concentration ?? "");

    if (nothingChanged) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/audit/plan/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            name: message || plan.name,
            majors: isNoMajorSelected ? null : majors,
            minors: isNoMinorSelected || !minors?.length ? null : minors,
            catalogYear: isNoMajorSelected ? null : catalogYear,
            concentration: isNoMajorSelected ? null : concentration || null,
          }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update plan");
      }

      onPlanUpdated?.();
      handleClose();
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Plan">
      {/*title*/}
      <div className="mb-6">
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

      {/*catalog year*/}
      {!isNoMajorSelected && (
        <div className="mb-6">
          <Label
            htmlFor="catalog-year-select"
            className="text-neu6 mb-2 text-xs font-bold"
          >
            CATALOG YEAR
          </Label>
          <Select value={catalogYear.toString()}
          onValueChange={(v) => {
            setCatalogYear(Number(v));
            setMajors([]);
            setConcentration("");
            }}>
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

      {/*major*/}
      {!isNoMajorSelected && (
        <div className="mb-2">
          <Label className="text-neu6 mb-2 text-xs font-bold">MAJOR(S)</Label>
          <MultiSelect
            values={majors}
            onValuesChange={setMajors}
            disabled={!catalogYear}
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
                .sort((a, b) => a.label.length - b.label.length)
                .map((major) => (
                  <MultiSelectItem key={major.value} value={major.value}>
                    {major.label}
                  </MultiSelectItem>
                ))}
            </MultiSelectContent>
          </MultiSelect>
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

      <div className="mb-6">
      <Checkbox
      label="Can't find my major?"
      checked={isNoMajorSelected}
      onChange={() => {
        setIsNoMajorSelected(!isNoMajorSelected);
        if (!isNoMajorSelected) {
            setMajors([]);
            setConcentration("");
    }
  }}
  helpText={noMajorHelperLabel}
/>
      </div>

      {/*concentration*/}
      {concentrationOptions.length > 0 && !isNoMajorSelected && (
        <div className="mb-6">
          <Label className="text-neu6 mb-2 text-xs font-bold">
            CONCENTRATION
          </Label>
          <Select value={concentration} onValueChange={setConcentration}>
            <SelectTrigger className="border-neu3 w-full rounded-4xl border bg-transparent">
              <SelectValue
                placeholder={
                  isLoadingConcentration
                    ? "Loading..."
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

      {/*minors*/}
      {!isNoMajorSelected && majors.length > 0 && (
        <div className="">
          <Label className="text-neu6 mb-2 text-xs font-bold">MINOR(S)</Label>
          <MultiSelect
            values={minors}
            onValuesChange={setMinors}
            disabled={!catalogYear}
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
                .sort((a, b) => a.label.length - b.label.length)
                .map((minor) => (
                  <MultiSelectItem key={minor.value} value={minor.value}>
                    {minor.label}
                  </MultiSelectItem>
                ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      )}

      {/*selected minor tags*/}
      {minors.length > 0 && !isNoMajorSelected && majors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {minors.map((minor) => (
            <div
              key={minor}
              className="bg-neu2 text-neu6 flex items-center gap-1 rounded-full px-3 py-1 text-sm"
            >
              <span>{minor.split(",")[0].trim()}</span>
              <button
                onClick={() => setMinors(minors.filter((m) => m !== minor))}
                className="ml-1 cursor-pointer hover:opacity-70"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <ModalFooter>
        <div className="flex w-full flex-col gap-4">
          <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditPlan}
              isDisabled={
                isSubmitting ||
                (!isNoMajorSelected &&
                  (majors.length < 1 ||
                    (concentration.length < 1 &&
                      concentrationOptions.length > 0) ||
                    catalogYear < 2000))
              }
            >
              Save Changes
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}