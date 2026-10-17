import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, className = '' }) => (
  <label className={`form-field ${className}`}>
    <span>{label}</span>
    {children}
  </label>
);
