import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-20',
    md: 'h-40', 
    lg: 'h-60'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} text-muted-foreground ${className}`}>
      <Loader2 className={`animate-spin ${iconSizes[size]} mb-2`} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
