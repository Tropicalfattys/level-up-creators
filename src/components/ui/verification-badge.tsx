import { supabase } from '@/integrations/supabase/client';

interface VerificationBadgeProps {
  verified?: boolean;
  className?: string;
}

export const VerificationBadge = ({ verified = false, className = "" }: VerificationBadgeProps) => {
  if (!verified) return null;

  const { data } = supabase
    .storage
    .from('icons')
    .getPublicUrl('Verified.png');

  return (
    <img 
      src={data.publicUrl} 
      alt="Verified" 
      className={`inline-block w-3 h-3 ml-1 ${className}`}
      title="Verified Creator"
    />
  );
};