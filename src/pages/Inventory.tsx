import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InventoryList } from "@/components/inventory/InventoryList";
import { InventoryDialog } from "@/components/inventory/InventoryDialog";
import { BudgetCard } from "@/components/inventory/BudgetCard";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  image_url: string | null;
}

const Inventory = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, quantity, unit_cost, total_cost, image_url, business_id")
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

      <InventoryList
        items={items}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
      />
    </div>
  );
};

export default Inventory;