import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@/pages/Orders";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { OrderCompletionConfirmDialog } from "./OrderCompletionConfirmDialog";
import { OrderCancellationConfirmDialog } from "./OrderCancellationConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical, User } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

const statuses: OrderStatus[] = [
  "New Inquiry",
  "In Progress",
  "Deposit Received",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

interface OrderCardProps {
  order: Order;
  statusColor?: string;
}

export const OrderCard = ({ order, statusColor }: OrderCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const queryClient = useQueryClient();
  const { formatCurrency } = useBusiness();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order status updated");
      setCompletionDialogOpen(false);
      setCancellationDialogOpen(false);
      setPendingStatus(null);
    },
    onError: () => {
      toast.error("Failed to update order status");
      setPendingStatus(null);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    const status = newStatus as OrderStatus;

    // Show confirmation for completing orders
    if (status === "Completed" && order.status !== "Completed") {
      setPendingStatus(status);
      setCompletionDialogOpen(true);
      return;
    }

    // Show confirmation for cancelling orders
    if (status === "Cancelled") {
      setPendingStatus(status);
      setCancellationDialogOpen(true);
      return;
    }

    updateStatusMutation.mutate(status);
  };

  const handleConfirmCompletion = () => {
    if (pendingStatus) {
      updateStatusMutation.mutate(pendingStatus);
    }
  };

  const handleConfirmCancellation = () => {
    if (pendingStatus) {
      updateStatusMutation.mutate(pendingStatus);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-4 hover:shadow-md transition-shadow ${statusColor || ""}`}
      >
        <div className="flex items-start gap-2">
          <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <h4
              className="font-semibold text-sm text-foreground cursor-pointer hover:underline"
              onClick={() => setIsOpen(true)}
            >
              {order.client_name}
            </h4>
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">{order.product_name}</p>
              <p className="text-muted-foreground">Qty: {order.quantity}</p>
              <p className="font-semibold text-foreground">{formatCurrency(order.sale_price)}</p>
            </div>
            {order.assigned_driver_name && (
              <Badge variant="outline" className="text-xs gap-1">
                <User className="h-3 w-3" />
                {order.assigned_driver_name}
              </Badge>
            )}
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {statuses.map((status) => (
                  <SelectItem key={status} value={status} className="text-xs">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      <OrderDetailsDialog order={order} open={isOpen} onOpenChange={setIsOpen} />
      <OrderCompletionConfirmDialog
        order={order}
        open={completionDialogOpen}
        onOpenChange={(open) => {
          setCompletionDialogOpen(open);
          if (!open) setPendingStatus(null);
        }}
        onConfirm={handleConfirmCompletion}
        isPending={updateStatusMutation.isPending}
      />
      <OrderCancellationConfirmDialog
        order={order}
        open={cancellationDialogOpen}
        onOpenChange={(open) => {
          setCancellationDialogOpen(open);
          if (!open) setPendingStatus(null);
        }}
        onConfirm={handleConfirmCancellation}
        isPending={updateStatusMutation.isPending}
      />
    </>
  );
};
