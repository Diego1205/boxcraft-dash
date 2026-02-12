import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Circle, Package, Box, ShoppingCart, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  link: string;
  icon: React.ReactNode;
}

export const GettingStartedChecklist = () => {
  const { business, isOwner, isAdmin } = useBusiness();

  const { data: inventoryCount = 0 } = useQuery({
    queryKey: ['inventory-count', business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count, error } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!business,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ['product-count', business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!business,
  });

  const { data: orderCount = 0 } = useQuery({
    queryKey: ['order-count', business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!business,
  });

  const { data: teamCount = 0 } = useQuery({
    queryKey: ['team-count', business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);
      if (error) throw error;
      // Subtract 1 for the owner themselves
      return Math.max(0, (count || 1) - 1);
    },
    enabled: !!business,
  });

  const checklistItems: ChecklistItem[] = [
    {
      id: 'inventory',
      label: 'Add your first inventory item',
      description: 'Track supplies and materials you use to create gift boxes',
      completed: inventoryCount > 0,
      link: '/inventory',
      icon: <Package className="h-5 w-5" />,
    },
    {
      id: 'product',
      label: 'Create a product',
      description: 'Define a gift box product using your inventory items',
      completed: productCount > 0,
      link: '/products',
      icon: <Box className="h-5 w-5" />,
    },
    {
      id: 'order',
      label: 'Create your first order',
      description: 'Start tracking customer orders and deliveries',
      completed: orderCount > 0,
      link: '/orders',
      icon: <ShoppingCart className="h-5 w-5" />,
    },
  ];

  // Only show team invite for owners
  if (isOwner) {
    checklistItems.push({
      id: 'team',
      label: 'Invite a team member',
      description: 'Add admins or drivers to help manage your business',
      completed: teamCount > 0,
      link: '/team',
      icon: <Users className="h-5 w-5" />,
    });
  }

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  // Don't show checklist if all items are complete
  if (allComplete) {
    return null;
  }

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-background to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle>Getting Started</CardTitle>
        </div>
        <CardDescription>
          Complete these steps to set up your business
        </CardDescription>
        <div className="pt-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount} of {totalCount} complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
              item.completed
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border-2 border-muted-foreground/30'
              }`}
            >
              {item.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${item.completed ? 'text-primary' : ''}`}>
                {item.label}
              </p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {item.icon}
              {!item.completed && (
                <Button asChild size="sm" variant="outline">
                  <Link to={item.link}>
                    Start
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
