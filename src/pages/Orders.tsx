import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrderKanban } from "@/components/orders/OrderKanban";
import { OrderDialog } from "@/components/orders/OrderDialog";

export type OrderStatus = "New Inquiry" | "In Progress" | "Deposit Received" | "Ready for Delivery" | "Completed" | "Cancelled";

export interface Order {
  id: string;
  client_name: string;
  client_contact: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  sale_price: number;
  delivery_info: string | null;
  payment_method: string | null;
  status: OrderStatus;
  created_at: string;
}

const Orders = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <OrderKanban orders={orders} isLoading={isLoading} />

      <OrderDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};

export default Orders;