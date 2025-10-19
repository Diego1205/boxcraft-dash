import { Card } from "@/components/ui/card";
import { Order, OrderStatus } from "@/pages/Orders";
import { OrderCard } from "./OrderCard";

const statuses: OrderStatus[] = [
  "New Inquiry",
  "In Progress",
  "Deposit Received",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

interface OrderKanbanProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrderKanban = ({ orders, isLoading }: OrderKanbanProps) => {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statuses.map((status) => {
        const statusOrders = orders.filter((order) => order.status === status);
        
        return (
          <div key={status} className="space-y-4">
            <div className="bg-card border rounded-lg p-3">
              <h3 className="font-semibold text-sm text-foreground">{status}</h3>
              <p className="text-xs text-muted-foreground">{statusOrders.length} orders</p>
            </div>
            <div className="space-y-3">
              {statusOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {statusOrders.length === 0 && (
                <Card className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">No orders</p>
                </Card>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};