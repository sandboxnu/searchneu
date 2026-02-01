import { useState } from "react";
import { Button, FormField, Input, Modal, ModalFooter } from "./Modal";

export default function NewPlanModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

    // Generate default plan title using formatted date and time
  const generateDefaultPlanTitle = () => {
    const now = new Date();
    return `Plan ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  };

  return (
    <>
        {/*TODO: change isOpen*/}
      <Modal
        isOpen={true}
        onClose={() => setIsOpen(false)}
        title="Add Plan"
      >
        <FormField label="Title">
          <Input
            placeholder= {generateDefaultPlanTitle()}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          />
        </FormField>
      </Modal>
    </>
  );
}