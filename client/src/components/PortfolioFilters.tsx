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
  const [densiteitFilter, setDensiteitFilter] = useState<string>('');
  const [dikteFilter, setDikteFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const densiteitMatch = !densiteitFilter || densiteitFilter === '__all__' || String(material.densiteit_kg_m3.i) === densiteitFilter;
      const dikteMatch = !dikteFilter || dikteFilter === '__all__' || String(material.dikte_mm) === dikteFilter;
      const colorMatch = !colorFilter || colorFilter === '__all__' || material.kleur.toLowerCase().includes(colorFilter.toLowerCase());
      return densiteitMatch && dikteMatch && colorMatch;
    });
  }, [densiteitFilter, dikteFilter, colorFilter]);

  const uniqueDensiteits = useMemo(() => {
    return Array.from(new Set(materials.map(m => String(m.densiteit_kg_m3.i)))).sort((a, b) => Number(a) - Number(b));
  }, []);

  const uniqueDiktes = useMemo(() => {
    return Array.from(new Set(materials.map(m => String(m.dikte_mm)))).sort((a, b) => Number(a) - Number(b));
  }, []);

  const uniqueColors = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.kleur)));
  }, []);

  return (
    <div className="space-y-4" data-testid="portfolio-filters">
      <h2 className="text-lg font-semibold text-foreground">Material Selection</h2>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-medium">Densiteit</Label>
          <Select value={densiteitFilter} onValueChange={setDensiteitFilter}>
            <SelectTrigger data-testid="select-densiteit">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle</SelectItem>
              {uniqueDensiteits.map(densiteit => (
                <SelectItem key={densiteit} value={densiteit}>{densiteit} kg/m³</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Dikte</Label>
          <Select value={dikteFilter} onValueChange={setDikteFilter}>
            <SelectTrigger data-testid="select-dikte">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle</SelectItem>
              {uniqueDiktes.map(dikte => (
                <SelectItem key={dikte} value={dikte}>{dikte}mm</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Kleur</Label>
          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger data-testid="select-kleur">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle</SelectItem>
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
