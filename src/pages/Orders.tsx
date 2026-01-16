import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrderKanban } from "@/components/orders/OrderKanban";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { useBusiness } from "@/contexts/BusinessContext";

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
  assigned_driver_id: string | null;
  assigned_driver_name?: string | null;
}

const Orders = () => {
  const { business } = useBusiness();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", business?.id],
    queryFn: async () => {
      // First get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", business!.id)
        .order("created_at", { ascending: false });
      
      if (ordersError) throw ordersError;

      // Get unique driver IDs that are assigned
      const driverIds = [...new Set(ordersData.filter(o => o.assigned_driver_id).map(o => o.assigned_driver_id))];
      
      // Fetch driver names if there are any assigned
      let driverMap: Record<string, string> = {};
      if (driverIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", driverIds);
        
        if (!profilesError && profiles) {
          driverMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || p.email || "Unknown";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Map orders with driver names
      return ordersData.map(order => ({
        ...order,
        assigned_driver_name: order.assigned_driver_id ? driverMap[order.assigned_driver_id] : null,
      })) as Order[];
    },
    enabled: !!business?.id,
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
