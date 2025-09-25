import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Option {
  id: string;
  label: string;
  description: string;
  price: number; // euros
}

const availableOptions: Option[] = [
  {
    id: "self-adhesive",
    label: "Self-adhesive tape",
    description: "apply double-sided self-adhesive tape",
    price: 10.0,
  },
  {
    id: "labeling",
    label: "Part Labeling",
    description: "Label each piece",
    price: 1.75,
  },
  {
    id: "quality_control",
    label: "Quality Control",
    description: "Inspect all pieces",
    price: 5.0,
  },
];

interface OptionsProps {
  selectedOptions: string[];
  onOptionsChange: (options: string[]) => void;
}

export function Options({ selectedOptions, onOptionsChange }: OptionsProps) {
  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      onOptionsChange([...selectedOptions, optionId]);
    } else {
      onOptionsChange(selectedOptions.filter((id) => id !== optionId));
    }
  };

  return (
    <div className="space-y-4" data-testid="options">
      <h2 className="text-lg font-semibold text-foreground">
        Step 4 — Additional options
      </h2>

      <div className="space-y-3">
        {availableOptions.map((option) => (
          <Label
            key={option.id}
            className="flex items-center justify-between cursor-pointer"
            htmlFor={option.id}
            data-testid={`option-${option.id}`}
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={(checked) =>
                  handleOptionChange(option.id, !!checked)
                }
              />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">
              + € {option.price.toFixed(2)}
            </span>
          </Label>
        ))}
      </div>
    </div>
  );
}

export { availableOptions };
