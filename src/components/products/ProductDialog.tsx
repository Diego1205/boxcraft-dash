import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Product } from "@/pages/Products";
import { ProductComponentsSelector } from "./ProductComponentsSelector";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200, "Product name must be less than 200 characters"),
  quantityAvailable: z.number().int().min(0, "Quantity must be 0 or greater").max(100000, "Quantity must be less than 100000"),
  profitMargin: z.number().min(0, "Profit margin must be 0 or greater").max(1000, "Profit margin must be less than 1000%"),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
}

export const ProductDialog = ({ open, onOpenChange, editingProduct }: ProductDialogProps) => {
  const [name, setName] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [profitMargin, setProfitMargin] = useState("20");
  const [selectedComponents, setSelectedComponents] = useState<Array<{ item_id: string; quantity: number }>>([]);
  const queryClient = useQueryClient();

  const { data: existingComponents } = useQuery({
    queryKey: ["product-components", editingProduct?.id],
    enabled: !!editingProduct?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_components")
        .select("inventory_item_id, quantity")
        .eq("product_id", editingProduct!.id);
      
      if (error) throw error;
      return data.map(c => ({ item_id: c.inventory_item_id, quantity: c.quantity }));
    },
  });

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setQuantityAvailable(editingProduct.quantity_available.toString());
      setProfitMargin(editingProduct.profit_margin.toString());
    } else {
      setName("");
      setQuantityAvailable("0");
      setProfitMargin("20");
      setSelectedComponents([]);
    }
  }, [editingProduct, open]);

  useEffect(() => {
    if (existingComponents) {
      setSelectedComponents(existingComponents);
    }
  }, [existingComponents]);

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const calculateTotalCost = () => {
    return selectedComponents.reduce((total, component) => {
      const item = inventoryItems.find(i => i.id === component.item_id);
      return total + ((item?.unit_cost || 0) * component.quantity);
    }, 0);
  };

  const calculateSalePrice = () => {
    const totalCost = calculateTotalCost();
    const margin = parseFloat(profitMargin) || 0;
    return totalCost * (1 + margin / 100);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate input data
      const validationResult = productSchema.safeParse({
        name: name,
        quantityAvailable: parseInt(quantityAvailable) || 0,
        profitMargin: parseFloat(profitMargin) || 0,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
        throw new Error(errorMessage);
      }

      const validated = validationResult.data;
      const salePrice = calculateSalePrice();
      
      const productData = {
        name: validated.name,
        quantity_available: validated.quantityAvailable,
        profit_margin: validated.profitMargin,
        sale_price: salePrice,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      await supabase
        .from("product_components")
        .delete()
        .eq("product_id", productId);

      if (selectedComponents.length > 0) {
        const components = selectedComponents.map(c => ({
          product_id: productId,
          inventory_item_id: c.item_id,
          quantity: c.quantity,
        }));

        const { error } = await supabase
          .from("product_components")
          .insert(components);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-components"] });
      toast.success(editingProduct ? "Product updated" : "Product created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save product");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Box Hotwheels 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Available</Label>
            <Input
              id="quantity"
              type="number"
              value={quantityAvailable}
              onChange={(e) => setQuantityAvailable(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="margin">Profit Margin (%)</Label>
            <Input
              id="margin"
              type="number"
              step="0.1"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              placeholder="20"
            />
          </div>

          <ProductComponentsSelector
            selectedComponents={selectedComponents}
            onComponentsChange={setSelectedComponents}
          />

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Total Cost:</span>
              <span className="font-bold text-foreground">${calculateTotalCost().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Sale Price:</span>
              <span className="font-bold text-foreground">${calculateSalePrice().toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!name}>
            {editingProduct ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};