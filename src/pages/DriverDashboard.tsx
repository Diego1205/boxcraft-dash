import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Package, MapPin, Phone, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrderWithDelivery {
  id: string;
  client_name: string;
  client_contact: string | null;
  product_name: string;
  quantity: number;
  delivery_info: string | null;
  status: string;
  created_at: string;
  delivery_confirmations: {
    driver_token: string;
    confirmed_at: string | null;
  }[];
}

export default function DriverDashboard() {
  const { business, formatCurrency } = useBusiness();
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["driver-orders", business?.id, user?.id],
    queryFn: async () => {
      if (!business?.id || !user?.id) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          client_name,
          client_contact,
          product_name,
          quantity,
          delivery_info,
          status,
          created_at,
          delivery_confirmations (
            driver_token,
            confirmed_at
          )
        `)
        .eq("business_id", business.id)
        .eq("assigned_driver_id", user.id)
        .in("status", ["Ready for Delivery", "Completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrderWithDelivery[];
    },
    enabled: !!business?.id && !!user?.id,
  });

  const pendingDeliveries = orders?.filter(o => o.status === "Ready for Delivery") || [];
  const completedDeliveries = orders?.filter(o => o.status === "Completed") || [];

  const copyDeliveryLink = (token: string) => {
    const link = `${window.location.origin}/delivery/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Delivery link copied to clipboard");
  };

  const openDeliveryLink = (token: string) => {
    window.open(`${window.location.origin}/delivery/${token}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="h-8 w-8" />
          Driver Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage your assigned deliveries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{pendingDeliveries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {completedDeliveries.filter(o => {
                const confirmedAt = o.delivery_confirmations?.[0]?.confirmed_at;
                if (!confirmedAt) return false;
                return new Date(confirmedAt).toDateString() === new Date().toDateString();
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Deliveries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Pending Deliveries
        </h2>
        
        {pendingDeliveries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending deliveries at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingDeliveries.map((order) => {
              const deliveryToken = order.delivery_confirmations?.[0]?.driver_token;
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.client_name}</CardTitle>
                        <CardDescription>
                          {order.product_name} × {order.quantity}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                        Ready for Delivery
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.delivery_info && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{order.delivery_info}</span>
                      </div>
                    )}
                    {order.client_contact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{order.client_contact}</span>
                      </div>
                    )}
                    
                    {deliveryToken && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyDeliveryLink(deliveryToken)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openDeliveryLink(deliveryToken)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Confirm Delivery
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Deliveries */}
      {completedDeliveries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
            Completed Deliveries
          </h2>
          
          <div className="grid gap-4">
            {completedDeliveries.slice(0, 5).map((order) => {
              const confirmedAt = order.delivery_confirmations?.[0]?.confirmed_at;
              
              return (
                <Card key={order.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{order.client_name}</CardTitle>
                        <CardDescription>
                          {order.product_name} × {order.quantity}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  {confirmedAt && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Confirmed: {format(new Date(confirmedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
