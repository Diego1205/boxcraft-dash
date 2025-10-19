import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { InventoryItem } from "@/pages/Inventory";

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const InventoryList = ({ items, isLoading, onEdit, onDelete }: InventoryListProps) => {
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
      {items.map((item) => (
        <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-40 object-cover rounded-md mb-4"
            />
          )}
          <h3 className="text-xl font-semibold mb-2 text-foreground">{item.name}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium text-foreground">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Cost:</span>
              <span className="font-medium text-foreground">
                ${item.unit_cost?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-medium text-foreground">
                ${item.total_cost?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
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
              className="flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};