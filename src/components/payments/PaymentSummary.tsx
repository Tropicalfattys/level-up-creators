
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Clock, User } from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface PaymentSummaryProps {
  serviceTitle: string;
  creatorHandle: string;
  verified?: boolean;
  role?: string;
  amount: number;
  currency: string;
  deliveryDays?: number;
  platformFee?: number;
}

export const PaymentSummary = ({
  serviceTitle,
  creatorHandle,
  verified,
  role,
  amount,
  currency,
  deliveryDays,
  platformFee = 0
}: PaymentSummaryProps) => {
  const total = amount + platformFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{serviceTitle}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>@{creatorHandle}</span>
                  <VerificationBadge verified={verified} role={role} />
                </div>
                {deliveryDays && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{deliveryDays} days delivery</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline">Service</Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee:</span>
              <span className="font-medium">{amount} {currency}</span>
            </div>
            
            {platformFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span className="font-medium">{platformFee} {currency}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-base font-semibold">
              <span>Total Amount:</span>
              <span>{total} {currency}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
