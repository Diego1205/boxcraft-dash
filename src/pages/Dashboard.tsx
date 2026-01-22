import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { Package, Box, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { BudgetCard } from '@/components/inventory/BudgetCard';

const Dashboard = () => {
  const { business, formatCurrency } = useBusiness();

  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats', business?.id],
    queryFn: async () => {
      if (!business) return null;
      const { data, error } = await supabase
        .from('inventory_items')
        .select('total_cost')
        .eq('business_id', business.id);
      
      if (error) throw error;
      const totalValue = data.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
      return { totalValue, itemCount: data.length };
    },
    enabled: !!business,
  });

  const { data: productStats } = useQuery({
    queryKey: ['product-stats', business?.id],
    queryFn: async () => {
      if (!business) return null;
      const { data, error } = await supabase
        .from('products')
        .select('quantity_available')
        .eq('business_id', business.id);
      
      if (error) throw error;
      const totalProducts = data.reduce((sum, item) => sum + (item.quantity_available || 0), 0);
      return { totalProducts, productCount: data.length };
    },
    enabled: !!business,
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats', business?.id],
    queryFn: async () => {
      if (!business) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('status, sale_price')
        .eq('business_id', business.id);
      
      if (error) throw error;
      const activeOrders = data.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyRevenue = data
        .filter(o => o.status === 'Completed')
        .reduce((sum, order) => sum + (Number(order.sale_price) || 0), 0);
      
      return { activeOrders, monthlyRevenue, totalOrders: data.length };
    },
    enabled: !!business,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock', business?.id],
    queryFn: async () => {
      if (!business) return [];
      
      // Get inventory items with their reorder levels
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, reorder_level')
        .eq('business_id', business.id);
      
      if (itemsError) throw itemsError;

      // Get product component usage
      const { data: components, error: compError } = await supabase
        .from('product_components')
        .select(`
          inventory_item_id,
          quantity,
          products!inner (
            quantity_available
          )
        `);

      if (compError) throw compError;

      // Calculate usage per item
      const usage: Record<string, number> = {};
      components.forEach((comp: any) => {
        const itemId = comp.inventory_item_id;
        const usedQty = comp.quantity * comp.products.quantity_available;
        usage[itemId] = (usage[itemId] || 0) + usedQty;
      });

      // Filter items where available < reorder_level
      return (items || [])
        .map(item => {
          const usedInProducts = usage[item.id] || 0;
          const available = (item.quantity || 0) - usedInProducts;
          const reorderLevel = item.reorder_level ?? 10;
          return {
            ...item,
            available,
            reorderLevel,
            isLow: available < reorderLevel && available > 0,
            isOut: available <= 0,
          };
        })
        .filter(item => item.available < item.reorderLevel);
    },
    enabled: !!business,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your business operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory Value
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryStats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventoryStats?.itemCount || 0} items in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productStats?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {productStats?.productCount || 0} product types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderStats?.activeOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {orderStats?.totalOrders || 0} total orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orderStats?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BudgetCard />

        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (reorder at {item.reorderLevel})
                      </span>
                    </div>
                    <span className={item.isOut ? "text-destructive font-semibold" : "text-yellow-600 font-semibold"}>
                      {item.available.toFixed(1)} available
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground">{order.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.sale_price)}</p>
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;