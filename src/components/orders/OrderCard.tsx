import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Order, OrderStatus } from "@/pages/Orders";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";

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
  const queryClient = useQueryClient();

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
      toast.success("Order status updated");
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus as OrderStatus);
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
              <p className="font-semibold text-foreground">${order.sale_price.toFixed(2)}</p>
            </div>
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
    </>
  );
};