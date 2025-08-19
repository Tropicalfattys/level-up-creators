
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Upload, FileText, Image, Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface MessageAttachmentsProps {
  messageId?: string;
  attachments?: Attachment[];
  onAttachmentAdd?: (attachment: Attachment) => void;
  canUpload?: boolean;
}

export const MessageAttachments = ({ 
  messageId, 
  attachments = [], 
  onAttachmentAdd, 
  canUpload = true 
}: MessageAttachmentsProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `message-attachments/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const attachment: Attachment = {
        id: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl
      };

      return attachment;
    },
    onSuccess: (attachment) => {
      toast.success('File uploaded successfully');
      onAttachmentAdd?.(attachment);
      queryClient.invalidateQueries({ queryKey: ['booking-messages', messageId] });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    }
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported');
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadFile = async (attachment: Attachment) => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (type.includes('word')) return 'Word';
    if (type === 'text/plain') return 'Text';
    if (type.includes('zip')) return 'Archive';
    return 'File';
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Attach File'}
          </Button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(attachment.type)}
                      </Badge>
                      <span>{formatFileSize(attachment.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(attachment)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Image Preview */}
              {attachment.type.startsWith('image/') && (
                <div className="mt-2">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-full max-h-40 rounded border object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
