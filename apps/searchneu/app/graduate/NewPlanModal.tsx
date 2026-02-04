import { useEffect, useState } from "react";
import { Button, FormField, Input, Modal, Checkbox, Select, ModalFooter } from "./Modal";

export default function NewPlanModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [isNoMajorSelected, setIsNoMajorSelected] = useState(false);
  const [catalogYear, setCatalogYear] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');

  const noMajorHelperLabel = `You can opt out of selecting a major for this plan if you are unsure or if we do not support you major Without a selected major, we won't be able to display the major requirements`;

  const handleClose = () => {
    setIsOpen(false);
  }
  
// Generate default plan title using formatted date and time
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
        {/*title*/}
        <FormField label="Title">
          <Input
            placeholder= {generateDefaultPlanTitle()}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          />
        </FormField>

        
      <Checkbox
        label = "No major?"
        checked = {isNoMajorSelected}
        onChange = {() => setIsNoMajorSelected(!isNoMajorSelected)}
        helpText = {noMajorHelperLabel}
      />
           {/*TODO: fix styling of checkbox*/}

        {/*no major checkbox + tooltip*/}

        {/*catalog year*/}
        <FormField label = "Catalog Year">
            {/* TODO make inner text gray, arrow dropdwon, graduate-style options */}
            <Select 
                placeholder="Select Catalog Year"
                value = {catalogYear}
                options={[
                    { value: '2021', label: '2021' },
                    { value: '2022', label: '2022' },
                    { value: '2023', label: '2023' },
                    { value: '2024', label: '2024' },
                ]}
                onChange = {(e: React.ChangeEvent<HTMLSelectElement>) => setCatalogYear(e.target.value)}
                />
        </FormField>

        {/*major*/}
        <FormField label = "Major(s)">
            {/* TODO make inner text gray, arrow dropdwon, graduate-style options */}
            <Select 
                placeholder = {major ? "" : "Select a major "}
                value = {major}
                options={[
                    { value: 'lol', label: 'lol' },
                ]}
                onChange = {(e: React.ChangeEvent<HTMLSelectElement>) => setMajor(e.target.value)}
                />
        </FormField>

        {/*minor*/}
        <FormField label = "Minor(s)">
            {/* TODO make inner text gray, arrow dropdwon, graduate-style options */}
            <Select 
                placeholder= { minor ? "" : "Select a minor" }
                value = {minor}
                options={[
                    { value: 'lol', label: 'lol' },
                ]}
                onChange = {(e: React.ChangeEvent<HTMLSelectElement>) => setMinor(e.target.value)}
                />
        </FormField>

        {/*Can't find your major / minor?*/}
        {/*TODO make tooltip */}
        Can't find your major/minor?

        {/*Recommended Template*/}


        <ModalFooter>
            <Button variant="secondary"> Cancel </Button>
            <Button variant="primary" onClick={handleClose}> Add Plan </Button>
        </ModalFooter>        
        
      </Modal>
    </>
  );
}