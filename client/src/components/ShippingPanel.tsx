import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ShippingOption {
  id: string;
  label: string;
  description: string;
  price: number;
}

const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    description: '5-7 business days',
    price: 12.50
  },
  {
    id: 'express',
    label: 'Express Delivery', 
    description: '2-3 business days',
    price: 24.90
  },
  {
    id: 'pickup',
    label: 'Pickup',
    description: 'Collect in person',
    price: 0
  }
];

export function ShippingPanel() {
  const [selectedShipping, setSelectedShipping] = useState('standard');

  return (
    <div className="border-t border-border p-6" data-testid="shipping-panel">
      <h3 className="text-sm font-semibold text-foreground mb-3">Shipping Options</h3>
      
      <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping} className="space-y-3">
        {shippingOptions.map(option => (
          <Label
            key={option.id}
            className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-input hover:bg-accent/50 transition-colors"
            htmlFor={option.id}
            data-testid={`shipping-option-${option.id}`}
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value={option.id} id={option.id} />
              <div>
                <div className="text-sm font-medium text-foreground">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">
              {option.price === 0 ? 'Free' : `€ ${option.price.toFixed(2)}`}
            </span>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
