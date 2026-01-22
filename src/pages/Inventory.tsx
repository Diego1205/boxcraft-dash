import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InventoryList } from "@/components/inventory/InventoryList";
import { InventoryDialog } from "@/components/inventory/InventoryDialog";
import { InventoryFilters, InventoryFiltersState, StockStatus } from "@/components/inventory/InventoryFilters";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { BudgetCard } from "@/components/inventory/BudgetCard";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  image_url: string | null;
  reorder_level: number;
  category: string | null;
}

const Inventory = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustingAvailable, setAdjustingAvailable] = useState(0);
  const [filters, setFilters] = useState<InventoryFiltersState>({
    search: "",
    stockStatus: "all",
    category: "all",
  });
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, quantity, unit_cost, total_cost, image_url, business_id, reorder_level, category")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter out any items without required fields or business_id
      const validItems = (data || []).filter(item => 
        item.id && 
        item.name && 
        item.business_id !== null
      );
      
      return validItems as InventoryItem[];
    },
  });

  // Query to get usage for filtering
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

      const usage: Record<string, number> = {};
      data.forEach((comp: any) => {
        const itemId = comp.inventory_item_id;
        const usedQty = comp.quantity * comp.products.quantity_available;
        usage[itemId] = (usage[itemId] || 0) + usedQty;
      });

      return usage;
    },
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = items
      .map((item) => item.category)
      .filter((cat): cat is string => !!cat);
    return [...new Set(cats)].sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Stock status filter
      if (filters.stockStatus !== "all") {
        const usedInProducts = usageData[item.id] || 0;
        const totalQty = item.quantity != null ? Number(item.quantity) : 0;
        const available = totalQty - usedInProducts;
        const reorderLevel = item.reorder_level ?? 10;

        if (filters.stockStatus === "out-of-stock" && available > 0) return false;
        if (filters.stockStatus === "low-stock" && (available <= 0 || available >= reorderLevel)) return false;
        if (filters.stockStatus === "in-stock" && available < reorderLevel) return false;
      }

      // Category filter
      if (filters.category !== "all") {
        if (item.category !== filters.category) return false;
      }

      return true;
    });
  }, [items, filters, usageData]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-total-costs"] });
      toast.success("Item deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdjustStock = (item: InventoryItem, available: number) => {
    setAdjustingItem(item);
    setAdjustingAvailable(available);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">Track items used to create gift boxes</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <BudgetCard />

      <InventoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        totalCount={items.length}
        filteredCount={filteredItems.length}
      />

      <InventoryList
        items={filteredItems}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdjustStock={handleAdjustStock}
      />

      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
      />

      <StockAdjustmentDialog
        open={!!adjustingItem}
        onOpenChange={(open) => !open && setAdjustingItem(null)}
        item={adjustingItem}
        availableQuantity={adjustingAvailable}
      />
    </div>
  );
};

export default Inventory;