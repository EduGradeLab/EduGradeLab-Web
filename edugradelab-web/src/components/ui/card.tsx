/**
 * Card Component
 * Modern kart komponenti mobil-first tasarım ile
 * Farklı varyantları ve içerik düzenleri destekler
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  rounded?: 'none' | 'sm' | 'default' | 'lg' | 'xl';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default',
    padding = 'default',
    rounded = 'default',
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "bg-white border border-gray-200",
          
          // Variants
          {
            'shadow-sm': variant === 'default',
            'border-2 shadow-none': variant === 'outlined',
            'shadow-lg border-0': variant === 'elevated',
            'bg-gray-50 border-gray-300': variant === 'filled',
          },
          
          // Padding
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4 sm:p-6': padding === 'default',
            'p-6 sm:p-8': padding === 'lg',
          },
          
          // Rounded corners
          {
            'rounded-none': rounded === 'none',
            'rounded-sm': rounded === 'sm',
            'rounded-lg': rounded === 'default',
            'rounded-xl': rounded === 'lg',
            'rounded-2xl': rounded === 'xl',
          },
          
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, divided = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-1.5",
          divided && "border-b border-gray-200 pb-4 mb-4",
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight text-gray-900",
          "sm:text-xl", // Larger on desktop
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-gray-600 leading-relaxed",
        className
      )}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    />
  );
});

CardContent.displayName = "CardContent";

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
  align?: 'left' | 'center' | 'right' | 'between';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, divided = false, align = 'right', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          divided && "border-t border-gray-200 pt-4 mt-4",
          {
            'justify-start': align === 'left',
            'justify-center': align === 'center',
            'justify-end': align === 'right',
            'justify-between': align === 'between',
          },
          "space-x-2",
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
