import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
}

export const ProductFilters = ({
  search,
  onSearchChange,
  totalCount,
  filteredCount,
}: ProductFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground self-center">
        {filteredCount === totalCount
          ? `${totalCount} products`
          : `${filteredCount} of ${totalCount} products`}
      </div>
    </div>
  );
};
