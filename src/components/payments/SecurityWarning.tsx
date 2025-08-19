
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecurityWarningProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export const SecurityWarning = ({ accepted, onAcceptChange }: SecurityWarningProps) => {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Important Security Notice:</p>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>This is a simulated payment system for demonstration purposes</li>
            <li>No real cryptocurrency will be transferred</li>
            <li>Always verify payment details in production environments</li>
            <li>Never share your private keys or seed phrases</li>
          </ul>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => onAcceptChange(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">I understand and acknowledge this security notice</span>
          </label>
        </div>
      </AlertDescription>
    </Alert>
  );
};
