import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UserRole = "admin" | "driver";

export const InviteUserDialog = ({ open, onOpenChange }: InviteUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("driver");
  const { business } = useBusiness();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!business?.id) throw new Error("No business found");
      if (!email || !fullName) throw new Error("Email and name are required");

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        // User exists, add them to the business
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: existingUser.id,
          business_id: business.id,
          role: role,
        });

        if (roleError) throw roleError;
      } else {
        // New user - create account and assign role
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password: crypto.randomUUID(), // Temporary password
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Failed to create user");

        // Profile is created automatically via trigger
        // Now assign the role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          business_id: business.id,
          role: role,
        });

        if (roleError) throw roleError;

        // Update profile with business_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ business_id: business.id })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("User invited successfully");
      setEmail("");
      setFullName("");
      setRole("driver");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to invite user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite a new user to join your team. They'll receive an email with instructions to set
            up their account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "admin"
                ? "Admins can manage inventory, products, and orders"
                : "Drivers can only confirm deliveries"}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
