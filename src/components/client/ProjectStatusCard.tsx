
import { ExternalLink, Upload, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectStatusCardProps {
  booking: {
    id: string;
    status: string;
    proof_link?: string;
    proof_file_url?: string;
    delivered_at?: string;
    accepted_at?: string;
  };
  onAccept?: () => void;
  onDispute?: () => void;
  isLoading?: boolean;
}

export const ProjectStatusCard = ({ booking, onAccept, onDispute, isLoading }: ProjectStatusCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'in_progress': return 'secondary';
      case 'delivered': return 'outline';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusProgress = (status: string) => {
    const statuses = ['paid', 'in_progress', 'delivered', 'accepted'];
    return statuses.indexOf(status) + 1;
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Project Status
        </h4>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Progress:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step <= getStatusProgress(booking.status) 
                    ? 'bg-primary' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Status Display */}
      <div className="mb-4 p-3 bg-background rounded border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium capitalize flex items-center gap-2">
              <Badge variant={getStatusColor(booking.status)}>
                {booking.status.replace('_', ' ')}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {booking.status === 'paid' && 'Creator will start work soon'}
              {booking.status === 'in_progress' && 'Creator is working on your project'}
              {booking.status === 'delivered' && 'Project delivered - please review and accept'}
              {booking.status === 'accepted' && 'You accepted the delivery'}
              {booking.status === 'released' && 'Project completed successfully'}
            </p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Status-Specific Content */}
      <div className="space-y-4">
        {booking.status === 'paid' && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Confirmed</p>
              <p className="text-xs text-blue-600">Creator will start work on your project</p>
            </div>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
        )}
        
        {booking.status === 'in_progress' && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
            <div>
              <p className="text-sm font-medium text-yellow-800">Work In Progress</p>
              <p className="text-xs text-yellow-600">Creator is working on your project</p>
            </div>
            <Package className="h-4 w-4 text-yellow-600" />
          </div>
        )}
        
        {booking.status === 'delivered' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-200">
              <div>
                <p className="text-sm font-medium text-orange-800">Work Delivered</p>
                <p className="text-xs text-orange-600">Please review the deliverables and take action</p>
              </div>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
            
            {/* Display proof links */}
            {(booking.proof_link || booking.proof_file_url) && (
              <div className="p-3 bg-background rounded border">
                <p className="text-sm font-medium mb-2">Deliverables:</p>
                <div className="space-y-2 mb-3">
                  {booking.proof_link && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-blue-600" />
                      <a 
                        href={booking.proof_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Social Proof Link
                      </a>
                    </div>
                  )}
                  {booking.proof_file_url && (
                    <div className="flex items-center gap-2">
                      <Upload className="h-3 w-3 text-blue-600" />
                      <a 
                        href={booking.proof_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Uploaded File
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Action buttons for client */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={onAccept}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept Delivery
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onDispute}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Open Dispute
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {(booking.status === 'accepted' || booking.status === 'released') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-800">Project Completed</p>
                <p className="text-xs text-green-600">
                  {booking.status === 'accepted' ? 'You accepted the delivery' : 'Project completed successfully'}
                </p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            
            {/* Display final deliverables */}
            {(booking.proof_link || booking.proof_file_url) && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium mb-2 text-green-800">Final Deliverables:</p>
                <div className="space-y-2">
                  {booking.proof_link && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-green-600" />
                      <a 
                        href={booking.proof_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Social Proof Link
                      </a>
                    </div>
                  )}
                  {booking.proof_file_url && (
                    <div className="flex items-center gap-2">
                      <Upload className="h-3 w-3 text-green-600" />
                      <a 
                        href={booking.proof_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Uploaded File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
