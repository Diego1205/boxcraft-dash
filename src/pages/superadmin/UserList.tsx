import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Pencil } from 'lucide-react';

const UserList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['superadmin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['superadmin-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['superadmin-all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, business_id');
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const { error } = await supabase.functions.invoke('admin-update-profile', {
        body: {
          target_user_id: editUser.id,
          full_name: editName,
          email: editEmail,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User updated' });
      queryClient.invalidateQueries({ queryKey: ['superadmin-profiles'] });
      setEditUser(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const getBusinessName = (bizId: string | null) => {
    if (!bizId) return '—';
    const biz = businesses.find((b: any) => b.id === bizId);
    return biz?.name || '—';
  };

  const getUserRoles = (userId: string) => {
    return roles
      .filter((r: any) => r.user_id === userId)
      .map((r: any) => r.role)
      .join(', ');
  };

  const filtered = profiles.filter((p: any) => {
    const term = search.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term)
    );
  });

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditName(user.full_name || '');
    setEditEmail(user.email || '');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">All Users ({profiles.length})</h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{getBusinessName(p.business_id)}</TableCell>
                  <TableCell><Badge variant="outline">{getUserRoles(p.id) || 'none'}</Badge></TableCell>
                  <TableCell>{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
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

export default UserList;
