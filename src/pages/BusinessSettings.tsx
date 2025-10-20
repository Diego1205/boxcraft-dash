import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

const BusinessSettings = () => {
  const { business, updateBusiness, isOwner } = useBusiness();
  const [businessName, setBusinessName] = useState(business?.name || '');
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'PEN'>(business?.currency || 'USD');
  const [loading, setLoading] = useState(false);

  if (!isOwner) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access business settings. Only business owners can modify these settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'CAD': return 'C$';
      case 'PEN': return 'S/';
      default: return '$';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateBusiness({
        name: businessName,
        currency,
        currency_symbol: getCurrencySymbol(currency),
      });
      toast.success('Business settings updated successfully');
    } catch (error: any) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Business Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your business configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your business information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                  <SelectItem value="PEN">Peruvian Sol (S/)</SelectItem>
                </SelectContent>
              </Select>
              
              {currency !== business?.currency && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Changing the currency will affect all prices in the system. Existing monetary values will remain the same numerically.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessSettings;