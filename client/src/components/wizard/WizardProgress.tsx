import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStepIndex: number;
}

export function WizardProgress({ steps, currentStepIndex }: WizardProgressProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="h-0.5 w-full bg-muted" />
        </div>
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div 
            className="h-0.5 bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                step.isCompleted 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : step.isActive 
                    ? "border-primary bg-background text-primary" 
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
              )}
              data-testid={`step-indicator-${step.id}`}
            >
              {step.isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-3 w-3 fill-current" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Labels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "text-center transition-colors duration-300",
              step.isActive 
                ? "text-foreground" 
                : step.isCompleted 
                  ? "text-primary" 
                  : "text-muted-foreground"
            )}
            data-testid={`step-label-${step.id}`}
          >
            <div className="font-medium text-sm">{step.title}</div>
            <div className="text-xs mt-1 hidden sm:block">{step.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}