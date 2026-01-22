import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { InventoryItem } from "@/pages/Inventory";
import { useBusiness } from "@/contexts/BusinessContext";
import { Plus, Minus } from "lucide-react";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  availableQuantity: number;
}

export const StockAdjustmentDialog = ({
  open,
  onOpenChange,
  item,
  availableQuantity,
}: StockAdjustmentDialogProps) => {
  const { formatCurrency } = useBusiness();
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const queryClient = useQueryClient();

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("No item selected");

      const adjustmentQty = parseFloat(quantity);
      if (isNaN(adjustmentQty) || adjustmentQty <= 0) {
        throw new Error("Invalid quantity");
      }

      const currentQty = item.quantity || 0;
      let newQty: number;

      if (adjustmentType === "add") {
        newQty = currentQty + adjustmentQty;
      } else {
        if (adjustmentQty > availableQuantity) {
          throw new Error("Cannot remove more than available quantity");
        }
        newQty = currentQty - adjustmentQty;
      }

      // Recalculate total cost based on unit cost
      const unitCost = item.unit_cost || 0;
      const newTotalCost = newQty * unitCost;

      const { error } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQty,
          total_cost: newTotalCost,
        })
        .eq("id", item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-total-costs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-usage"] });
      toast.success(
        adjustmentType === "add"
          ? "Stock added successfully"
          : "Stock removed successfully"
      );
      onOpenChange(false);
      setQuantity("");
      setAdjustmentType("add");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to adjust stock");
    },
  });

  const adjustmentQty = parseFloat(quantity) || 0;
  const currentQty = item?.quantity || 0;
  const newQty =
    adjustmentType === "add"
      ? currentQty + adjustmentQty
      : currentQty - adjustmentQty;

  const unitCost = item?.unit_cost || 0;
  const newTotalCost = newQty * unitCost;

  const isRemoveValid =
    adjustmentType === "remove" ? adjustmentQty <= availableQuantity : true;
  const isValid = adjustmentQty > 0 && isRemoveValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {item?.name} - Current quantity: {currentQty}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={adjustmentType}
            onValueChange={(v) => setAdjustmentType(v as "add" | "remove")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add" className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4 text-green-600" />
                Add Stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remove" id="remove" />
              <Label htmlFor="remove" className="flex items-center gap-2 cursor-pointer">
                <Minus className="h-4 w-4 text-destructive" />
                Remove Stock
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
            {adjustmentType === "remove" && (
              <p className="text-xs text-muted-foreground">
                Available to remove: {availableQuantity.toFixed(1)}
              </p>
            )}
          </div>

          {adjustmentQty > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Quantity:</span>
                <span>{currentQty.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {adjustmentType === "add" ? "Adding:" : "Removing:"}
                </span>
                <span
                  className={
                    adjustmentType === "add" ? "text-green-600" : "text-destructive"
                  }
                >
                  {adjustmentType === "add" ? "+" : "-"}
                  {adjustmentQty.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>New Quantity:</span>
                <span>{newQty.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Total Cost:</span>
                <span>{formatCurrency(newTotalCost)}</span>
              </div>
            </div>
          )}

          {!isRemoveValid && (
            <p className="text-sm text-destructive">
              Cannot remove more than available quantity ({availableQuantity.toFixed(1)})
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => adjustMutation.mutate()}
            disabled={!isValid || adjustMutation.isPending}
          >
            {adjustMutation.isPending ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
