import { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="">
      <label className="text-neu6 mb-2 block text-xs font-bold">{label}</label>
      {children}
    </div>
  );
}
