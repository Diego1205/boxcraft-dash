import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
}

export const EmailConfirmationScreen = ({ email, onBack }: EmailConfirmationScreenProps) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Start with a 60 second cooldown
    setResendCooldown(60);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success('Verification email sent!');
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          We sent a verification link to
        </CardDescription>
        <p className="font-medium text-foreground mt-1">{email}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the link in your email to verify your account and get started.
          </p>
          <p className="text-sm text-muted-foreground">
            Don't see it? Check your spam folder.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0 || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend email in ${resendCooldown}s`
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend verification email
              </>
            )}
          </Button>

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Already verified?{' '}
          <button
            onClick={onBack}
            className="text-primary hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </CardContent>
    </Card>
  );
};
