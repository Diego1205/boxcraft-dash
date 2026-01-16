import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { Order } from "@/pages/Orders";
import { useBusiness } from "@/contexts/BusinessContext";

const editOrderSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(100, "Client name must be less than 100 characters"),
  clientContact: z.string().trim().max(255, "Contact info must be less than 255 characters").optional(),
  quantity: z.number().int().positive("Quantity must be positive").max(10000, "Quantity must be less than 10000"),
  deliveryInfo: z.string().trim().max(1000, "Delivery info must be less than 1000 characters").optional(),
  paymentMethod: z.string().trim().max(100, "Payment method must be less than 100 characters").optional(),
});

interface OrderEditDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderEditDialog = ({ order, open, onOpenChange }: OrderEditDialogProps) => {
  const { formatCurrency } = useBusiness();
  const [clientName, setClientName] = useState(order.client_name);
  const [clientContact, setClientContact] = useState(order.client_contact || "");
  const [quantity, setQuantity] = useState(order.quantity.toString());
  const [deliveryInfo, setDeliveryInfo] = useState(order.delivery_info || "");
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || "");
  const queryClient = useQueryClient();

  // Reset form when order changes
  useEffect(() => {
    setClientName(order.client_name);
    setClientContact(order.client_contact || "");
    setQuantity(order.quantity.toString());
    setDeliveryInfo(order.delivery_info || "");
    setPaymentMethod(order.payment_method || "");
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const newQuantity = parseInt(quantity) || 1;
      const quantityDiff = newQuantity - order.quantity;

      // Validate input data
      const validationResult = editOrderSchema.safeParse({
        clientName,
        clientContact: clientContact || undefined,
        quantity: newQuantity,
        deliveryInfo: deliveryInfo || undefined,
        paymentMethod: paymentMethod || undefined,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
        throw new Error(errorMessage);
      }

      // If quantity increased, check availability and update inventory
      if (quantityDiff > 0 && order.product_id) {
        // Check product availability
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("quantity_available")
          .eq("id", order.product_id)
          .single();

        if (productError) throw productError;

        if (quantityDiff > product.quantity_available) {
          throw new Error(`Not enough stock available. Available: ${product.quantity_available}`);
        }

        // Get product components and update inventory
        const { data: components, error: componentsError } = await supabase
          .from("product_components")
          .select("inventory_item_id, quantity")
          .eq("product_id", order.product_id);

        if (componentsError) throw componentsError;

        // Update inventory for each component
        for (const component of components || []) {
          const inventoryChange = component.quantity * quantityDiff;

          const { data: currentItem, error: fetchError } = await supabase
            .from("inventory_items")
            .select("quantity")
            .eq("id", component.inventory_item_id)
            .single();

          if (fetchError) throw fetchError;

          if (inventoryChange > currentItem.quantity) {
            throw new Error("Not enough inventory available for this quantity increase");
          }

          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({ quantity: currentItem.quantity - inventoryChange })
            .eq("id", component.inventory_item_id);

          if (updateError) throw updateError;
        }

        // Update product quantity
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ quantity_available: product.quantity_available - quantityDiff })
          .eq("id", order.product_id);

        if (productUpdateError) throw productUpdateError;
      }

      // If quantity decreased, restore inventory
      if (quantityDiff < 0 && order.product_id) {
        const { data: components, error: componentsError } = await supabase
          .from("product_components")
          .select("inventory_item_id, quantity")
          .eq("product_id", order.product_id);

        if (componentsError) throw componentsError;

        // Restore inventory for each component
        for (const component of components || []) {
          const inventoryRestore = component.quantity * Math.abs(quantityDiff);

          const { data: currentItem, error: fetchError } = await supabase
            .from("inventory_items")
            .select("quantity")
            .eq("id", component.inventory_item_id)
            .single();

          if (fetchError) throw fetchError;

          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({ quantity: currentItem.quantity + inventoryRestore })
            .eq("id", component.inventory_item_id);

          if (updateError) throw updateError;
        }

        // Restore product quantity
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("quantity_available")
          .eq("id", order.product_id)
          .single();

        if (productError) throw productError;

        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ quantity_available: product.quantity_available + Math.abs(quantityDiff) })
          .eq("id", order.product_id);

        if (productUpdateError) throw productUpdateError;
      }

      // Calculate new sale price based on quantity change
      const pricePerUnit = order.sale_price / order.quantity;
      const newSalePrice = pricePerUnit * newQuantity;

      // Update the order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          client_name: clientName.trim(),
          client_contact: clientContact.trim() || null,
          quantity: newQuantity,
          sale_price: newSalePrice,
          delivery_info: deliveryInfo.trim() || null,
          payment_method: paymentMethod.trim() || null,
        })
        .eq("id", order.id);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order");
    },
  });

  const pricePerUnit = order.sale_price / order.quantity;
  const newTotal = pricePerUnit * (parseInt(quantity) || 1);

  const isCompleted = order.status === "Completed";
  const isCancelled = order.status === "Cancelled";
  const canEdit = !isCompleted && !isCancelled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!canEdit && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              {isCompleted
                ? "Completed orders cannot be edited. Cancel the order first if changes are needed."
                : "Cancelled orders cannot be edited."}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="editClientName">Client Name *</Label>
            <Input
              id="editClientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editClientContact">Contact Info</Label>
            <Input
              id="editClientContact"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              placeholder="Phone or email"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              {order.product_name} (Cannot be changed)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editQuantity">Quantity *</Label>
            <Input
              id="editQuantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!canEdit}
            />
            {parseInt(quantity) !== order.quantity && canEdit && (
              <p className="text-xs text-muted-foreground">
                {parseInt(quantity) > order.quantity
                  ? `Adding ${parseInt(quantity) - order.quantity} units will deduct from inventory`
                  : `Removing ${order.quantity - parseInt(quantity)} units will restore to inventory`}
              </p>
            )}
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              Total: {formatCurrency(newTotal)}
              {newTotal !== order.sale_price && (
                <span className="text-muted-foreground ml-2">
                  (was {formatCurrency(order.sale_price)})
                </span>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editDeliveryInfo">Delivery Info</Label>
            <Textarea
              id="editDeliveryInfo"
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
              placeholder="Address, delivery date, etc."
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPaymentMethod">Payment Method</Label>
            <Input
              id="editPaymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Cash, Card, Transfer, etc."
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!canEdit || !clientName.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
