import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

export interface InventoryFiltersState {
  search: string;
  stockStatus: StockStatus;
  category: string;
}

interface InventoryFiltersProps {
  filters: InventoryFiltersState;
  onFiltersChange: (filters: InventoryFiltersState) => void;
  categories: string[];
  totalCount: number;
  filteredCount: number;
}

export const InventoryFilters = ({
  filters,
  onFiltersChange,
  categories,
  totalCount,
  filteredCount,
}: InventoryFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStockStatusChange = (value: StockStatus) => {
    onFiltersChange({ ...filters, stockStatus: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      stockStatus: "all",
      category: "all",
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.stockStatus !== "all" ||
    filters.category !== "all";

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.stockStatus}
          onValueChange={handleStockStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount} items
        {hasActiveFilters && " (filtered)"}
      </div>
    </div>
  );
};
