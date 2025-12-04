import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Link2, Copy, Check } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

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
  const { formatCurrency } = useBusiness();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Reset status when order changes
  useEffect(() => {
    setStatus(order.status);
  }, [order.status]);

  // Query for existing delivery confirmation
  const { data: deliveryConfirmation } = useQuery({
    queryKey: ["delivery-confirmation", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_confirmations")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      // Generate unique token
      const token = crypto.randomUUID();
      
      const { error } = await supabase
        .from("delivery_confirmations")
        .insert({
          order_id: order.id,
          driver_token: token,
        });
      
      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-confirmation", order.id] });
      toast.success("Delivery link generated");
    },
    onError: () => {
      toast.error("Failed to generate delivery link");
    },
  });

  const deliveryUrl = deliveryConfirmation
    ? `${window.location.origin}/delivery/${deliveryConfirmation.driver_token}`
    : null;

  const handleCopyLink = async () => {
    if (deliveryUrl) {
      await navigator.clipboard.writeText(deliveryUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              <p className="text-sm text-foreground">{formatCurrency(order.sale_price)}</p>
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

          {/* Delivery Link Section */}
          {status === "Ready for Delivery" && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Delivery Confirmation Link
              </Label>
              {deliveryUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={deliveryUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with the driver to confirm delivery
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => generateLinkMutation.mutate()}
                  disabled={generateLinkMutation.isPending}
                  className="w-full"
                >
                  Generate Delivery Link
                </Button>
              )}
            </div>
          )}
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