
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Send, Users } from 'lucide-react';

const notificationSchema = z.object({
  type: z.string().min(1, 'Please select a notification type'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be less than 500 characters'),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const notificationTypes = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'system_update', label: 'System Update' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'policy_update', label: 'Policy Update' },
  { value: 'feature_release', label: 'Feature Release' },
];

export const AdminNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: '',
      title: '',
      message: '',
    },
  });

  const onSubmit = async (data: NotificationFormData) => {
    setIsLoading(true);
    
    try {
      console.log('Sending mass notification:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-mass-notification', {
        body: data
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to send notification', {
          description: error.message || 'An unexpected error occurred'
        });
        return;
      }

      console.log('Mass notification result:', result);
      
      toast.success('Mass notification sent successfully!', {
        description: `Notification sent to ${result.count} users`
      });

      // Reset form
      form.reset();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to send notification', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchedValues = form.watch();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Mass Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter notification title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notification message"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send to All Users'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {(watchedValues.title || watchedValues.message) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg border bg-zinc-900/50 border-zinc-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-white truncate">
                      {watchedValues.title || 'Notification Title'}
                    </h4>
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                    {watchedValues.message || 'Notification message will appear here...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
