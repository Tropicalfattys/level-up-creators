
import { ExternalLink, Upload, Package, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectStatusCardProps {
  booking: {
    id: string;
    status: string;
    proof_link?: string;
    proof_file_url?: string;
    proof_links?: Array<{ url: string; label: string }>;
    delivered_at?: string;
    accepted_at?: string;
    work_started_at?: string;
    payments?: Array<{ id: string; status: string; created_at: string }>;
  };
  onAccept?: () => void;
  onDispute?: () => void;
  onRetryPayment?: () => void;
  isLoading?: boolean;
}

export const ProjectStatusCard = ({ booking, onAccept, onDispute, onRetryPayment, isLoading }: ProjectStatusCardProps) => {
  const isMobile = useIsMobile();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'payment_rejected': return 'destructive';
      case 'delivered': return 'outline';
      case 'accepted': return 'outline';
      case 'released': return 'outline';
      case 'rejected_by_creator': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusProgress = (status: string, workStarted: boolean = false) => {
    // 4-step process: paid -> work started -> delivered -> accepted/released
    if (status === 'pending' || status === 'payment_rejected' || status === 'rejected_by_creator') return 0;
    if (status === 'paid') return workStarted ? 2 : 1;
    if (status === 'delivered') return 3;
    if (status === 'accepted' || status === 'released') return 4;
    return 0;
  };

  const isWorkStarted = !!booking.work_started_at;
  const currentProgress = getStatusProgress(booking.status, isWorkStarted);
  const hasRetryPayment = booking.payments && booking.payments.length > 1;

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
                  step <= currentProgress 
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
                {booking.status === 'paid' && isWorkStarted ? 'Work Started' : 
                 booking.status.replace('_', ' ')}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {booking.status === 'pending' && hasRetryPayment && 'Payment re-submitted - waiting for admin verification'}
              {booking.status === 'pending' && !hasRetryPayment && 'Waiting for payment confirmation'}
              {booking.status === 'payment_rejected' && 'Payment was rejected - please try again'}
              {booking.status === 'paid' && !isWorkStarted && 'Creator will start work soon'}
              {booking.status === 'paid' && isWorkStarted && 'Creator is working on your project'}
              {booking.status === 'delivered' && 'Project delivered - please review and accept'}
              {booking.status === 'accepted' && 'You accepted the delivery'}
              {booking.status === 'released' && 'Project completed successfully'}
              {booking.status === 'rejected_by_creator' && 'Creator rejected this work - you will receive a refund'}
            </p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Status-Specific Content */}
      <div className="space-y-4">
        {booking.status === 'pending' && hasRetryPayment && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Re-submitted</p>
              <p className="text-xs text-blue-600">Your payment has been re-submitted successfully! Please wait for admin verification.</p>
            </div>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
        )}
        
        {booking.status === 'pending' && !hasRetryPayment && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
            <div>
              <p className="text-sm font-medium text-yellow-800">Payment Pending</p>
              <p className="text-xs text-yellow-600">Waiting for payment confirmation</p>
            </div>
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
        )}
        
        {booking.status === 'payment_rejected' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
              <div>
                <p className="text-sm font-medium text-red-800">Payment Rejected</p>
                <p className="text-xs text-red-600">Your payment was rejected. Please contact support or try again.</p>
              </div>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            
            {/* Retry Payment Button */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => window.location.href = `/chat/${booking.id}`}
                variant="outline"
                className="flex-1"
              >
                Contact Support
              </Button>
              <Button 
                size="sm" 
                onClick={onRetryPayment}
                className="flex-1"
              >
                Retry Payment
              </Button>
            </div>
          </div>
        )}

        {booking.status === 'paid' && !isWorkStarted && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Confirmed</p>
              <p className="text-xs text-blue-600">Creator will start work on your project</p>
            </div>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
        )}
        
        {booking.status === 'paid' && isWorkStarted && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
            <div>
              <p className="text-sm font-medium text-yellow-800">Work In Progress</p>
              <p className="text-xs text-yellow-600">Creator is working on your project</p>
            </div>
            <Play className="h-4 w-4 text-yellow-600" />
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
            {(booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
              <div className="p-3 bg-background rounded border">
                <p className="text-sm font-medium mb-2">Deliverables:</p>
                <div className="space-y-2 mb-3">
                  {booking.proof_links?.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-muted-foreground font-medium">{link.label}:</span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm truncate"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                  
                  {booking.proof_link && !booking.proof_links?.length && (
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
                    <div className="space-y-2">
                      {booking.proof_file_url.split(',').map((fileUrl, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Upload className="h-3 w-3 text-blue-600" />
                          <a 
                            href={fileUrl.trim()} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action buttons for client */}
                <div className={isMobile ? 'flex flex-col space-y-2' : 'flex gap-2'}>
                  <Button 
                    size="sm" 
                    onClick={onAccept}
                    disabled={isLoading}
                    className={isMobile ? "w-full" : "flex-1"}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept Delivery
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onDispute}
                    disabled={isLoading}
                    className={isMobile ? "w-full" : "flex-1"}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Open Dispute
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {booking.status === 'rejected_by_creator' && (
          <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
            <div>
              <p className="text-sm font-medium text-red-800">Work Rejected by Creator</p>
              <p className="text-xs text-red-600">
                The creator has rejected your booking. You will receive a 95% refund (5% platform fee applies).
              </p>
            </div>
            <AlertCircle className="h-4 w-4 text-red-600" />
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
            {(booking.proof_links?.length || booking.proof_link || booking.proof_file_url) && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium mb-2 text-green-800">Final Deliverables:</p>
                <div className="space-y-2">
                  {booking.proof_links?.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">{link.label}:</span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-sm truncate"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                  
                  {booking.proof_link && !booking.proof_links?.length && (
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
                    <div className="space-y-2">
                      {booking.proof_file_url.split(',').map((fileUrl, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Upload className="h-3 w-3 text-green-600" />
                          <a 
                            href={fileUrl.trim()} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View File {booking.proof_file_url.split(',').length > 1 ? `${index + 1}` : ''}
                          </a>
                        </div>
                      ))}
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
