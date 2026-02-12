import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Box, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';

export const TabNavigation = () => {
  const location = useLocation();
  const { isOwner, isAdmin, isDriver } = useBusiness();

  if (isDriver && !isOwner && !isAdmin) {
    return null;
  }

  const tabs = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/products', label: 'Products', icon: Box },
    ...(isOwner ? [{ to: '/team', label: 'Team', icon: Users }] : []),
  ];

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 border-b-2 transition-all duration-200 whitespace-nowrap text-sm',
                  isActive
                    ? 'border-accent text-accent font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
