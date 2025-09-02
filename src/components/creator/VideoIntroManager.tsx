
import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Trash2, Video, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const VideoIntroManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch creator data to check tier
  const { data: creator } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  const isPro = creator?.tier === 'pro';
  const hasIntroVideo = creator?.intro_video_url;

  const handleFileSelect = () => {
    if (!isPro) {
      toast.error('Video intro is only available for Pro creators');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !isPro) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid video file (MP4, MOV, or WebM)');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `intro-videos/${user.id}/intro.${fileExt}`;

      // Delete existing video if it exists
      if (hasIntroVideo) {
        const existingPath = hasIntroVideo.split('/').slice(-2).join('/');
        await supabase.storage.from('deliverables').remove([existingPath]);
      }

      // Upload new video
      const { data, error } = await supabase.storage
        .from('deliverables')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('deliverables')
        .getPublicUrl(fileName);

      // Update creator profile with new video URL
      const { error: updateError } = await supabase
        .from('creators')
        .update({ intro_video_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Video intro uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user.id] });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteVideo = async () => {
    if (!hasIntroVideo || !user?.id) return;

    try {
      // Extract file path from URL
      const url = new URL(hasIntroVideo);
      const filePath = url.pathname.split('/').slice(-2).join('/');
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('deliverables')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update creator profile
      const { error: updateError } = await supabase
        .from('creators')
        .update({ intro_video_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Video intro deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user.id] });
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete video: ' + error.message);
    }
  };

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Pro Feature: Video Intro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Crown className="h-4 w-4 mr-1" />
                Pro Only
              </Badge>
            </div>
            <Video className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro Creator</h3>
              <p className="text-muted-foreground mb-4">
                Upload a video introduction to showcase your personality and build trust with potential clients. 
                This feature is exclusive to Pro Creator members.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Pro Creator benefits include:
              </p>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                <li>• Upload video introductions</li>
                <li>• Priority search placement</li>
                <li>• Featured listing on homepage</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Intro
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasIntroVideo ? (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              >
                <source src={hasIntroVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={handleFileSelect}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace Video
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteVideo}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Video Intro</h3>
              <p className="text-muted-foreground mb-4">
                Share a personal video introduction to help clients get to know you better. 
                Your video will appear on your profile page.
              </p>
              <Button
                onClick={handleFileSelect}
                disabled={isUploading}
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Video File
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Supported formats: MP4, MOV, WebM • Max size: 50MB
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
