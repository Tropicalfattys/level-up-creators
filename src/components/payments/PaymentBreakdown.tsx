
import { Separator } from '@/components/ui/separator';

interface PaymentBreakdownProps {
  amount: number;
  showTitle?: boolean;
  className?: string;
}

export const PaymentBreakdown = ({ 
  amount, 
  showTitle = false, 
  className = "" 
}: PaymentBreakdownProps) => {
  const platformFee = amount * 0.15;
  const creatorReceives = amount * 0.85;

  return (
    <div className={`space-y-2 text-sm ${className}`}>
      {showTitle && (
        <>
          <h4 className="font-medium text-base">Payment Breakdown</h4>
          <Separator />
        </>
      )}
      <div className="flex justify-between">
        <span>Service Amount</span>
        <span>${amount} USDC</span>
      </div>
      <div className="flex justify-between">
        <span>Platform Fee (15%)</span>
        <span>${platformFee.toFixed(2)} USDC</span>
      </div>
      <div className="flex justify-between">
        <span>Creator Receives</span>
        <span className="font-medium">${creatorReceives.toFixed(2)} USDC</span>
      </div>
    </div>
  );
};
