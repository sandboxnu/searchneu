import { useEffect, useState } from "react";
import { Button, FormField, Input, Modal, Checkbox,  ModalFooter } from "./Modal";
import { GraduateAPI } from "@/lib/graduate/graduateApiClient";
import { GetSupportedMajorsResponse, GetSupportedMinorsResponse } from "@/lib/graduate/api-response-types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [major, setMajor] = useState('');

  //minors
  const [supportedMinorsData, setSupportedMinorsData] = useState<GetSupportedMinorsResponse | null>(null);
  const [minorOptions, setMinorOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingMinors, setIsLoadingMinors] = useState(false);  
  const [minor, setMinor] = useState('');

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
    setMajor(''); 
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
  
  setMajor('');
}, [catalogYear, supportedMajorsData]);

//change supported minors based on catalog year
useEffect(() => {
  if (!catalogYear || !supportedMinorsData) {
    setMinorOptions([]);
    setMinor(''); 
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
  
  setMinor('');
}, [catalogYear, supportedMinorsData]);

//change concentrations based on major
useEffect(() => {
  setIsLoadingConcentration(true);
  if (!major || !catalogYear || !supportedMajorsData) {
    setConcentrationOptions([]);
    setConcentration('');
    return;
  }
  
  const majorData = supportedMajorsData.supportedMajors[catalogYear]?.[major];
  
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
}, [major, catalogYear, supportedMajorsData]);


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
        <FormField label="TITLE">
          <Input
            placeholder= {generateDefaultPlanTitle()}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          />
        </FormField>

         {/*catalog year*/}
         <div className="">
          <Label
            htmlFor="catalog-year-select"
            className="text-neu7 text-xs font-bold text-neu6"
          >
            CATALOG YEAR
          </Label>
          <Select 
            value={catalogYear} 
            onValueChange={setCatalogYear}
          >
            <SelectTrigger className="w-full bg-transparent">
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
         



        
      {/* major
      <Suspense fallback={<MultiselectSkeleton />}>
          <SPMultiselectGroups
            label="MAJOR(S)"
            opts={Promise.resolve(majorOptions)}
            spCode="mjrs"
            placeholder = {isLoadingMajors ? "Loading majors ..." : "Select a major"}
          />
          </ Suspense> */}

      <Checkbox
        label = "Can't find my major?"
        checked = {isNoMajorSelected}
        onChange = {() => setIsNoMajorSelected(!isNoMajorSelected)}
        helpText = {noMajorHelperLabel}
      />

        {/*no major checkbox + tooltip*/}

       {/* concentration
        {concentrationOptions.length > 0 &&
        <FormField label = "Concentration">
            <Select 
                placeholder= { isLoadingConcentration ? "Loading concentrations..." : "Select a concentration"}
                value = {concentration}
                options={concentrationOptions}
                onChange = {(e: React.ChangeEvent<HTMLSelectElement>) => setConcentration(e.target.value)}
                />
        </FormField>} */}

        {/* minor
        <FormField label = "MINOR(S)">
            <Select 
                placeholder= { isLoadingMinors ? "Loading minors..." : "Select a minor"}
                value = {minor}
                options={minorOptions}
                onChange = {(e: React.ChangeEvent<HTMLSelectElement>) => setMinor(e.target.value)}
                />
        </FormField> */}


        <ModalFooter>
            <Button variant="secondary"> Cancel </Button>
            <Button variant="primary" onClick={handleClose}> Create Plan </Button>
        </ModalFooter>        
        
      </Modal>
    </>
  );
}