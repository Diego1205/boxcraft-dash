import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Order } from "@/pages/Orders";
import { OrderDetailsDialog } from "./OrderDetailsDialog";

interface OrderCardProps {
  order: Order;
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card 
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <h4 className="font-semibold text-sm mb-2 text-foreground">{order.client_name}</h4>
        <div className="space-y-1 text-xs">
          <p className="text-muted-foreground">{order.product_name}</p>
          <p className="text-muted-foreground">Qty: {order.quantity}</p>
          <p className="font-semibold text-foreground">${order.sale_price.toFixed(2)}</p>
        </div>
      </Card>
      <OrderDetailsDialog order={order} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};