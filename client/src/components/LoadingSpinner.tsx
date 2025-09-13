import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn("flex items-center justify-center", className)} data-testid="loading-spinner">
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function PageLoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
