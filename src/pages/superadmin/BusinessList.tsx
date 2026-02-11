import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Search, Eye, Settings } from 'lucide-react';

const TIERS = ['free_trial', 'growth', 'business'];
const STATUSES = ['active', 'suspended', 'cancelled'];

const BusinessList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [editBiz, setEditBiz] = useState<any>(null);
  const [editTier, setEditTier] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTrialEnds, setEditTrialEnds] = useState('');

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editBiz) return;
      const updates: any = {
        subscription_tier: editTier,
        subscription_status: editStatus,
      };
      if (editTrialEnds) updates.trial_ends_at = editTrialEnds;
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', editBiz.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Business updated' });
      queryClient.invalidateQueries({ queryKey: ['superadmin-businesses'] });
      setEditBiz(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const filtered = businesses.filter((b: any) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || b.subscription_tier === tierFilter;
    return matchSearch && matchTier;
  });

  const openEdit = (biz: any) => {
    setEditBiz(biz);
    setEditTier(biz.subscription_tier || 'free_trial');
    setEditStatus(biz.subscription_status || 'active');
    setEditTrialEnds(biz.trial_ends_at ? biz.trial_ends_at.split('T')[0] : '');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">All Businesses</h2>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {TIERS.map((t) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((biz: any) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell>{biz.currency}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{biz.subscription_tier?.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={biz.subscription_status === 'active' ? 'default' : 'destructive'}>
                      {biz.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {biz.trial_ends_at ? format(new Date(biz.trial_ends_at), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>{format(new Date(biz.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="flex gap-1">
                    <Link to={`/superadmin/businesses/${biz.id}`}>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(biz)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription: {editBiz?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trial Ends At</Label>
              <Input
                type="date"
                value={editTrialEnds}
                onChange={(e) => setEditTrialEnds(e.target.value)}
              />
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessList;
