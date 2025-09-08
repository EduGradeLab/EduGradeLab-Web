/**
 * Input Component
 * Tailwind CSS ile modern, erişilebilir input komponenti
 * Form validation desteği ile mobil-first tasarım
 */

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    containerClassName,
    type = 'text',
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    id,
    disabled,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;

    return (
      <div className={cn('w-full space-y-2', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400 text-sm">
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={cn(
              // Base styles - mobil-first
              "w-full h-12 px-4 py-3 text-base rounded-lg border border-gray-300 bg-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200 appearance-none",
              
              // Icon padding
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              
              // Error state
              hasError && "border-red-500 focus:ring-red-500",
              
              // Disabled state
              disabled && "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200",
              
              // Responsive improvements
              "sm:text-sm", // Smaller text on desktop
              
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              helpText ? `${inputId}-help` : undefined
            }
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-400 text-sm">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 flex items-start gap-1"
            role="alert"
          >
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Help Text */}
        {helpText && !error && (
          <p
            id={`${inputId}-help`}
            className="text-sm text-gray-500"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
