import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Order } from "@/pages/Orders";
import { useBusiness } from "@/contexts/BusinessContext";
import { AlertTriangle } from "lucide-react";

interface OrderCompletionConfirmDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export const OrderCompletionConfirmDialog = ({
  order,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: OrderCompletionConfirmDialogProps) => {
  const { formatCurrency } = useBusiness();

  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Order Completion
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to mark this order as <strong>Completed</strong>. This action will
              permanently deduct inventory from your stock.
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><strong>Client:</strong> {order.client_name}</p>
              <p><strong>Product:</strong> {order.product_name}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Total:</strong> {formatCurrency(order.sale_price)}</p>
            </div>
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Inventory will be deducted automatically. This cannot be undone unless you cancel the order.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Processing..." : "Confirm Completion"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
