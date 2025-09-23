import { useState, useEffect, useMemo } from 'react';
import { PortfolioRow } from '@/lib/portfolio-parser';
import { ShapeKind, ShapeDims, CartItem } from '@/types';
import { portfolioRowToMaterial } from '@/lib/material-converter';
import { calculateNesting } from '@/lib/nesting';
import { calculateCosting } from '@/lib/costing';
import { calculatePerimeter } from '@/lib/geometry/perimeter';
import { availableOptions } from '@/components/Options';
import { centsToEuros } from '@/lib/money';
import { WizardProgress, WizardStep } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { MaterialStep } from './steps/MaterialStep';
import { ShapeStep } from './steps/ShapeStep';
import { DimensionsStep } from './steps/DimensionsStep';
import { OptionsStep } from './steps/OptionsStep';
import { ReviewStep } from './steps/ReviewStep';
import {
  validateMaterialStep,
  validateShapeStep,
  validateDimensionsStep,
  validateOptionsStep,
  ValidationResult
} from '@/lib/wizard-validation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

interface ConfigurationWizardProps {
  selectedMaterial: PortfolioRow | null;
  selectedShape: ShapeKind;
  shapeDims: ShapeDims;
  selectedOptions: string[];
  onMaterialSelect: (material: PortfolioRow | null) => void;
  onShapeSelect: (shape: ShapeKind) => void;
  onDimsChange: (dims: ShapeDims) => void;
  onOptionsChange: (options: string[]) => void;
  onAddToCart: (item: CartItem) => void;
}

export function ConfigurationWizard({
  selectedMaterial,
  selectedShape,
  shapeDims,
  selectedOptions,
  onMaterialSelect,
  onShapeSelect,
  onDimsChange,
  onOptionsChange,
  onAddToCart
}: ConfigurationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const steps: WizardStep[] = [
    {
      id: 'material',
      title: 'Material',
      description: 'Choose material',
      isCompleted: false,
      isActive: currentStep === 0
    },
    {
      id: 'shape',
      title: 'Shape',
      description: 'Select shape',
      isCompleted: false,
      isActive: currentStep === 1
    },
    {
      id: 'dimensions',
      title: 'Dimensions',
      description: 'Set size',
      isCompleted: false,
      isActive: currentStep === 2
    },
    {
      id: 'options',
      title: 'Options',
      description: 'Add services',
      isCompleted: false,
      isActive: currentStep === 3
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm order',
      isCompleted: false,
      isActive: currentStep === 4
    }
  ];

  // Validate all steps
  const validations = useMemo(() => {
    const materialValidation = validateMaterialStep(selectedMaterial);
    const shapeValidation = validateShapeStep(selectedShape);
    const dimensionsValidation = validateDimensionsStep(selectedShape, shapeDims);
    const optionsValidation = validateOptionsStep();

    return [
      materialValidation,
      shapeValidation,
      dimensionsValidation,
      optionsValidation,
      { isValid: true, errors: [], warnings: [] } // Review step
    ];
  }, [selectedMaterial, selectedShape, shapeDims, selectedOptions]);

  // Calculate completion status
  const stepsWithValidation = useMemo(() => {
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index < currentStep || (index <= currentStep && validations[index].isValid),
      isActive: index === currentStep
    }));
  }, [currentStep, validations]);

  const currentValidation = validations[currentStep] || { isValid: true, errors: [], warnings: [] };
  const canProceed = currentValidation.isValid;

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleFinish = () => {
    if (!selectedMaterial || !canProceed) return;

    try {
      const material = portfolioRowToMaterial(selectedMaterial);
      
      // Use default costing parameters (same as CostingPanel defaults)
      const quantity = 1;
      const spacing = 5;
      const kerf = 1.5;
      const orientation: 0 | 90 = 0;
      const hourlyRate = 40;
      const cuttingSpeed = 7;
      const kotFee = 5;

      const nesting = calculateNesting({
        shape: selectedShape,
        dims: shapeDims,
        quantity,
        sheetWidth: material.doekbreedte_mm,
        spacing: spacing.toString(),
        kerf: kerf.toString(),
        orientation
      });

      const perimeter = calculatePerimeter(selectedShape, shapeDims);
      const pricePerM2 = centsToEuros(material.prijs_per_m2_cents);
      
      const optionsCost = selectedOptions.reduce((sum, optionId) => {
        const option = availableOptions.find(o => o.id === optionId);
        return sum + (option?.price || 0);
      }, 0);

      const costing = calculateCosting({
        material,
        nesting,
        quantity,
        perimeter_mm: perimeter,
        pricePerM2,
        hourlyRate,
        cuttingSpeed,
        kotFee,
        optionsCost
      });
      
      const cartItem: CartItem = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        material,
        shape: selectedShape,
        dims: { ...shapeDims },
        amount: quantity,
        nesting,
        costing
      };

      onAddToCart(cartItem);
      
      // Reset wizard to first step and show success message
      setCurrentStep(0);
      toast({
        title: "Added to Cart",
        description: "Your configuration has been added to the cart successfully.",
      });
    } catch (error) {
      console.error('Error creating cart item from wizard:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="configuration-wizard">
      <WizardProgress 
        steps={stepsWithValidation} 
        currentStepIndex={currentStep}
      />

      {/* Validation Messages */}
      {currentValidation.errors.length > 0 && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {currentValidation.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {currentValidation.warnings.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {currentValidation.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="min-h-[500px] relative mb-8">
        <MaterialStep
          selectedMaterial={selectedMaterial}
          onMaterialSelect={onMaterialSelect}
          isActive={currentStep === 0}
        />
        
        <ShapeStep
          selectedShape={selectedShape}
          onShapeSelect={onShapeSelect}
          isActive={currentStep === 1}
        />
        
        <DimensionsStep
          shape={selectedShape}
          dims={shapeDims}
          onDimsChange={onDimsChange}
          isActive={currentStep === 2}
        />
        
        <OptionsStep
          selectedOptions={selectedOptions}
          onOptionsChange={onOptionsChange}
          isActive={currentStep === 3}
        />
        
        <ReviewStep
          selectedMaterial={selectedMaterial}
          selectedShape={selectedShape}
          shapeDims={shapeDims}
          selectedOptions={selectedOptions}
          isActive={currentStep === 4}
          onEditStep={handleEditStep}
        />
      </div>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        canProceed={canProceed}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFinish={handleFinish}
      />
    </div>
  );
}