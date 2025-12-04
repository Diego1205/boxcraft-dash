import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

interface ProductComponentsSelectorProps {
  selectedComponents: Array<{ item_id: string; quantity: number }>;
  onComponentsChange: (components: Array<{ item_id: string; quantity: number }>) => void;
}

export const ProductComponentsSelector = ({
  selectedComponents,
  onComponentsChange,
}: ProductComponentsSelectorProps) => {
  const { business, formatCurrency } = useBusiness();
  
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items", business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("business_id", business!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id,
  });

  const addComponent = () => {
    onComponentsChange([...selectedComponents, { item_id: "", quantity: 1 }]);
  };

  const removeComponent = (index: number) => {
    onComponentsChange(selectedComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: "item_id" | "quantity", value: string | number) => {
    const updated = [...selectedComponents];
    updated[index] = { ...updated[index], [field]: value };
    onComponentsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Components</Label>
        <Button type="button" variant="outline" size="sm" onClick={addComponent} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Component
        </Button>
      </div>

      {selectedComponents.map((component, index) => (
        <div key={index} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label>Item</Label>
            <Select
              value={component.item_id}
              onValueChange={(value) => updateComponent(index, "item_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.unit_cost || 0)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24 space-y-2">
            <Label>Qty</Label>
            <Input
              type="number"
              min="1"
              value={component.quantity}
              onChange={(e) => updateComponent(index, "quantity", parseFloat(e.target.value))}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => removeComponent(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {selectedComponents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No components added yet. Click "Add Component" to get started.
        </p>
      )}
    </div>
  );
};