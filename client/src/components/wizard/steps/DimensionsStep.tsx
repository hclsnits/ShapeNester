import { ShapeDims } from '@/components/ShapeDims';
import { ShapeKind, ShapeDims as ShapeDimsType } from '@/types';
import { WizardStepWrapper } from '../WizardStepWrapper';

interface DimensionsStepProps {
  shape: ShapeKind;
  dims: ShapeDimsType;
  onDimsChange: (dims: ShapeDimsType) => void;
  isActive: boolean;
}

export function DimensionsStep({ shape, dims, onDimsChange, isActive }: DimensionsStepProps) {
  const getShapeDescription = (shape: ShapeKind) => {
    switch (shape) {
      case 'rectangle':
        return 'Enter the width and height for your rectangle in millimeters.';
      case 'circle':
        return 'Enter the diameter for your circle in millimeters.';
      case 'triangle':
        return 'Enter the length of all three sides for your triangle in millimeters.';
      case 'hexagon_flat':
        return 'Enter the side length for your hexagon in millimeters.';
      case 'ring':
        return 'Enter the outer and inner diameters for your ring in millimeters.';
      case 'oval':
        return 'Enter the major and minor axis lengths for your oval in millimeters.';
      case 'oval_ring':
        return 'Enter the outer and inner dimensions for your oval ring in millimeters.';
      default:
        return 'Enter the dimensions for your shape in millimeters.';
    }
  };

  return (
    <WizardStepWrapper
      title="Set Dimensions"
      description={getShapeDescription(shape)}
      isActive={isActive}
    >
      <div className="max-w-md mx-auto">
        <ShapeDims
          shape={shape}
          dims={dims}
          onDimsChange={onDimsChange}
        />
      </div>
    </WizardStepWrapper>
  );
}