import { PortfolioFilters } from '@/components/PortfolioFilters';
import { PortfolioRow } from '@/lib/portfolio-parser';
import { WizardStepWrapper } from '../WizardStepWrapper';

interface MaterialStepProps {
  selectedMaterial: PortfolioRow | null;
  onMaterialSelect: (material: PortfolioRow | null) => void;
  isActive: boolean;
}

export function MaterialStep({ selectedMaterial, onMaterialSelect, isActive }: MaterialStepProps) {
  return (
    <WizardStepWrapper
      title="Choose Your Material"
      description="Select the material for your cutting project. Filter by density, thickness, and color to find the perfect match."
      isActive={isActive}
    >
      <PortfolioFilters
        selectedMaterial={selectedMaterial}
        onMaterialSelect={onMaterialSelect}
      />
    </WizardStepWrapper>
  );
}