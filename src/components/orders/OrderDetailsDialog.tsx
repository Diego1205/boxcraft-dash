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
import { OrderEditDialog } from "./OrderEditDialog";
import { OrderCompletionConfirmDialog } from "./OrderCompletionConfirmDialog";
import { OrderCancellationConfirmDialog } from "./OrderCancellationConfirmDialog";
import { toast } from "sonner";
import { Link2, Copy, Check, Pencil, User, CheckCircle2 } from "lucide-react";
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
  const { business, formatCurrency } = useBusiness();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(order.assigned_driver_id || "");
  const queryClient = useQueryClient();

  // Reset state when order changes
  useEffect(() => {
    setStatus(order.status);
    setSelectedDriverId(order.assigned_driver_id || "");
  }, [order.status, order.assigned_driver_id]);

  // Query for drivers in the business
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers", business?.id],
    queryFn: async () => {
      // Get all driver user_ids for this business
      const { data: driverRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("business_id", business!.id)
        .eq("role", "driver");

      if (rolesError) throw rolesError;

      if (!driverRoles || driverRoles.length === 0) return [];

      // Get profiles for those drivers
      const driverIds = driverRoles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", driverIds);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: open && !!business?.id,
  });

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
        .update({ 
          status,
          assigned_driver_id: selectedDriverId || null,
        })
        .eq("id", order.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order updated");
      onOpenChange(false);
      setCompletionDialogOpen(false);
      setCancellationDialogOpen(false);
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

  const handleUpdateClick = () => {
    // Check if status is changing to Completed
    if (status === "Completed" && order.status !== "Completed") {
      setCompletionDialogOpen(true);
      return;
    }

    // Check if status is changing to Cancelled
    if (status === "Cancelled" && order.status !== "Cancelled") {
      setCancellationDialogOpen(true);
      return;
    }

    updateMutation.mutate();
  };

  const handleConfirmCompletion = () => {
    updateMutation.mutate();
  };

  const handleConfirmCancellation = () => {
    updateMutation.mutate();
  };

  const hasChanges = status !== order.status || selectedDriverId !== (order.assigned_driver_id || "");
  const canEdit = order.status !== "Completed" && order.status !== "Cancelled";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Order Details</DialogTitle>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
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

            {/* Driver Assignment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned Driver
              </Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name || driver.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {drivers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No drivers available. Invite drivers in User Management.
                </p>
              )}
            </div>

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

            {/* Delivery Link Section - Show when Ready for Delivery and not yet confirmed */}
            {status === "Ready for Delivery" && !deliveryConfirmation?.confirmed_at && (
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

            {/* Delivery Confirmation Details - Show when delivery is confirmed */}
            {deliveryConfirmation?.confirmed_at && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Label className="text-green-700 font-semibold">Delivery Confirmed</Label>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Confirmed on: {new Date(deliveryConfirmation.confirmed_at).toLocaleString()}
                  </p>
                  
                  {deliveryConfirmation.driver_notes && (
                    <div>
                      <p className="font-medium">Driver Notes:</p>
                      <p className="text-muted-foreground">{deliveryConfirmation.driver_notes}</p>
                    </div>
                  )}
                </div>
                
                {deliveryConfirmation.delivery_photo_url && (
                  <div className="space-y-2">
                    <Label>Delivery Photo</Label>
                    <img
                      src={deliveryConfirmation.delivery_photo_url}
                      alt="Delivery confirmation"
                      className="rounded-lg border w-full max-h-64 object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleUpdateClick} disabled={!hasChanges || updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OrderEditDialog order={order} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      
      <OrderCompletionConfirmDialog
        order={order}
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        onConfirm={handleConfirmCompletion}
        isPending={updateMutation.isPending}
      />
      
      <OrderCancellationConfirmDialog
        order={order}
        open={cancellationDialogOpen}
        onOpenChange={setCancellationDialogOpen}
        onConfirm={handleConfirmCancellation}
        isPending={updateMutation.isPending}
      />
    </>
  );
};
