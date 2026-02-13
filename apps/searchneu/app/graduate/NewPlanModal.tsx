import { Suspense, useEffect, useState } from "react";
import { Button, FormField, Input, Modal, Checkbox,  ModalFooter } from "./Modal";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { GetSupportedMajorsResponse, GetSupportedMinorsResponse } from "@/lib/graduate/api-response-types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPMultiselectGroups } from "@/components/catalog/search/SPMultiselectGroups";
import { MultiSelect, MultiSelectContent, MultiSelectItem, MultiSelectTrigger, MultiSelectValue } from "@/components/ui/multi-select";

export default function NewPlanModal() {
  const catalogYearOptions = [
    { label: '2021', value: '2021' },
    { label: '2022', value: '2022' },
    { label: '2023', value: '2023' },
    { label: '2024', value: '2024' },
  ];

  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState('');

  //majors 
  const [supportedMajorsData, setSupportedMajorsData] = useState<GetSupportedMajorsResponse | null>(null);
  const [majorOptions, setMajorOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);
  const [majors, setMajors] = useState<string[]>([]);
  //minors
  const [supportedMinorsData, setSupportedMinorsData] = useState<GetSupportedMinorsResponse | null>(null);
  const [minorOptions, setMinorOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingMinors, setIsLoadingMinors] = useState(false);  
  const [minors, setMinors] = useState<string[]>([]);

  //concentrations
  const [concentration, setConcentration] = useState('');
  const [concentrationOptions, setConcentrationOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingConcentration, setIsLoadingConcentration] = useState(false);  

  const noMajorHelperLabel = `You can opt out of selecting a major for this plan if you are unsure or if we do not support you major Without a selected major, we won't be able to display the major requirements`;

  const handleClose = () => {
    setIsOpen(false);
  }

  //fetching majors + minors 
  useEffect(() => {
    //majors
  const fetchSupportedMajors = async () => {
    setIsLoadingMajors(true);
    
    try {
      const response = await GraduateAPI.majors.getSupportedMajors();
      setSupportedMajorsData(response);
    } catch (error) {
      console.error('Error fetching majors:', error);
    } 
    setIsLoadingMajors(false);
  };

  //minors
  const fetchSupportedMinors = async () => {
    setIsLoadingMinors(true);
    
    try {
      const response = await GraduateAPI.minors.getSupportedMinors();
      setSupportedMinorsData(response);
    } catch (error) {
      console.error('Error fetching minors:', error);
    } 
    setIsLoadingMinors(false);
  };

  fetchSupportedMajors();
  fetchSupportedMinors();
}, []);

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
      .map(majorName => ({
        value: majorName,
        label: majorName
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
      .map(minorName => ({
        value: minorName,
        label: minorName
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
    setConcentration('');
    return;
  }
  
  {/*TODO: which major should concentrations come from?*/}
  const majorData = supportedMajorsData.supportedMajors[catalogYear]?.[majors[0]];
  
  if (majorData?.concentrations && majorData.concentrations.length > 0) {
    const options = majorData.concentrations.map(name => ({
      value: name,
      label: name
    }));
    setConcentrationOptions(options);
  } else {
    setConcentrationOptions([]);
    setConcentration('');
  }
  setIsLoadingConcentration(false);
}, [majors, catalogYear, supportedMajorsData]);


// generate default plan title using formatted date and time
const generateDefaultPlanTitle = () => {
    const now = new Date();
    return `Plan ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="New Plan"
      >
        {/*import from UAchieve*/}
        <div className="flex justify-center">
          <button className="border-gray-500 rounded-4xl border p-2 pl-5 pr-5">
          Import from UAchieve
        </button>
        </div>
        

        {/*title*/}
        <div className="mb-6">
          <FormField label="TITLE">
          <Input
            placeholder= {generateDefaultPlanTitle()}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          />
        </FormField>
        </div>
        

         {/*catalog year*/}
         <div className="mb-6">
          <Label
            htmlFor="catalog-year-select"
            className="text-neu6 text-xs font-bold"
          >
            CATALOG YEAR
          </Label>
          <Select 
            value={catalogYear} 
            onValueChange={setCatalogYear}
          >
            <SelectTrigger className="w-full bg-transparent border border-neu2 rounded-4xl">
              <SelectValue placeholder="Select catalog year" />
            </SelectTrigger>
            <SelectContent>
              {catalogYearOptions.map((t) => (
                <SelectItem key={t.label} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
         

         {/*major*/}
          <div className="mb-6">
            <Label className="text-neu6 text-xs font-bold">
              MAJOR(S)
            </Label>
            <MultiSelect 
              values={majors}
              onValuesChange={setMajors}
              disabled={!catalogYear}
            >
              <MultiSelectTrigger className="w-full bg-transparent border border-neu2 rounded-4xl shadow-none disabled:bg-neu3 disabled:cursor-not-allowed">
                <MultiSelectValue 
                  placeholder={isLoadingMajors ? "Loading majors..." : "Select a major"}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {majorOptions.map((major) => (
                  <MultiSelectItem key={major.value} value={major.value}>
                    {major.label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>

            {/*no major checkbox + tooltip*/}
            <Checkbox
              label="Can't find my major?"
              checked={isNoMajorSelected}
              onChange={() => setIsNoMajorSelected(!isNoMajorSelected)}
              helpText={noMajorHelperLabel}
            />
          </div>

          {/*concentration*/}
          {concentrationOptions.length > 0 &&
          <div className="mb-6">
             
            <Label
              htmlFor="catalog-year-select"
              className="text-neu6 text-xs font-bold"
            >
              CONCENTRATION
            </Label>
              <Select 
              value={concentration} 
              onValueChange={setConcentration}
            >
              <SelectTrigger className="w-full bg-transparent border border-neu2 rounded-4xl">
                <SelectValue placeholder="Select a Concentration" />
              </SelectTrigger>
              <SelectContent>
                {concentrationOptions.map((t) => (
                  <SelectItem key={t.label} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          }

          {/*minor*/}
          <div className="mb-6">
            <Label className="text-neu6 text-xs font-bold">
              MINOR(S)
            </Label>
            <MultiSelect 
              values={minors}
              onValuesChange={setMinors}
              disabled={!catalogYear}
            >
              <MultiSelectTrigger className="w-full bg-transparent border border-neu2 rounded-4xl shadow-none disabled:bg-neu3 disabled:cursor-not-allowed">
                <MultiSelectValue 
                  placeholder={isLoadingMinors ? "Loading minors..." : "Select a minor"}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {minorOptions.map((minor) => (
                  <MultiSelectItem key={minor.value} value={minor.value}>
                    {minor.label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>

        <ModalFooter>
            <Button variant="secondary"> Cancel </Button>
            <Button variant="primary" onClick={handleClose}> Create Plan </Button>
        </ModalFooter>        
        
      </Modal>
    </>
  );
}