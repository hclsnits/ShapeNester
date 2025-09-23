import { useState, useEffect } from 'react';
import { PortfolioFilters } from '@/components/PortfolioFilters';
import { ShapeSelector } from '@/components/ShapeSelector';
import { ShapeDims } from '@/components/ShapeDims';
import { Options } from '@/components/Options';
import { NestingPreview } from '@/components/NestingPreview';
import { CostingPanel } from '@/components/CostingPanel';
import { CartDrawer } from '@/components/CartDrawer';
import { ShippingPanel } from '@/components/ShippingPanel';
import { Material, ShapeKind, ShapeDims as ShapeDimsType, CartItem } from '@/types';
import { PortfolioRow } from '@/lib/portfolio-parser';
import { portfolioRowToMaterial, materialToPortfolioRow } from '@/lib/material-converter';
import { loadCart, addToCart } from '@/lib/cartStorage';
import { exportCartToPDF } from '@/lib/pdf';
import { exportCartToXLSX } from '@/lib/xlsx';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { FileText, FileSpreadsheet, ShoppingCart } from 'lucide-react';

function App() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedShape, setSelectedShape] = useState<ShapeKind>('rectangle');
  const [shapeDims, setShapeDims] = useState<ShapeDimsType>({});
  const [options, setOptions] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const { toast } = useToast();

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    const updatedCart = loadCart();
    setCartItems(updatedCart);
    toast({
      title: "Added to Cart",
      description: `${item.shape} (${item.amount} pieces) added successfully.`,
    });
  };

  const handleLoadItemInDesigner = (item: CartItem) => {
    setSelectedMaterial(item.material);
    setSelectedShape(item.shape);
    setShapeDims(item.dims);
    setIsCartOpen(false);
    toast({
      title: "Item Loaded",
      description: "Item configuration loaded in designer.",
    });
  };

  const handleExportPDF = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await exportCartToPDF(cartItems);
      toast({
        title: "PDF Exported",
        description: "Quote exported successfully as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportXLSX = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportCartToXLSX(cartItems);
      toast({
        title: "XLSX Exported",
        description: "Quote exported successfully as spreadsheet.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export XLSX. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground" data-testid="app-title">
              Snijtool v2
            </h1>
            <span className="text-sm text-muted-foreground">
              Material Cutting Calculator
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportXLSX}
              data-testid="button-export-xlsx"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
            <Button 
              onClick={() => setIsCartOpen(true)}
              data-testid="button-cart"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart 
              {cartItems.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-foreground text-primary px-2 py-0.5 text-xs font-bold">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 border-r border-border bg-card overflow-y-auto">
          <div className="p-6 space-y-6">
            <PortfolioFilters 
              selectedMaterial={selectedMaterial}
              onMaterialSelect={setSelectedMaterial}
            />
            
            <ShapeSelector 
              selectedShape={selectedShape}
              onShapeSelect={setSelectedShape}
            />
            
            <ShapeDims 
              shape={selectedShape}
              dims={shapeDims}
              onDimsChange={setShapeDims}
            />
            
            <Options 
              selectedOptions={options}
              onOptionsChange={setOptions}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-6">
            <NestingPreview 
              shape={selectedShape}
              dims={shapeDims}
              material={selectedMaterial}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          <CostingPanel 
            material={selectedMaterial}
            shape={selectedShape}
            dims={shapeDims}
            options={options}
            onAddToCart={handleAddToCart}
          />
          <ShippingPanel 
            selectedShipping={selectedShipping}
            onShippingChange={setSelectedShipping}
          />
        </div>
      </div>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onItemsChange={setCartItems}
        onLoadItem={handleLoadItemInDesigner}
        selectedShipping={selectedShipping}
      />
    </div>
  );
}

export default App;
