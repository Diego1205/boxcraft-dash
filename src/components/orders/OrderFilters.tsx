import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/pages/Orders";

const statuses: OrderStatus[] = [
  "New Inquiry",
  "In Progress",
  "Deposit Received",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

export interface OrderFiltersState {
  search: string;
  statuses: OrderStatus[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

export const OrderFilters = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: OrderFiltersProps) => {
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusToggle = (status: OrderStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, dateFrom: date || null });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, dateTo: date || null });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      statuses: [],
      dateFrom: null,
      dateTo: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.statuses.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or product name..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Filter className="h-4 w-4" />
              Status
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.statuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-popover" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground mb-2">
                Filter by status
              </p>
              {statuses.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={status}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
              {filters.statuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onFiltersChange({ ...filters, statuses: [] })}
                >
                  Clear status filter
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto justify-start text-left font-normal gap-2",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {filters.dateFrom
                ? format(filters.dateFrom, "MMM d, yyyy")
                : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom || undefined}
              onSelect={handleDateFromChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto justify-start text-left font-normal gap-2",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {filters.dateTo
                ? format(filters.dateTo, "MMM d, yyyy")
                : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo || undefined}
              onSelect={handleDateToChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="w-full sm:w-auto gap-2"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} orders
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="outline">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </Badge>
        )}
      </div>
    </div>
  );
};
