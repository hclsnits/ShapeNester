import { Options } from '@/components/Options';
import { WizardStepWrapper } from '../WizardStepWrapper';

interface OptionsStepProps {
  selectedOptions: string[];
  onOptionsChange: (options: string[]) => void;
  isActive: boolean;
}

export function OptionsStep({ selectedOptions, onOptionsChange, isActive }: OptionsStepProps) {
  return (
    <WizardStepWrapper
      title="Additional Options"
      description="Choose any additional services for your cutting project. These are optional and will be added to your final cost."
      isActive={isActive}
    >
      <div className="max-w-md mx-auto">
        <Options
          selectedOptions={selectedOptions}
          onOptionsChange={onOptionsChange}
        />
      </div>
    </WizardStepWrapper>
  );
}