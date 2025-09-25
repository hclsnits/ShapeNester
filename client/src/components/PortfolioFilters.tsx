import { useState, useMemo, useEffect } from 'react';
import { PortfolioRow, loadMaterialPortfolio, ParsedPortfolioData } from '@/lib/portfolio-parser';
import { formatCentsEUR } from '@/lib/money';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PortfolioSummary } from '@/components/PortfolioSummary';

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

  // Auto-select material when filters result in exactly one match
  useEffect(() => {
    if (filteredMaterials.length === 1) {
      onMaterialSelect(filteredMaterials[0]);
    } else if (filteredMaterials.length === 0 && selectedMaterial) {
      onMaterialSelect(null);
    }
  }, [filteredMaterials, onMaterialSelect, selectedMaterial]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="portfolio-filters">
        <h2 className="text-lg font-semibold text-foreground">Step 1 — Material selection</h2>
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
        <h2 className="text-lg font-semibold text-foreground">Step 1 — Material selection</h2>
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
    <div className="space-y-6" data-testid="portfolio-filters">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Step 1 — Material selection</h2>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Density (g/cm³)</Label>
            <Select value={densiteitFilter} onValueChange={setDensiteitFilter}>
              <SelectTrigger data-testid="select-densiteit">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                {availableDensiteits.map((densiteit: string) => {
                  const numericValue = parseFloat(densiteit);
                  const displayValue = !isNaN(numericValue) ? `${densiteit}` : densiteit;
                  return (
                    <SelectItem key={densiteit} value={densiteit}>{displayValue}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Thickness (mm)</Label>
            <Select value={dikteFilter} onValueChange={setDikteFilter}>
              <SelectTrigger data-testid="select-dikte">
                <SelectValue placeholder="Select thickness" />
              </SelectTrigger>
              <SelectContent>
                {availableDiktes.map((dikte: string) => (
                  <SelectItem key={dikte} value={dikte}>{dikte}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Color</Label>
            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger data-testid="select-kleur">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map((color: string) => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredMaterials.length > 1 && (
          <div className="mt-4 flex items-center text-sm text-orange-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Multiple matches - refine filters
          </div>
        )}
        
        {filteredMaterials.length === 1 && selectedMaterial && (
          <div className="mt-4 flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Exactly 1 article selected
          </div>
        )}
      </div>

      <PortfolioSummary row={selectedMaterial} />
    </div>
  );
}
