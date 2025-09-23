import { useState, useMemo } from 'react';
import { Material, ShapeKind, ShapeDims, CartItem } from '@/types';
import { calculateArea } from '@/lib/geometry/area';
import { calculatePerimeter } from '@/lib/geometry/perimeter';
import { calculateNesting } from '@/lib/nesting';
import { calculateCosting } from '@/lib/costing';
import { formatCentsEUR, centsToEuros } from '@/lib/money';
import { availableOptions } from '@/components/Options';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingCartIcon } from 'lucide-react';

interface CostingPanelProps {
  material: Material | null;
  shape: ShapeKind;
  dims: ShapeDims;
  options: string[];
  onAddToCart: (item: CartItem) => void;
}

export function CostingPanel({ material, shape, dims, options, onAddToCart }: CostingPanelProps) {
  const [hourlyRate, setHourlyRate] = useState(40);
  const [cuttingSpeed, setCuttingSpeed] = useState(7);
  const [kotFee, setKotFee] = useState(5);
  const [quantity, setQuantity] = useState(20);
  const [spacing, setSpacing] = useState(5);
  const [kerf, setKerf] = useState(1.5);
  const [orientation, setOrientation] = useState<0 | 90>(0);
  
  const { toast } = useToast();

  const hasValidDims = Object.values(dims).some(v => v && parseInt(v) > 0);
  const canCalculate = material && hasValidDims;

  const calculations = useMemo(() => {
    if (!canCalculate) return null;

    const nesting = calculateNesting({
      shape,
      dims,
      quantity,
      sheetWidth: material.doekbreedte_mm,
      spacing: spacing.toString(),
      kerf: kerf.toString(),
      orientation
    });

    const perimeter = calculatePerimeter(shape, dims);
    const pricePerM2 = centsToEuros(material.prijs_per_m2_cents);
    
    const optionsCost = options.reduce((sum, optionId) => {
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

    return { nesting, costing, perimeter };
  }, [canCalculate, material, shape, dims, quantity, spacing, kerf, orientation, hourlyRate, cuttingSpeed, kotFee, options]);

  const handleAddToCart = () => {
    if (!canCalculate || !calculations) {
      toast({
        title: "Cannot Add to Cart",
        description: "Please select a material and enter valid dimensions.",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItem = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      material,
      shape,
      dims: { ...dims },
      amount: quantity,
      nesting: calculations.nesting,
      costing: calculations.costing
    };

    onAddToCart(cartItem);
  };

  const cuttingTimeMinutes = calculations 
    ? (Number(calculations.perimeter) * quantity / 10 / cuttingSpeed / 60)
    : 0;

  return (
    <div className="p-6 space-y-6" data-testid="costing-panel">
      <h2 className="text-lg font-semibold text-foreground">Cost Calculation</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Hourly Rate</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                className="pr-8"
                data-testid="input-hourly-rate"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                €/h
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Cut Speed</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={cuttingSpeed}
                onChange={(e) => setCuttingSpeed(parseFloat(e.target.value) || 0)}
                className="pr-12"
                data-testid="input-cutting-speed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                cm/s
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Order Setup Fee (KOT)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={kotFee}
              onChange={(e) => setKotFee(parseFloat(e.target.value) || 0)}
              className="pr-8"
              data-testid="input-kot-fee"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              €
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
        
        {calculations ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Material Cost:</span>
              <span className="font-medium text-foreground" data-testid="text-material-cost">
                {formatCentsEUR(BigInt(calculations.costing.material_cost_cents))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Work Time ({cuttingTimeMinutes.toFixed(1)} min):
              </span>
              <span className="font-medium text-foreground" data-testid="text-work-cost">
                {formatCentsEUR(BigInt(calculations.costing.work_cost_cents))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Additional Options:</span>
              <span className="font-medium text-foreground" data-testid="text-options-cost">
                {formatCentsEUR(BigInt(calculations.costing.options_cost_cents))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Setup Fee (KOT):</span>
              <span className="font-medium text-foreground" data-testid="text-kot-cost">
                {formatCentsEUR(BigInt(calculations.costing.kot_cents))}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-foreground">Total:</span>
                <span className="text-primary" data-testid="text-total-cost">
                  {formatCentsEUR(BigInt(calculations.costing.total_cents))}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Select material and enter dimensions to see cost breakdown
          </div>
        )}
      </div>

      <Button 
        onClick={handleAddToCart}
        disabled={!canCalculate}
        className="w-full"
        data-testid="button-add-to-cart"
      >
        <ShoppingCartIcon className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>
    </div>
  );
}
