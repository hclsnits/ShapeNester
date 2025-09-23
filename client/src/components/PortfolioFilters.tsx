import { useState, useMemo, useEffect } from 'react';
import { PortfolioRow, loadMaterialPortfolio, ParsedPortfolioData } from '@/lib/portfolio-parser';
import { formatCentsEUR } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PortfolioFiltersProps {
  selectedMaterial: PortfolioRow | null;
  onMaterialSelect: (material: PortfolioRow | null) => void;
}

export function PortfolioFilters({ selectedMaterial, onMaterialSelect }: PortfolioFiltersProps) {
  const [densiteitFilter, setDensiteitFilter] = useState<string>('');
  const [dikteFilter, setDikteFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');
  const [portfolioData, setPortfolioData] = useState<ParsedPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load portfolio data from Excel
  useEffect(() => {
    loadMaterialPortfolio()
      .then(data => {
        setPortfolioData(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load portfolio:', err);
        setError('Failed to load material portfolio');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredMaterials = useMemo(() => {
    if (!portfolioData) return [];
    
    return portfolioData.materials.filter((material: PortfolioRow) => {
      const densiteitMatch = !densiteitFilter || densiteitFilter === '__all__' || material.densiteit_g_cm3_key === densiteitFilter;
      const dikteMatch = !dikteFilter || dikteFilter === '__all__' || String(material.dikte_mm) === dikteFilter;
      const colorMatch = !colorFilter || colorFilter === '__all__' || material.kleur === colorFilter;
      return densiteitMatch && dikteMatch && colorMatch;
    });
  }, [portfolioData, densiteitFilter, dikteFilter, colorFilter]);

  // Cascading filter options based on current selections
  const availableDensiteits = useMemo(() => {
    return portfolioData?.densiteits || [];
  }, [portfolioData]);

  const availableDiktes = useMemo(() => {
    if (!portfolioData) return [];
    
    // If density is selected, only show thicknesses for that density
    if (densiteitFilter && densiteitFilter !== '__all__') {
      const validMaterials = portfolioData.materials.filter((material: PortfolioRow) => 
        material.densiteit_g_cm3_key === densiteitFilter
      );
      const diktes = new Set<string>();
      validMaterials.forEach(material => {
        if (material.dikte_mm != null) {
          diktes.add(String(material.dikte_mm));
        }
      });
      return Array.from(diktes).sort((a, b) => Number(a) - Number(b));
    }
    
    return portfolioData.diktes;
  }, [portfolioData, densiteitFilter]);

  const availableColors = useMemo(() => {
    if (!portfolioData) return [];
    
    // Filter colors based on selected density and thickness
    let validMaterials = portfolioData.materials;
    
    if (densiteitFilter && densiteitFilter !== '__all__') {
      validMaterials = validMaterials.filter((material: PortfolioRow) => 
        material.densiteit_g_cm3_key === densiteitFilter
      );
    }
    
    if (dikteFilter && dikteFilter !== '__all__') {
      validMaterials = validMaterials.filter((material: PortfolioRow) => 
        String(material.dikte_mm) === dikteFilter
      );
    }
    
    const colors = new Set<string>();
    validMaterials.forEach(material => {
      if (material.kleur) {
        colors.add(material.kleur);
      }
    });
    
    return Array.from(colors).sort();
  }, [portfolioData, densiteitFilter, dikteFilter]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="portfolio-filters">
        <h2 className="text-lg font-semibold text-foreground">Material Selection</h2>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading portfolio data...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4" data-testid="portfolio-filters">
        <h2 className="text-lg font-semibold text-foreground">Material Selection</h2>
        <div className="text-center py-8">
          <div className="text-destructive">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              {availableDensiteits.map((densiteit: string) => {
                const numericValue = parseFloat(densiteit);
                const displayValue = !isNaN(numericValue) ? `${densiteit} g/cm³` : densiteit;
                return (
                  <SelectItem key={densiteit} value={densiteit}>{displayValue}</SelectItem>
                );
              })}
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
              {availableDiktes.map((dikte: string) => (
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
              {availableColors.map((color: string) => (
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
            {filteredMaterials.map((material: PortfolioRow) => {
              if (!material.artikelcode) return null;
              
              const densityDisplay = () => {
                if (material.densiteit_g_cm3 == null) return 'N/A';
                return `${material.densiteit_g_cm3.toFixed(2)} g/cm³`;
              };
              
              return (
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
                        const mat = portfolioData?.materials.find((m: PortfolioRow) => m.artikelcode === value);
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
                        {material.doekbreedte_mm}mm width, {densityDisplay()}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="font-medium text-foreground">
                      {material.prijs_per_m2_cents ? formatCentsEUR(BigInt(material.prijs_per_m2_cents)) : 'N/A'}
                    </span>
                    <div className="text-xs text-muted-foreground">per m²</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
