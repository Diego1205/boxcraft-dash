import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { toast } from "sonner";

export const BudgetCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [totalBudget, setTotalBudget] = useState("");
  const [amountSpent, setAmountSpent] = useState("");
  const queryClient = useQueryClient();

  const { data: budget } = useQuery({
    queryKey: ["budget-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("budget_settings")
        .update({
          total_budget: parseFloat(totalBudget),
          amount_spent: parseFloat(amountSpent),
        })
        .eq("id", budget?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-settings"] });
      toast.success("Budget updated");
      setIsEditing(false);
    },
  });

  const remaining = (budget?.total_budget || 0) - (budget?.amount_spent || 0);
  const isOverBudget = remaining < 0;

  const handleEdit = () => {
    setTotalBudget(budget?.total_budget?.toString() || "0");
    setAmountSpent(budget?.amount_spent?.toString() || "0");
    setIsEditing(true);
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-foreground">Budget Overview</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalBudget">Total Budget ($)</Label>
              <Input
                id="totalBudget"
                type="number"
                step="0.01"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountSpent">Amount Spent ($)</Label>
              <Input
                id="amountSpent"
                type="number"
                step="0.01"
                value={amountSpent}
                onChange={(e) => setAmountSpent(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateMutation.mutate()}>Save</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground">
              ${budget?.total_budget?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Amount Spent</p>
            <p className="text-2xl font-bold text-foreground">
              ${budget?.amount_spent?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
              ${remaining.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};