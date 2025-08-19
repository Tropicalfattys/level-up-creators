
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryUploadProps {
  bookingId: string;
  onDelivered?: () => void;
}

export const DeliveryUpload = ({ bookingId, onDelivered }: DeliveryUploadProps) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deliverMutation = useMutation({
    mutationFn: async ({ deliverableUrls, note }: { deliverableUrls: string[]; note: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'delivered',
          deliverable_url: deliverableUrls.join(','),
          delivered_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Create a system message about delivery
      await supabase.from('messages').insert({
        booking_id: bookingId,
        from_user_id: user?.id,
        to_user_id: user?.id, // Will be updated to client_id in real implementation
        body: `Delivery completed: ${note || 'Files delivered'}`,
        attachments: { deliverables: deliverableUrls }
      });
    },
    onSuccess: () => {
      toast.success('Delivery uploaded successfully!');
      setFiles(null);
      setDeliveryNote('');
      onDelivered?.();
      queryClient.invalidateQueries({ queryKey: ['creator-bookings'] });
    },
    onError: (error) => {
      console.error('Delivery error:', error);
      toast.error('Failed to upload delivery');
    }
  });

  const handleFileUpload = async () => {
    if (!files || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const deliverableUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${bookingId}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('deliverables')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('deliverables')
          .getPublicUrl(fileName);

        deliverableUrls.push(publicUrl);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      await deliverMutation.mutateAsync({
        deliverableUrls,
        note: deliveryNote
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Delivery
        </CardTitle>
        <CardDescription>
          Upload your completed work and delivery notes for the client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Deliverable Files</label>
          <Input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.mp4,.mov"
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Accepted formats: PDF, DOC, ZIP, Images, Videos (max 50MB per file)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Delivery Notes</label>
          <Textarea
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="Describe what you've delivered and any instructions for the client..."
            rows={3}
          />
        </div>

        {uploading && (
          <div>
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Uploading files... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        <Button
          onClick={handleFileUpload}
          disabled={!files || uploading || deliverMutation.isPending}
          className="w-full"
        >
          {uploading ? (
            'Uploading...'
          ) : deliverMutation.isPending ? (
            'Marking as Delivered...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Delivery
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
