import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, LogOut, Settings, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';

export const Header = () => {
  const { business, profile, isOwner, isAdmin, updateBusiness } = useBusiness();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleCurrencyChange = async (newCurrency: 'USD' | 'CAD' | 'PEN') => {
    const currencySymbols = { USD: '$', CAD: 'C$', PEN: 'S/' };
    try {
      await updateBusiness({
        currency: newCurrency,
        currency_symbol: currencySymbols[newCurrency],
      });
      toast.success('Currency updated successfully');
    } catch (error: any) {
      toast.error('Failed to update currency');
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{business?.name || 'KhipuFlow'}</h1>
            <p className="text-xs text-muted-foreground">Manage inventory, products, and orders</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(isOwner || isAdmin) && business && (
            <Select value={business.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="PEN">PEN (S/)</SelectItem>
              </SelectContent>
            </Select>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem onClick={() => navigate('/business-settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Business Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProfileEditDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </header>
  );
};