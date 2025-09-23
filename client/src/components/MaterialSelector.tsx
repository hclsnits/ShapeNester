import { useState, useEffect } from 'react';
import { Material } from '@/types';
import { MaterialData, MaterialFilters, loadMaterialPortfolio } from '@/lib/excel-parser';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';

interface MaterialSelectorProps {
  selectedMaterial: Material | null;
  onMaterialSelect: (material: Material) => void;
}

export function MaterialSelector({ selectedMaterial, onMaterialSelect }: MaterialSelectorProps) {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [filters, setFilters] = useState<MaterialFilters>({ densiteit: [], dikte: [], kleur: [] });
  const [selectedDensiteit, setSelectedDensiteit] = useState<string>('');
  const [selectedDikte, setSelectedDikte] = useState<string>('');
  const [selectedKleur, setSelectedKleur] = useState<string>('');
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMaterialPortfolio()
      .then(({ materials, filters }) => {
        setMaterials(materials);
        setFilters(filters);
        setFilteredMaterials(materials);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        // Fallback to existing hardcoded materials if Excel fails
        setFilteredMaterials([]);
      });
  }, []);

  useEffect(() => {
    // Filter materials based on selected filters
    let filtered = materials;

    if (selectedDensiteit) {
      filtered = filtered.filter(m => m.densiteit === selectedDensiteit);
    }
    if (selectedDikte) {
      filtered = filtered.filter(m => m.dikte === selectedDikte);
    }
    if (selectedKleur) {
      filtered = filtered.filter(m => m.kleur === selectedKleur);
    }

    setFilteredMaterials(filtered);
  }, [materials, selectedDensiteit, selectedDikte, selectedKleur]);

  const handleMaterialSelect = (materialData: MaterialData) => {
    // Convert MaterialData to Material format for existing app
    const material: Material = {
      artikelcode: materialData.code,
      materiaalsoort: materialData.description || materialData.code,
      dikte_mm: materialData.dikte,
      densiteit_kg_m3: { i: String(parseFloat(materialData.densiteit?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') * 100), scale: 2 },
      doekbreedte_mm: '1000', // Default width, could be extracted from Excel if available
      kleur: materialData.kleur || '',
      prijs_per_m2_cents: String(Math.round(materialData.pricePerM2 * 100))
    };
    onMaterialSelect(material);
  };

  const clearFilters = () => {
    setSelectedDensiteit('');
    setSelectedDikte('');
    setSelectedKleur('');
  };

  if (loading) {
    return (
      <div className="space-y-4" data-testid="material-selector">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading material portfolio...</span>
        </div>
      </div>
    );
  }

  if (error && materials.length === 0) {
    return (
      <div className="space-y-4" data-testid="material-selector">
        <div className="text-center p-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-red-500 mb-2">Error loading material portfolio: {error}</p>
          <p className="text-muted-foreground">Using fallback material data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="material-selector">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Material Selection</h2>
        {(selectedDensiteit || selectedDikte || selectedKleur) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            data-testid="clear-filters"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="densiteit-select">Densiteit (Density)</Label>
          <Select value={selectedDensiteit} onValueChange={setSelectedDensiteit}>
            <SelectTrigger id="densiteit-select" data-testid="densiteit-select">
              <SelectValue placeholder="Select density..." />
            </SelectTrigger>
            <SelectContent>
              {filters.densiteit.map((density) => (
                <SelectItem key={density} value={density} data-testid={`densiteit-option-${density}`}>
                  {density}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dikte-select">Dikte (Thickness)</Label>
          <Select value={selectedDikte} onValueChange={setSelectedDikte}>
            <SelectTrigger id="dikte-select" data-testid="dikte-select">
              <SelectValue placeholder="Select thickness..." />
            </SelectTrigger>
            <SelectContent>
              {filters.dikte.map((thickness) => (
                <SelectItem key={thickness} value={thickness} data-testid={`dikte-option-${thickness}`}>
                  {thickness}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kleur-select">Kleur (Color)</Label>
          <Select value={selectedKleur} onValueChange={setSelectedKleur}>
            <SelectTrigger id="kleur-select" data-testid="kleur-select">
              <SelectValue placeholder="Select color..." />
            </SelectTrigger>
            <SelectContent>
              {filters.kleur.map((color) => (
                <SelectItem key={color} value={color} data-testid={`kleur-option-${color}`}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{filteredMaterials.length} materials found</span>
        {(selectedDensiteit || selectedDikte || selectedKleur) && (
          <>
            <span>•</span>
            <div className="flex gap-2">
              {selectedDensiteit && <Badge variant="secondary" data-testid="active-densiteit-filter">{selectedDensiteit}</Badge>}
              {selectedDikte && <Badge variant="secondary" data-testid="active-dikte-filter">{selectedDikte}</Badge>}
              {selectedKleur && <Badge variant="secondary" data-testid="active-kleur-filter">{selectedKleur}</Badge>}
            </div>
          </>
        )}
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((material) => (
            <Card
              key={material.code}
              className={`cursor-pointer transition-colors hover:border-primary/50 ${
                selectedMaterial?.artikelcode === material.code ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleMaterialSelect(material)}
              data-testid={`material-card-${material.code}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{material.code}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {material.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Densiteit:</span>
                    <span>{material.densiteit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dikte:</span>
                    <span>{material.dikte}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kleur:</span>
                    <span>{material.kleur}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Price:</span>
                    <span>€{material.pricePerM2.toFixed(2)}/m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>No materials found matching the selected filters.</p>
            {(selectedDensiteit || selectedDikte || selectedKleur) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
                data-testid="no-results-clear-filters"
              >
                Clear Filters to Show All Materials
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}