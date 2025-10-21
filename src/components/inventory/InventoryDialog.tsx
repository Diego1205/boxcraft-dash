import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InventoryItem } from "@/pages/Inventory";
import { Upload } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: InventoryItem | null;
}

export const InventoryDialog = ({ open, onOpenChange, editingItem }: InventoryDialogProps) => {
  const { business, formatCurrency } = useBusiness();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setQuantity(editingItem.quantity.toString());
      setUnitCost(editingItem.unit_cost?.toString() || "");
      setTotalCost(editingItem.total_cost?.toString() || "");
      setImagePreview(editingItem.image_url);
    } else {
      setName("");
      setQuantity("");
      setUnitCost("");
      setTotalCost("");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editingItem, open]);

  // Auto-calculate based on which field was just changed
  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const qty = parseFloat(value) || 0;
    const unit = parseFloat(unitCost) || 0;
    if (qty && unit) {
      setTotalCost((qty * unit).toFixed(2));
    }
  };

  const handleUnitCostChange = (value: string) => {
    setUnitCost(value);
    const qty = parseFloat(quantity) || 0;
    const unit = parseFloat(value) || 0;
    if (qty && unit) {
      setTotalCost((qty * unit).toFixed(2));
    }
  };

  const handleTotalCostChange = (value: string) => {
    setTotalCost(value);
    const qty = parseFloat(quantity) || 0;
    const total = parseFloat(value) || 0;
    if (qty > 0 && total) {
      setUnitCost((total / qty).toFixed(2));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = editingItem?.image_url || null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("inventory-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("inventory-images")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const itemData = {
        name,
        quantity: parseFloat(quantity) || 0,
        unit_cost: unitCost ? parseFloat(unitCost) : null,
        total_cost: totalCost ? parseFloat(totalCost) : null,
        image_url: imageUrl,
        business_id: business?.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("inventory_items")
          .update(itemData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("inventory_items")
          .insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success(editingItem ? "Item updated" : "Item added");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save item");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hotwheels Car"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost ({business?.currency_symbol || '$'})</Label>
            <Input
              id="unitCost"
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => handleUnitCostChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalCost">Total Cost ({business?.currency_symbol || '$'})</Label>
            <Input
              id="totalCost"
              type="number"
              step="0.01"
              value={totalCost}
              onChange={(e) => handleTotalCostChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!name || !quantity}>
            {editingItem ? "Update" : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};