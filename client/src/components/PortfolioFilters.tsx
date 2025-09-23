import { useState, useMemo } from 'react';
import { Material } from '@/types';
import materials from '@/data/materials.json';
import { formatCentsEUR } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PortfolioFiltersProps {
  selectedMaterial: Material | null;
  onMaterialSelect: (material: Material | null) => void;
}

export function PortfolioFilters({ selectedMaterial, onMaterialSelect }: PortfolioFiltersProps) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const typeMatch = !typeFilter || material.materiaalsoort.toLowerCase().includes(typeFilter.toLowerCase());
      const colorMatch = !colorFilter || material.kleur.toLowerCase().includes(colorFilter.toLowerCase());
      return typeMatch && colorMatch;
    });
  }, [typeFilter, colorFilter]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.materiaalsoort)));
  }, []);

  const uniqueColors = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.kleur)));
  }, []);

  return (
    <div className="space-y-4" data-testid="portfolio-filters">
      <h2 className="text-lg font-semibold text-foreground">Material Selection</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Material Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger data-testid="select-material-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Color</Label>
          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger data-testid="select-color">
              <SelectValue placeholder="All Colors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Colors</SelectItem>
              {uniqueColors.map(color => (
                <SelectItem key={color} value={color}>{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Select
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Material
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr
                key={material.artikelcode}
                className={`border-b border-border hover:bg-muted/50 cursor-pointer ${
                  selectedMaterial?.artikelcode === material.artikelcode ? 'bg-accent/50' : ''
                }`}
                onClick={() => onMaterialSelect(material)}
                data-testid={`row-material-${material.artikelcode}`}
              >
                <td className="p-4 align-middle">
                  <RadioGroup
                    value={selectedMaterial?.artikelcode || ''}
                    onValueChange={(value) => {
                      const mat = materials.find(m => m.artikelcode === value);
                      onMaterialSelect(mat || null);
                    }}
                  >
                    <RadioGroupItem 
                      value={material.artikelcode}
                      data-testid={`radio-material-${material.artikelcode}`}
                    />
                  </RadioGroup>
                </td>
                <td className="p-4 align-middle">
                  <div>
                    <div className="font-medium text-foreground">
                      {material.artikelcode}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {material.materiaalsoort}, {material.kleur}, {material.dikte_mm}mm
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {material.doekbreedte_mm}mm width, {material.densiteit_kg_m3.i} kg/m³
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <span className="font-medium text-foreground">
                    {formatCentsEUR(BigInt(material.prijs_per_m2_cents))}
                  </span>
                  <div className="text-xs text-muted-foreground">per m²</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
