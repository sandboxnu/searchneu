'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Components that match the style
type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  required?: boolean;
};

const FormField = ({ label, children, required }: FormFieldProps) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

type InputProps = {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
};

const Input = ({ placeholder, value, onChange, ...props }: InputProps) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    {...props}
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
    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 1rem center'
    }}
    {...props}
  >
    <option value="">{placeholder}</option>
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

const Checkbox = ({ label, checked, onChange, helpText } : CheckboxProps) => (
  <div className="flex items-start mb-6">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <label className="ml-3 text-sm font-semibold text-gray-700">
      {label}
      {helpText && (
        <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 border border-gray-400 rounded-full">
          ?
        </span>
      )}
    </label>
  </div>
);


type ModalFooterProps = {
  children: ReactNode;
};

const ModalFooter = ({ children }: ModalFooterProps) => (
  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
    {children}
  </div>
);



type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
};

const Button = ({ children, onClick, variant = 'primary', type = 'button' }: ButtonProps) => {
  const baseClasses = "px-6 py-3 rounded-md font-medium transition-colors";
  const variants = {
    primary: "bg-pink-400 hover:bg-pink-500 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
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