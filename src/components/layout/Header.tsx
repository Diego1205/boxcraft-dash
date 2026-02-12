import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import khipuflowLogo from '@/assets/khipuflow-logo.png';

export const Header = () => {
  const { business, profile, isOwner, updateBusiness } = useBusiness();
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
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={khipuflowLogo} alt="KhipuFlow" className="h-8 w-auto" />
          {business?.name && business.name !== 'KhipuFlow' && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-primary-foreground/40">|</span>
              <span className="text-sm font-medium text-primary-foreground/80">{business.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-primary-foreground hover:bg-primary-foreground/10 ring-2 ring-accent/50">
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
