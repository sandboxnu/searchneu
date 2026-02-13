'use client';

import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X } from 'lucide-react';
import { ReactNode, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">  
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Close Button */}
        <div className="flex justify-end p-2">
        <button
            onClick={onClose}
            className="text-black-400 hover:bg-gray-100 rounded-sm transition-colors p-1"
          >
            <X className="size-4"/>
          </button>
        </div>
 
        {/* Header */}
        <div className="flex items-center justify-center -mt-4">
          <h2 className="text-md font-bold text-[#1C3557]">{title}</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

//form components
type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  required?: boolean;
};

const FormField = ({ label, children, required }: FormFieldProps) => (
  <div className="mb-4 mt-4">
    <label className="block text-xs font-bold text-neu6 mb-1">
      {label}
    </label>
    {children}
  </div>
);

type InputProps = {
  placeholder?: string;
  value: string;
  [key: string]: any;
};

const Input = ({ placeholder, value, onChange, }: InputProps) => (
  <input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 border border-neu2 rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none text-sm text-gray-500"
        />
);


type SelectProps = {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { label: string; value: string }[];
    [key: string]: any;
}
const Select = ({ placeholder, value, onChange, options, ...props }: SelectProps) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-4 py-3 border border-neu2 rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none text-sm text-gray-500"
    {...props}
  >
    <option value="">{placeholder} </option>
    {options?.map((opt, idx) => (
      <option key={idx} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

type CheckboxProps = {
    label: ReactNode;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helpText?: ReactNode;
}

const Checkbox = ({ label, checked, onChange, helpText }: CheckboxProps) => (
  <div className="flex items-center gap-2 mt-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
    />

    <label className="text-xs font-semibold text-neu6 flex items-center gap-1">
      {label}

      {helpText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs border border-gray-400 rounded-full cursor-help">
                ?
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">
              {helpText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </label>
  </div>
);


type ModalFooterProps = {
  children: ReactNode;
};

const ModalFooter = ({ children }: ModalFooterProps) => (
  <div className="flex justify-center gap-24 pt-4 border-t border-gray-200 mt-6">
    {children}
  </div>
);



type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  isDisabled?: boolean;
};

const Button = ({ children, onClick, variant = 'primary', type = 'button', isDisabled }: ButtonProps) => {
  const baseClasses = "px-6 py-3 rounded-4xl font-medium width-120px height-36px transition-colors";
  const variants = {
    primary: isDisabled ? "bg-[#EB5756]/50 text-white opacity-122" : "bg-[#E63946] text-white",
    secondary: "bg-transparent text-black"
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
    children : ReactNode;
    onClick: () => void; 
};

const Link = ({ children, onClick } : LinkProps) => (
  <button
    onClick={onClick}
    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
  >
    {children}
    <span className="inline-flex items-center justify-center w-4 h-4 text-xs border border-gray-400 rounded-full">
      ?
    </span>
  </button>
);

export {Modal, FormField, Input, Select, Checkbox, ModalFooter, Button, Link};