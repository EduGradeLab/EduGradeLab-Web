/**
 * Loading Spinner Component
 * Mobil-uyumlu yükleme animasyonları
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'default', variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-block animate-spin rounded-full border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
          
          // Sizes
          {
            'h-4 w-4 border-2': size === 'sm',
            'h-6 w-6 border-2': size === 'default',
            'h-8 w-8 border-4': size === 'lg',
            'h-12 w-12 border-4': size === 'xl',
          },
          
          // Variants
          {
            'text-gray-600': variant === 'default',
            'text-blue-600': variant === 'primary',
            'text-white': variant === 'white',
          },
          
          className
        )}
        role="status"
        aria-label="Yükleniyor"
        {...props}
      >
        <span className="sr-only">Yükleniyor...</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

// Full page loading component
export interface LoadingProps {
  message?: string;
  size?: SpinnerProps['size'];
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Yükleniyor...', 
  size = 'lg' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Spinner size={size} variant="primary" />
      <p className="mt-4 text-gray-600 text-center">{message}</p>
    </div>
  );
};

// Inline loading component
export interface InlineLoadingProps {
  message?: string;
  size?: SpinnerProps['size'];
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message, 
  size = 'default',
  className 
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Spinner size={size} variant="primary" />
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
};

export { Spinner };
