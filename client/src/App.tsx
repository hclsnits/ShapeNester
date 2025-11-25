import { useState, useEffect } from "react";
import { PortfolioFilters } from "@/components/PortfolioFilters";
import { ShapeSelector } from "@/components/ShapeSelector";
import { ShapeDims } from "@/components/ShapeDims";
import { Options } from "@/components/Options";
import { NestingPreview } from "@/components/NestingPreview";
import { CostingPanel } from "@/components/CostingPanel";
import { CartDrawer } from "@/components/CartDrawer";
import { ShippingPanel } from "@/components/ShippingPanel";
import { ConfigurationWizard } from "@/components/wizard/ConfigurationWizard";
import ConfiguredShapesPanel from "@/components/ConfiguredShapesPanel";
import {
  Material,
  ShapeKind,
  ShapeDims as ShapeDimsType,
  CartItem,
} from "@/types";
import { PortfolioRow } from "@/lib/portfolio-parser";
import {
  portfolioRowToMaterial,
  materialToPortfolioRow,
} from "@/lib/material-converter";
import { loadCart, addToCart } from "@/lib/cartStorage";
import { exportCartToPDF } from "@/lib/pdf";
import { exportCartToXLSX } from "@/lib/xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DxfExportOptions } from "@/lib/dxf";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import {
  FileText,
  FileSpreadsheet,
  ShoppingCart,
  Settings,
  Zap,
} from "lucide-react";

function App() {
  const [selectedMaterial, setSelectedMaterial] = useState<PortfolioRow | null>(
    null,
  );
  const [selectedShape, setSelectedShape] = useState<ShapeKind>("rectangle");
  const [shapeDims, setShapeDims] = useState<ShapeDimsType>({});
  const [options, setOptions] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [isWizardMode, setIsWizardMode] = useState(true);
  const [configuredShapes, setConfiguredShapes] = useState<CartItem[]>([]);
  const [dxfSettings, setDxfSettings] = useState<DxfExportOptions>({ segments: 64, normalize: true, align: "bbox_origin" });
  const [dxfDialogOpen, setDxfDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  // load persisted DXF settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dxfSettings");
      if (raw) {
        const parsed = JSON.parse(raw) as DxfExportOptions;
        setDxfSettings((s) => ({ ...s, ...parsed }));
      }
    } catch (e) {
      // ignore parse errors
    }
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
    setSelectedMaterial(materialToPortfolioRow(item.material));
    setSelectedShape(item.shape);
    setShapeDims(item.dims);
    setIsCartOpen(false);
    toast({
      title: "Item Loaded",
      description: "Item configuration loaded in designer.",
    });
  };

  const handleAddConfiguredShape = (item: CartItem) => {
    setConfiguredShapes((s) => [item, ...s]);
    toast({ title: "Shape added", description: "Configuration saved to the basket." });
  };

  const handleRemoveConfiguredShape = (id: string) => {
    setConfiguredShapes((s) => s.filter((x) => x.id !== id));
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
            <h1
              className="text-2xl font-bold text-foreground"
              data-testid="app-title"
            >
              Eurofelt configurator
            </h1>
            <span className="text-sm text-muted-foreground">
              Design your own felt products
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant={isWizardMode ? "outline" : "default"}
              onClick={() => setIsWizardMode(!isWizardMode)}
              data-testid="button-toggle-mode"
            >
              {isWizardMode ? (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Advanced Mode
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Wizard Mode
                </>
              )}
            </Button>
            <Dialog open={dxfDialogOpen} onOpenChange={setDxfDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Instellingen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>DXF instellingen</DialogTitle>
                  <DialogDescription>Kies curve-approximatie en uitlijning voor DXF exports.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label>Curve segments</Label>
                    <Input type="number" value={dxfSettings.segments} onChange={(e) => setDxfSettings(s => ({ ...s, segments: Number(e.target.value) }))} />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label>Normalize coordinates</Label>
                    <Switch checked={!!dxfSettings.normalize} onCheckedChange={(v) => setDxfSettings(s => ({ ...s, normalize: !!v }))} />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label>Alignment</Label>
                    <div className="text-sm text-muted-foreground">{dxfSettings.align}</div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => {
                    try {
                      localStorage.setItem("dxfSettings", JSON.stringify(dxfSettings));
                    } catch (e) {}
                    setDxfDialogOpen(false);
                  }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

      {isWizardMode ? (
        /* Wizard Mode */
        <div className="flex-1 overflow-y-auto bg-background">
          <ConfigurationWizard
            selectedMaterial={selectedMaterial}
            selectedShape={selectedShape}
            shapeDims={shapeDims}
            selectedOptions={options}
            onMaterialSelect={setSelectedMaterial}
            onShapeSelect={setSelectedShape}
            onDimsChange={setShapeDims}
            onOptionsChange={setOptions}
            onAddToCart={handleAddToCart}
          />
        </div>
      ) : (
        /* Advanced Mode - 5 Column Layout */
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Material Selection (1/5) */}
          <div className="flex flex-col border-r border-border bg-card overflow-y-auto" style={{ width: "20%" }}>
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 1 — Material selection</h3>
              <PortfolioFilters
                selectedMaterial={selectedMaterial}
                onMaterialSelect={setSelectedMaterial}
              />
            </div>
          </div>

          {/* Column 2: Shape Selection & Dimensions (1/5) */}
          <div className="flex flex-col border-r border-border bg-card overflow-y-auto" style={{ width: "20%" }}>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 2 — Shape selection</h3>
                <ShapeSelector
                  selectedShape={selectedShape}
                  onShapeSelect={setSelectedShape}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 3 — Shape dimensions</h3>
                <ShapeDims
                  shape={selectedShape}
                  dims={shapeDims}
                  onDimsChange={setShapeDims}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Step 4 — Additional options</h3>
                <Options selectedOptions={options} onOptionsChange={setOptions} />
              </div>
            </div>
          </div>

          {/* Column 3 & 4: Shape & Nesting Preview (2/5) */}
          <div className="flex flex-col border-r border-border bg-card overflow-hidden" style={{ width: "40%" }}>
            <div className="p-6 overflow-y-auto h-full">
              <NestingPreview
                shape={selectedShape}
                dims={shapeDims}
                material={
                  selectedMaterial
                    ? portfolioRowToMaterial(selectedMaterial)
                    : null
                }
                options={options}
                onAddConfiguredShape={handleAddConfiguredShape}
                configuredItems={configuredShapes}
              />
            </div>
          </div>

          {/* Column 5: Configured Shapes Basket (1/5) */}
          <div className="flex flex-col border-l border-border bg-card overflow-y-auto" style={{ width: "20%" }}>
            <div className="p-6 h-full">
              <ConfiguredShapesPanel
                items={configuredShapes}
                onLoad={(it) => {
                  handleLoadItemInDesigner(it);
                }}
                onRemove={handleRemoveConfiguredShape}
                dxfOptions={dxfSettings}
              />
            </div>
          </div>
        </div>
      )}

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
