import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertTriangle, PackagePlus } from "lucide-react";
import { InventoryItem } from "@/pages/Inventory";
import { useBusiness } from "@/contexts/BusinessContext";

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (item: InventoryItem, available: number) => void;
}

export const InventoryList = ({ items, isLoading, onEdit, onDelete, onAdjustStock }: InventoryListProps) => {
  const { formatCurrency } = useBusiness();

  // Query to get usage of each inventory item in products
  const { data: usageData = {} } = useQuery({
    queryKey: ["inventory-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_components")
        .select(`
          inventory_item_id,
          quantity,
          products!inner (
            quantity_available
          )
        `);

      if (error) throw error;

      // Calculate total used quantity per inventory item
      const usage: Record<string, number> = {};
      data.forEach((comp: any) => {
        const itemId = comp.inventory_item_id;
        const usedQty = comp.quantity * comp.products.quantity_available;
        usage[itemId] = (usage[itemId] || 0) + usedQty;
      });

      return usage;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No items yet. Add your first inventory item to get started.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        if (!item?.id) {
          console.error("Item missing ID:", item);
          return null;
        }

        const usedInProducts = usageData[item.id] || 0;
        const totalQty = item.quantity != null ? Number(item.quantity) : 0;
        const available = isNaN(totalQty) ? 0 : totalQty - usedInProducts;
        const reorderLevel = item.reorder_level ?? 10;
        const isLowStock = available < reorderLevel && available > 0;
        const isOutOfStock = available <= 0;

        return (
          <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
            )}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
              {item.category && (
                <Badge variant="secondary" className="ml-2">
                  {item.category}
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Quantity:</span>
                <span className="font-medium text-foreground">{totalQty.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used in Products:</span>
                <Badge variant="secondary" className="font-medium">
                  {usedInProducts.toFixed(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Available:</span>
                <div className="flex items-center gap-2">
                  {isOutOfStock && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {isLowStock && !isOutOfStock && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span
                    className={`font-medium ${
                      isOutOfStock
                        ? "text-destructive"
                        : isLowStock
                        ? "text-orange-500"
                        : "text-green-600"
                    }`}
                  >
                    {available.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reorder Level:</span>
                <span className="font-medium text-foreground">{reorderLevel}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Unit Cost:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(item.unit_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(item.total_cost || 0)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAdjustStock(item, available)}
                className="flex-1 gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Adjust
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
