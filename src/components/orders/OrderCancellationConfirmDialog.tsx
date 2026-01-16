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
import { XCircle, RotateCcw } from "lucide-react";

interface OrderCancellationConfirmDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export const OrderCancellationConfirmDialog = ({
  order,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: OrderCancellationConfirmDialogProps) => {
  const { formatCurrency } = useBusiness();

  if (!order) return null;

  const wasCompleted = order.status === "Completed";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {wasCompleted ? (
              <RotateCcw className="h-5 w-5 text-amber-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {wasCompleted ? "Cancel Completed Order?" : "Cancel Order?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {wasCompleted ? (
              <p>
                This order was previously <strong>Completed</strong>. Cancelling it will{" "}
                <strong>restore the inventory</strong> that was deducted.
              </p>
            ) : (
              <p>Are you sure you want to cancel this order?</p>
            )}
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><strong>Client:</strong> {order.client_name}</p>
              <p><strong>Product:</strong> {order.product_name}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Total:</strong> {formatCurrency(order.sale_price)}</p>
            </div>
            {wasCompleted && (
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✅ Inventory will be automatically restored to your stock.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Processing..." : "Cancel Order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
