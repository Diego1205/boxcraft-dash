import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';

const SuperadminDashboard = () => {
  const { data: businesses = [] } = useQuery({
    queryKey: ['superadmin-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['superadmin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: ownerRoles = [] } = useQuery({
    queryKey: ['superadmin-owner-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, business_id, role')
        .eq('role', 'owner');
      if (error) throw error;
      return data;
    },
  });

  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b: any) => b.subscription_status === 'active').length;
  const freeTrialBusinesses = businesses.filter((b: any) => b.subscription_tier === 'free_trial').length;
  const weekAgo = subDays(new Date(), 7);
  const newThisWeek = businesses.filter((b: any) => new Date(b.created_at) >= weekAgo).length;
  const totalUsers = profiles.length;
  const avgUsersPerBusiness = totalBusinesses > 0 ? (totalUsers / totalBusinesses).toFixed(1) : '0';

  const recentBusinesses = businesses.slice(0, 10);

  const getOwnerName = (businessId: string) => {
    const ownerRole = ownerRoles.find((r: any) => r.business_id === businessId);
    if (!ownerRole) return 'N/A';
    const ownerProfile = profiles.find((p: any) => p.id === ownerRole.user_id);
    return ownerProfile?.full_name || ownerProfile?.email || 'N/A';
  };

  const tierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free_trial': return 'secondary';
      case 'growth': return 'default';
      case 'business': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Platform Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalBusinesses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeBusinesses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Free Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{freeTrialBusinesses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{newThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Business Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBusinesses.map((biz: any) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell>{getOwnerName(biz.id)}</TableCell>
                  <TableCell>{format(new Date(biz.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={tierBadgeVariant(biz.subscription_tier)}>
                      {biz.subscription_tier?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={biz.subscription_status === 'active' ? 'default' : 'destructive'}>
                      {biz.subscription_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentBusinesses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No businesses yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total Users: <strong className="text-foreground">{totalUsers}</strong></span>
        <span>Avg Users/Business: <strong className="text-foreground">{avgUsersPerBusiness}</strong></span>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
