import { PortfolioRow } from '@/lib/portfolio-parser';
import { ShapeKind, ShapeDims, CartItem } from '@/types';
import { availableOptions } from '@/components/Options';
import { formatCentsEUR } from '@/lib/money';
import { calculateArea } from '@/lib/geometry/area';
import { calculatePerimeter } from '@/lib/geometry/perimeter';
import { WizardStepWrapper } from '../WizardStepWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewStepProps {
  selectedMaterial: PortfolioRow | null;
  selectedShape: ShapeKind;
  shapeDims: ShapeDims;
  selectedOptions: string[];
  isActive: boolean;
  onEditStep: (step: number) => void;
}

export function ReviewStep({ 
  selectedMaterial, 
  selectedShape, 
  shapeDims, 
  selectedOptions, 
  isActive,
  onEditStep
}: ReviewStepProps) {
  const getShapeDisplayName = (shape: ShapeKind) => {
    switch (shape) {
      case 'rectangle': return 'Rectangle';
      case 'circle': return 'Circle';
      case 'triangle': return 'Triangle';
      case 'hexagon_flat': return 'Hexagon';
      case 'ring': return 'Ring';
      case 'oval': return 'Oval';
      case 'oval_ring': return 'Oval Ring';
      default: return shape;
    }
  };

  const formatDimensions = (shape: ShapeKind, dims: ShapeDims) => {
    switch (shape) {
      case 'rectangle':
        return `${dims.width}mm × ${dims.height}mm`;
      case 'circle':
        return `Ø ${dims.diameter}mm`;
      case 'triangle':
        return `${dims.side_a}mm, ${dims.side_b}mm, ${dims.side_c}mm`;
      case 'hexagon_flat':
        return `Side: ${dims.side_length}mm`;
      case 'ring':
        return `Outer: Ø ${dims.outer_diameter}mm, Inner: Ø ${dims.inner_diameter}mm`;
      case 'oval':
        return `${dims.major_axis}mm × ${dims.minor_axis}mm`;
      case 'oval_ring':
        return `Outer: ${dims.outer_major}mm × ${dims.outer_minor}mm, Inner: ${dims.inner_major}mm × ${dims.inner_minor}mm`;
      default:
        return 'Custom dimensions';
    }
  };

  const selectedOptionDetails = availableOptions.filter(opt => 
    selectedOptions.includes(opt.id)
  );

  const totalOptionsPrice = selectedOptionDetails.reduce((sum, opt) => sum + opt.price, 0);

  let area = '';
  let perimeter = '';
  try {
    area = calculateArea(selectedShape, shapeDims);
    perimeter = calculatePerimeter(selectedShape, shapeDims);
  } catch (error) {
    // Handle calculation errors gracefully
  }

  return (
    <WizardStepWrapper
      title="Review Your Configuration"
      description="Please review your cutting configuration before adding to cart."
      isActive={isActive}
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Material Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Material</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditStep(0)}
              data-testid="edit-material"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {selectedMaterial ? (
              <div className="space-y-2">
                <div className="font-medium">{selectedMaterial.materiaalsoort}</div>
                <div className="text-sm text-muted-foreground">
                  Code: {selectedMaterial.artikelcode}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedMaterial.dikte_mm}mm thickness, {selectedMaterial.doekbreedte_mm}mm width
                </div>
                <div className="text-sm text-muted-foreground">
                  Color: {selectedMaterial.kleur}
                </div>
                {selectedMaterial.densiteit_g_cm3 && (
                  <div className="text-sm text-muted-foreground">
                    Density: {selectedMaterial.densiteit_g_cm3.toFixed(2)} g/cm³
                  </div>
                )}
                {selectedMaterial.prijs_per_m2_cents && (
                  <div className="font-medium text-primary">
                    {formatCentsEUR(BigInt(selectedMaterial.prijs_per_m2_cents))} per m²
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No material selected</div>
            )}
          </CardContent>
        </Card>

        {/* Shape & Dimensions Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Shape & Dimensions</CardTitle>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditStep(1)}
                data-testid="edit-shape"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditStep(2)}
                data-testid="edit-dimensions"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{getShapeDisplayName(selectedShape)}</div>
              <div className="text-sm text-muted-foreground">
                {formatDimensions(selectedShape, shapeDims)}
              </div>
              {area && (
                <div className="text-sm text-muted-foreground">
                  Area: {parseFloat(area).toLocaleString()} mm²
                </div>
              )}
              {perimeter && (
                <div className="text-sm text-muted-foreground">
                  Perimeter: {parseFloat(perimeter).toLocaleString()} mm
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Additional Options</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditStep(3)}
              data-testid="edit-options"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {selectedOptionDetails.length > 0 ? (
              <div className="space-y-2">
                {selectedOptionDetails.map(option => (
                  <div key={option.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                    <Badge variant="secondary">+ €{option.price.toFixed(2)}</Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Options Total:</span>
                    <span>€{totalOptionsPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No additional options selected
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WizardStepWrapper>
  );
}