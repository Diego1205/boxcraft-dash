import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { useBusiness } from "@/contexts/BusinessContext";

const orderSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(100, "Client name must be less than 100 characters"),
  clientContact: z.string().trim().max(255, "Contact info must be less than 255 characters").optional(),
  quantity: z.number().int().positive("Quantity must be positive").max(10000, "Quantity must be less than 10000"),
  deliveryInfo: z.string().trim().max(1000, "Delivery info must be less than 1000 characters").optional(),
  paymentMethod: z.string().trim().max(100, "Payment method must be less than 100 characters").optional(),
});

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDialog = ({ open, onOpenChange }: OrderDialogProps) => {
  const { business } = useBusiness();
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const selectedProduct = products.find((p) => p.id === productId);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("No product selected");

      const orderQuantity = parseInt(quantity) || 1;

      // Check if product has enough quantity available
      if (orderQuantity > selectedProduct.quantity_available) {
        throw new Error(`Not enough products available. Available: ${selectedProduct.quantity_available}, Requested: ${orderQuantity}`);
      }

      // Validate input data
      const validationResult = orderSchema.safeParse({
        clientName: clientName,
        clientContact: clientContact || undefined,
        quantity: orderQuantity,
        deliveryInfo: deliveryInfo || undefined,
        paymentMethod: paymentMethod || undefined,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
        throw new Error(errorMessage);
      }

      const validated = validationResult.data;

      // Create the order
      const { error: orderError } = await supabase.from("orders").insert({
        client_name: validated.clientName,
        client_contact: validated.clientContact || null,
        product_id: productId,
        product_name: selectedProduct.name,
        quantity: validated.quantity,
        sale_price: selectedProduct.sale_price || 0,
        delivery_info: validated.deliveryInfo || null,
        payment_method: validated.paymentMethod || null,
        status: "New Inquiry",
        business_id: business?.id,
      });

      if (orderError) throw orderError;

      // Get product components
      const { data: components, error: componentsError } = await supabase
        .from("product_components")
        .select("inventory_item_id, quantity")
        .eq("product_id", productId);

      if (componentsError) throw componentsError;

      // Check and update inventory for each component
      if (components && components.length > 0) {
        for (const component of components) {
          const usedQuantity = component.quantity * orderQuantity;

          const { data: currentItem, error: fetchError } = await supabase
            .from("inventory_items")
            .select("quantity")
            .eq("id", component.inventory_item_id)
            .single();

          if (fetchError) throw fetchError;

          // Check if enough inventory is available
          if (usedQuantity > currentItem.quantity) {
            throw new Error(`Not enough inventory available for this order`);
          }

          const newQuantity = currentItem.quantity - usedQuantity;

          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({ quantity: newQuantity })
            .eq("id", component.inventory_item_id);

          if (updateError) throw updateError;
        }
      }

      // Update product quantity
      const newProductQuantity = selectedProduct.quantity_available - orderQuantity;
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({ quantity_available: newProductQuantity })
        .eq("id", productId);

      if (productUpdateError) throw productUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order created and inventory updated");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || "Failed to create order");
    },
  });

  const resetForm = () => {
    setClientName("");
    setClientContact("");
    setProductId("");
    setQuantity("1");
    setDeliveryInfo("");
    setPaymentMethod("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientContact">Contact Info</Label>
            <Input
              id="clientContact"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              placeholder="Phone or email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.sale_price?.toFixed(2)} (Avail: {product.quantity_available})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {selectedProduct && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Total: ${((selectedProduct.sale_price || 0) * (parseInt(quantity) || 1)).toFixed(2)}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="deliveryInfo">Delivery Info</Label>
            <Textarea
              id="deliveryInfo"
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
              placeholder="Address, delivery date, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Cash, Card, Transfer, etc."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!clientName || !productId}
          >
            Create Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};