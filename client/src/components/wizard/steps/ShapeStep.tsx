import { ShapeSelector } from '@/components/ShapeSelector';
import { ShapeKind } from '@/types';
import { WizardStepWrapper } from '../WizardStepWrapper';

interface ShapeStepProps {
  selectedShape: ShapeKind;
  onShapeSelect: (shape: ShapeKind) => void;
  isActive: boolean;
}

export function ShapeStep({ selectedShape, onShapeSelect, isActive }: ShapeStepProps) {
  return (
    <WizardStepWrapper
      title="Select Your Shape"
      description="Choose the geometric shape you want to cut. Each shape has specific dimension requirements."
      isActive={isActive}
    >
      <div className="max-w-md mx-auto">
        <ShapeSelector
          selectedShape={selectedShape}
          onShapeSelect={onShapeSelect}
        />
      </div>
    </WizardStepWrapper>
  );
}