import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, OrderStatus } from "@/pages/Orders";
import { toast } from "sonner";

const statuses: OrderStatus[] = [
  "New Inquiry",
  "In Progress",
  "Deposit Received",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

interface OrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsDialog = ({ order, open, onOpenChange }: OrderDetailsDialogProps) => {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", order.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <p className="text-sm text-foreground">{order.client_name}</p>
          </div>
          {order.client_contact && (
            <div className="space-y-2">
              <Label>Contact</Label>
              <p className="text-sm text-foreground">{order.client_contact}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Product</Label>
            <p className="text-sm text-foreground">{order.product_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <p className="text-sm text-foreground">{order.quantity}</p>
            </div>
            <div className="space-y-2">
              <Label>Sale Price</Label>
              <p className="text-sm text-foreground">${order.sale_price.toFixed(2)}</p>
            </div>
          </div>
          {order.delivery_info && (
            <div className="space-y-2">
              <Label>Delivery Info</Label>
              <p className="text-sm text-foreground">{order.delivery_info}</p>
            </div>
          )}
          {order.payment_method && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <p className="text-sm text-foreground">{order.payment_method}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={status === order.status}>
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};