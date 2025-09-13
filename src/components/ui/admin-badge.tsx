import { supabase } from '@/integrations/supabase/client';

interface AdminBadgeProps {
  role?: string;
  className?: string;
}

export const AdminBadge = ({ role, className = "" }: AdminBadgeProps) => {
  if (role !== 'admin') return null;

  const { data } = supabase
    .storage
    .from('icons')
    .getPublicUrl('Admin-Tag.png');

  return (
    <img 
      src={data.publicUrl} 
      alt="Admin" 
      className={`inline-block w-5 h-5 ml-1 ${className}`}
      title="Admin"
    />
  );
};