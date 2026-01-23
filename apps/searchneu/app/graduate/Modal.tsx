import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal */}
      <div
        className={`relative rounded-lg bg-white shadow-xl ${maxWidth} max-h-[120-vh] w-full overflow-y-auto`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="text-black-400 rounded-sm p-1 transition-colors hover:bg-gray-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Header */}
        <div className="-mt-4 flex items-center justify-center">
          <h2 className="text-md font-bold text-[#1C3557]">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

//form components
type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
};

const FormField = ({ label, children }: FormFieldProps) => (
  <div className="">
    <label className="text-neu6 block text-xs font-bold">{label}</label>
    {children}
  </div>
);

type InputProps = {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = ({ placeholder, value, onChange }: InputProps) => (
  <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="border-neu2 text-neu6 w-full appearance-none rounded-4xl border bg-white px-4 py-3 text-sm focus:outline-none"
  />
);

type SelectProps = {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
};
const Select = ({
  placeholder,
  value,
  onChange,
  options,
  ...props
}: SelectProps) => (
  <select
    value={value}
    onChange={onChange}
    className="border-neu2 w-full appearance-none rounded-4xl border bg-white px-4 py-3 text-sm text-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
    {...props}
  >
    <option value="">{placeholder} </option>
    {options?.map((opt, idx) => (
      <option key={idx} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

type CheckboxProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText?: ReactNode;
  descriptionText?: string;
};

const Checkbox = ({
  label,
  checked,
  onChange,
  helpText,
  descriptionText,
}: CheckboxProps) => (
  <div className="">
    <div className="mt-2 flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[#E63946]"
      />

      <label className="text-neu7 flex items-center gap-1 text-sm font-bold">
        {label}

        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-400 text-xs">
                  ?
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-2xs text-xs">
                {helpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
    </div>
    {descriptionText && (
      <p className="text-neu6 mt-2 mr-4 ml-4 text-sm font-light">
        {descriptionText}
      </p>
    )}
  </div>
);

type ModalFooterProps = {
  children: ReactNode;
};

const ModalFooter = ({ children }: ModalFooterProps) => (
  <div className="mt-6 flex justify-center gap-24 border-t border-gray-200 pt-4">
    {children}
  </div>
);

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  isDisabled?: boolean;
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  type = "button",
  isDisabled,
}: ButtonProps) => {
  const baseClasses =
    "px-6 py-3 rounded-4xl font-medium width-120px height-36px transition-colors";
  const variants = {
    primary: isDisabled
      ? "bg-[#EB5756]/50 text-white opacity-122"
      : "bg-[#E63946] text-white",
    secondary: "bg-transparent text-black",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};

type LinkProps = {
  children: ReactNode;
  onClick: () => void;
};

const Link = ({ children, onClick }: LinkProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
  >
    {children}
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-xs">
      ?
    </span>
  </button>
);

export { Modal, FormField, Input, Select, Checkbox, ModalFooter, Button, Link };
