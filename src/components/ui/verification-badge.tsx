import { supabase } from '@/integrations/supabase/client';

interface VerificationBadgeProps {
  verified?: boolean;
  className?: string;
  role?: string;
}

export const VerificationBadge = ({ verified = false, className = "", role }: VerificationBadgeProps) => {
  // Don't show verification badge for admins (they get the red admin badge instead)
  if (!verified || role === 'admin') return null;

  const { data } = supabase
    .storage
    .from('icons')
    .getPublicUrl('Verified.png');

  return (
    <img 
      src={data.publicUrl} 
      alt="Verified" 
      className={`inline-block w-5 h-5 ml-1 ${className}`}
      title="Verified Creator"
    />
  );
};