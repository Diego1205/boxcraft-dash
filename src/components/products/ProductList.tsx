import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Product } from "@/pages/Products";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductList = ({ products, isLoading, onEdit, onDelete }: ProductListProps) => {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No products yet. Create your first gift box product.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold mb-4 text-foreground">{product.name}</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-foreground">{product.quantity_available}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Margin:</span>
              <span className="font-medium text-foreground">{product.profit_margin}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sale Price:</span>
              <span className="font-medium text-foreground">
                ${product.sale_price?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="flex-1 gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(product.id)}
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