import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";

type UserRole = "owner" | "admin" | "driver";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  created_at: string;
}

const UserManagement = () => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { business, isOwner, profile } = useBusiness();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];

      // First get all roles for this business
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Then get profiles for those users
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone_number")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return roles.map((role) => {
        const profile = profileMap.get(role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          email: profile?.email || "Unknown",
          full_name: profile?.full_name || "Unknown",
          phone_number: profile?.phone_number || null,
          created_at: role.created_at,
        };
      }) as TeamMember[];
    },
    enabled: !!business?.id,
  });

  const removeUserMutation = useMutation({
    mutationFn: async (roleId: string) => {
      // First get the user_id from the role record
      const { data: roleData, error: fetchError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("id", roleId)
        .single();

      if (fetchError || !roleData) throw new Error("Role not found");

      // Delete the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId)
        .eq("business_id", business?.id);

      if (roleError) throw roleError;

      // Clear business_id from profile so they can be re-invited cleanly
      const { error: clearError } = await supabase.rpc('clear_user_business', {
        _user_id: roleData.user_id,
      });

      if (clearError) throw clearError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("User removed from team");
      setDeleteUserId(null);
    },
    onError: (error) => {
      console.error("Failed to remove user:", error);
      toast.error("Failed to remove user");
    },
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "driver":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "owner":
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  if (!isOwner) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only business owners can manage team members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and roles for {business?.name}
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No team members yet. Invite users to get started.
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    {member.phone_number || (
                      <span className="text-muted-foreground text-xs">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {member.role !== "owner" && member.user_id !== profile?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUserId(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from your team? They will lose access to
              all business data and can be re-invited later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && removeUserMutation.mutate(deleteUserId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
