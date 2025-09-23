import { CartItem } from '@/types';
import { formatCentsEUR } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
  onLoadInDesigner: (item: CartItem) => void;
}

export function CartItemComponent({ item, onRemove, onLoadInDesigner }: CartItemProps) {
  const getDimensionsText = () => {
    switch (item.shape) {
      case 'rectangle':
        return `${item.dims.width}×${item.dims.height}mm`;
      case 'circle':
        return `Ø${item.dims.diameter}mm`;
      case 'triangle':
        return `${item.dims.side_a}×${item.dims.side_b}×${item.dims.side_c}mm`;
      case 'hexagon_flat':
        return `F2F: ${item.dims.flat_to_flat}mm`;
      case 'ring':
        return `OD:${item.dims.outer_diameter}mm ID:${item.dims.inner_diameter}mm`;
      case 'oval':
        return `${item.dims.major_axis}×${item.dims.minor_axis}mm`;
      case 'oval_ring':
        return `O:${item.dims.outer_major}×${item.dims.outer_minor}mm I:${item.dims.inner_major}×${item.dims.inner_minor}mm`;
      default:
        return '';
    }
  };

  return (
    <div 
      className="rounded-lg border border-border p-4 bg-accent/30" 
      data-testid={`cart-item-${item.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-foreground">
            {item.shape.charAt(0).toUpperCase() + item.shape.slice(1).replace('_', ' ')} - {item.material.artikelcode}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.material.materiaalsoort}, {item.material.kleur}, {item.material.dikte_mm}mm
          </div>
          <div className="text-sm text-muted-foreground">
            {getDimensionsText()}, Qty: {item.amount}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
          data-testid={`button-remove-${item.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          size="sm"
          onClick={() => onLoadInDesigner(item)}
          className="p-0 h-auto text-primary hover:text-primary/80"
          data-testid={`button-load-${item.id}`}
        >
          Load in designer
        </Button>
        <span className="font-semibold text-foreground" data-testid={`text-item-total-${item.id}`}>
          {formatCentsEUR(BigInt(item.costing.total_cents))}
        </span>
      </div>
    </div>
  );
}
