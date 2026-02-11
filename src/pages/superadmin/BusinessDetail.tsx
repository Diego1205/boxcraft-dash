import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: business } = useQuery({
    queryKey: ['superadmin-business', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['superadmin-business-members', id],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', id!);
      if (error) throw error;
      return profiles;
    },
    enabled: !!id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['superadmin-business-roles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('business_id', id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orderCount = 0 } = useQuery({
    queryKey: ['superadmin-business-orders', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ['superadmin-business-products', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const getRoles = (userId: string) => {
    return roles
      .filter((r: any) => r.user_id === userId)
      .map((r: any) => r.role)
      .join(', ');
  };

  if (!business) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/superadmin/businesses">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">{business.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Currency</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold text-foreground">{business.currency} ({(business as any).currency_symbol})</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tier</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary">{(business as any).subscription_tier?.replace('_', ' ')}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Orders</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold text-foreground">{orderCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Products</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold text-foreground">{productCount}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name || '—'}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell><Badge variant="outline">{getRoles(m.id) || 'none'}</Badge></TableCell>
                  <TableCell>{format(new Date(m.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Created: {format(new Date(business.created_at), 'MMM d, yyyy')}
        {(business as any).trial_ends_at && (
          <> · Trial ends: {format(new Date((business as any).trial_ends_at), 'MMM d, yyyy')}</>
        )}
      </p>
    </div>
  );
};

export default BusinessDetail;
