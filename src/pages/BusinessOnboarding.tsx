import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { currencies, getCurrencySymbol, CurrencyType } from '@/lib/currencies';

const BusinessOnboarding = () => {
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: businessId, error } = await supabase.rpc('onboard_business', {
        _name: businessName,
        _currency: currency,
        _currency_symbol: getCurrencySymbol(currency),
      });

      if (error) throw error;

      toast.success('Business created successfully!');
      // Force full page reload to ensure BusinessContext loads new data
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to GiftBox Manager!</CardTitle>
          <CardDescription>Let's set up your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="My GiftBox Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(value: CurrencyType) => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Business'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;