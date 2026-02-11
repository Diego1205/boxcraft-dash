import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Box, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';

export const TabNavigation = () => {
  const location = useLocation();
  const { isOwner, isAdmin, isDriver } = useBusiness();

  // Drivers don't see the tab navigation - they have their own dashboard
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
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
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