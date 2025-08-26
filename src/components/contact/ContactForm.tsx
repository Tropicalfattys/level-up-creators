
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const submitContact = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'open'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    },
    onError: (error) => {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    submitContact.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Message Sent Successfully!</h3>
          <p className="text-muted-foreground mb-6">
            Thank you for contacting us. We'll review your message and get back to you within 24 hours.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send us a Message</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="booking">Booking Issue</SelectItem>
                  <SelectItem value="payment">Payment Problem</SelectItem>
                  <SelectItem value="dispute">Dispute Resolution</SelectItem>
                  <SelectItem value="creator">Creator Application</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing Question</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Please describe your inquiry or issue in detail..."
                rows={6}
                required
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Response Times:</strong> We typically respond within 24 hours during business days. 
                For urgent issues related to active disputes or payment problems, we aim to respond within 4 hours.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitContact.isPending}
            >
              {submitContact.isPending ? 'Sending Message...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How long does it take to get approved as a creator?</h4>
              <p className="text-sm text-muted-foreground">
                Creator applications are typically reviewed within 2-3 business days. Pro tier applications may take up to 5 days due to additional verification.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">When are funds released from escrow?</h4>
              <p className="text-sm text-muted-foreground">
                Funds are automatically released 3 days after delivery unless the client opens a dispute or manually accepts the delivery earlier.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What payment methods do you support?</h4>
              <p className="text-sm text-muted-foreground">
                We accept USDC payments via MetaMask (Ethereum & Base networks) and Phantom (Solana network).
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">How do I open a dispute?</h4>
              <p className="text-sm text-muted-foreground">
                Clients can open disputes within 3 days of delivery through their booking dashboard. Our admin team will review and resolve within 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
