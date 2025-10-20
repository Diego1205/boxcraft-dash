import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Business {
  id: string;
  name: string;
  currency: 'USD' | 'CAD' | 'PEN';
  currency_symbol: string;
}

interface Profile {
  id: string;
  business_id: string | null;
  full_name: string | null;
  email: string | null;
}

interface UserRole {
  role: 'owner' | 'admin' | 'driver';
}

interface BusinessContextType {
  business: Business | null;
  profile: Profile | null;
  userRoles: UserRole[];
  isOwner: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  loading: boolean;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['business', profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single();
      if (error) throw error;
      return data as Business;
    },
    enabled: !!profile?.business_id,
  });

  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: Partial<Business>) => {
      if (!business) throw new Error('No business found');
      const { error } = await supabase
        .from('businesses')
        .update(data)
        .eq('id', business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });

  const isOwner = userRoles.some((r) => r.role === 'owner');
  const isAdmin = userRoles.some((r) => r.role === 'admin');
  const isDriver = userRoles.some((r) => r.role === 'driver');

  const formatCurrency = (amount: number) => {
    if (!business) return `$${amount.toFixed(2)}`;
    return `${business.currency_symbol} ${amount.toFixed(2)}`;
  };

  const loading = profileLoading || businessLoading || rolesLoading;

  return (
    <BusinessContext.Provider
      value={{
        business: business || null,
        profile: profile || null,
        userRoles,
        isOwner,
        isAdmin,
        isDriver,
        loading,
        updateBusiness: updateBusinessMutation.mutateAsync,
        formatCurrency,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};