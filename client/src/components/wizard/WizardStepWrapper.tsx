import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WizardStepWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  isActive: boolean;
  className?: string;
}

export function WizardStepWrapper({
  title,
  description,
  children,
  isActive,
  className
}: WizardStepWrapperProps) {
  return (
    <div
      className={cn(
        "transition-all duration-300",
        isActive ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0",
        className
      )}
      data-testid={`wizard-step-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}