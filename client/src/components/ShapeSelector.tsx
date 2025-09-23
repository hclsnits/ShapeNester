import { ShapeKind } from '@/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Square, Circle, Triangle, Hexagon, CircleDot } from 'lucide-react';

const EllipseIcon = (props: any) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <ellipse cx="12" cy="12" rx="9" ry="6" />
  </svg>
);

interface ShapeSelectorProps {
  selectedShape: ShapeKind;
  onShapeSelect: (shape: ShapeKind) => void;
}

const shapeOptions: { value: ShapeKind; label: string; icon: any }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: Square },
  { value: 'circle', label: 'Circle', icon: Circle },
  { value: 'triangle', label: 'Triangle', icon: Triangle },
  { value: 'hexagon_flat', label: 'Hexagon', icon: Hexagon },
  { value: 'ring', label: 'Ring', icon: CircleDot },
  { value: 'oval', label: 'Oval', icon: EllipseIcon },
];

export function ShapeSelector({ selectedShape, onShapeSelect }: ShapeSelectorProps) {
  return (
    <div className="space-y-4" data-testid="shape-selector">
      <h2 className="text-lg font-semibold text-foreground">Shape Selection</h2>
      
      <RadioGroup
        value={selectedShape}
        onValueChange={(value) => onShapeSelect(value as ShapeKind)}
        className="grid grid-cols-2 gap-3"
      >
        {shapeOptions.map(({ value, label, icon: Icon }) => (
          <Label
            key={value}
            htmlFor={value}
            className="relative cursor-pointer"
            data-testid={`shape-option-${value}`}
          >
            <RadioGroupItem
              value={value}
              id={value}
              className="sr-only peer"
            />
            <div className={`rounded-lg border-2 p-4 text-center transition-colors hover:border-primary/50 ${
              selectedShape === value 
                ? 'border-primary bg-primary/5' 
                : 'border-border'
            }`}>
              <Icon className={`mx-auto mb-2 h-6 w-6 ${
                selectedShape === value ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="text-sm font-medium text-foreground">{label}</div>
            </div>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
