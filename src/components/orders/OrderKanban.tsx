import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Order, OrderStatus } from "@/pages/Orders";
import { OrderCard } from "./OrderCard";
import { OrderCompletionConfirmDialog } from "./OrderCompletionConfirmDialog";
import { OrderCancellationConfirmDialog } from "./OrderCancellationConfirmDialog";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";

const statuses: OrderStatus[] = [
  "New Inquiry",
  "In Progress",
  "Deposit Received",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

const statusColors: Record<OrderStatus, string> = {
  "New Inquiry": "border-l-4 border-l-blue-500",
  "In Progress": "border-l-4 border-l-yellow-500",
  "Deposit Received": "border-l-4 border-l-orange-500",
  "Ready for Delivery": "border-l-4 border-l-purple-500",
  "Completed": "border-l-4 border-l-green-500",
  "Cancelled": "border-l-4 border-l-red-500",
};

interface KanbanColumnProps {
  status: OrderStatus;
  orders: Order[];
  statusColor: string;
}

const KanbanColumn = ({ status, orders, statusColor }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div key={status} className="space-y-4">
      <div className={`bg-card border rounded-lg p-3 shadow-sm ${statusColor}`}>
        <h3 className="font-semibold text-sm text-foreground">{status}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{orders.length} orders</p>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? "bg-accent/50 ring-2 ring-primary/50" : ""
        }`}
      >
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} statusColor={statusColors[order.status]} />
        ))}
        {orders.length === 0 && (
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground">No orders</p>
          </Card>
        )}
      </div>
    </div>
  );
};

interface OrderKanbanProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrderKanban = ({ orders, isLoading }: OrderKanbanProps) => {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ orderId: string; newStatus: OrderStatus } | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order status updated");
      setCompletionDialogOpen(false);
      setCancellationDialogOpen(false);
      setPendingDrop(null);
    },
    onError: () => {
      toast.error("Failed to update order status");
      setPendingDrop(null);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const order = orders.find((o) => o.id === event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const orderId = active.id as string;
      const newStatus = over.id as OrderStatus;
      const order = orders.find((o) => o.id === orderId);

      // Only update if dropping on a valid status column
      if (statuses.includes(newStatus) && order) {
        // Show confirmation for completing orders
        if (newStatus === "Completed" && order.status !== "Completed") {
          setPendingDrop({ orderId, newStatus });
          setCompletionDialogOpen(true);
          setActiveOrder(null);
          return;
        }

        // Show confirmation for cancelling orders
        if (newStatus === "Cancelled") {
          setPendingDrop({ orderId, newStatus });
          setCancellationDialogOpen(true);
          setActiveOrder(null);
          return;
        }

        updateStatusMutation.mutate({ orderId, newStatus });
      }
    }

    setActiveOrder(null);
  };

  const handleConfirmCompletion = () => {
    if (pendingDrop) {
      updateStatusMutation.mutate(pendingDrop);
    }
  };

  const handleConfirmCancellation = () => {
    if (pendingDrop) {
      updateStatusMutation.mutate(pendingDrop);
    }
  };

  const pendingOrder = pendingDrop ? orders.find((o) => o.id === pendingDrop.orderId) : null;

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statuses.map((status) => {
            const statusOrders = orders.filter((order) => order.status === status);

            return (
              <KanbanColumn
                key={status}
                status={status}
                orders={statusOrders}
                statusColor={statusColors[status]}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="opacity-80">
              <OrderCard order={activeOrder} statusColor={statusColors[activeOrder.status]} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <OrderCompletionConfirmDialog
        order={pendingOrder || null}
        open={completionDialogOpen}
        onOpenChange={(open) => {
          setCompletionDialogOpen(open);
          if (!open) setPendingDrop(null);
        }}
        onConfirm={handleConfirmCompletion}
        isPending={updateStatusMutation.isPending}
      />
      <OrderCancellationConfirmDialog
        order={pendingOrder || null}
        open={cancellationDialogOpen}
        onOpenChange={(open) => {
          setCancellationDialogOpen(open);
          if (!open) setPendingDrop(null);
        }}
        onConfirm={handleConfirmCancellation}
        isPending={updateStatusMutation.isPending}
      />
    </>
  );
};
