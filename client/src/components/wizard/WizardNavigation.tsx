import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinish?: () => void;
  nextLabel?: string;
  finishLabel?: string;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onFinish,
  nextLabel = "Continue",
  finishLabel = "Add to Cart"
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {totalSteps}</span>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep}
          data-testid="wizard-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button
          onClick={isLastStep ? onFinish : onNext}
          disabled={!canProceed}
          data-testid={isLastStep ? "wizard-finish" : "wizard-next"}
        >
          {isLastStep ? finishLabel : nextLabel}
          {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}