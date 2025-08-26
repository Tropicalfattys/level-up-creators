
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { jobApplicationSchema, validateInput } from '@/lib/validation';
import { handleSupabaseError, showErrorToast } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Clock, Users, Star, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface JobPosting {
  id: string;
  title: string;
  role_overview: string;
  responsibilities: string[];
  qualifications: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
}

interface JobApplicationForm {
  job_posting_id: string;
  name: string;
  email: string;
  phone?: string;
  portfolio_url?: string;
  github_url?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    discord?: string;
    telegram?: string;
  };
  cover_letter: string;
}

export default function Careers() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const form = useForm<JobApplicationForm>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      job_posting_id: '',
      name: '',
      email: '',
      phone: '',
      portfolio_url: '',
      github_url: '',
      social_links: {
        twitter: '',
        linkedin: '',
        discord: '',
        telegram: ''
      },
      cover_letter: ''
    }
  });

  useEffect(() => {
    fetchJobPostings();
  }, []);

  const fetchJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setJobPostings(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      showErrorToast(handleSupabaseError(error as Error));
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading resume:', error);
      showErrorToast('Failed to upload resume. Please try again.');
      return null;
    }
  };

  const onSubmit = async (data: JobApplicationForm) => {
    if (!selectedJob) {
      toast.error('Please select a position to apply for');
      return;
    }

    setSubmitting(true);
    try {
      // Validate the form data
      const validation = validateInput(jobApplicationSchema, { ...data, job_posting_id: selectedJob });
      if (!validation.success) {
        showErrorToast(validation.errors.join(', '));
        return;
      }

      // Upload resume if provided
      let resumeUrl = null;
      if (resumeFile) {
        resumeUrl = await uploadResume(resumeFile);
        if (!resumeUrl) return; // Upload failed
      }

      // Submit application
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: selectedJob,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          portfolio_url: data.portfolio_url || null,
          github_url: data.github_url || null,
          social_links: data.social_links || {},
          cover_letter: data.cover_letter,
          resume_url: resumeUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Application submitted successfully!', {
        description: 'We\'ll review your application and get back to you soon.'
      });

      // Reset form
      form.reset();
      setSelectedJob('');
      setResumeFile(null);

    } catch (error) {
      console.error('Error submitting application:', error);
      showErrorToast(handleSupabaseError(error as Error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }

      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setResumeFile(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">🚀 Careers at LeveledUp</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join us in building the world's first crypto-native creator marketplace, where fans connect directly with influencers, creators, and thought leaders in Web3.
          </p>
          <p className="text-muted-foreground">
            We're a fast-moving startup shaping the future of creator monetization through blockchain and decentralized payments. If you're passionate about crypto, community, and building scalable products that empower creators, we want you on our team.
          </p>
        </div>

        <Separator className="mb-12" />

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            🌍 Open Positions
            <Badge variant="secondary" className="ml-2">
              {jobPostings.length} positions
            </Badge>
          </h2>

          <div className="space-y-8">
            {jobPostings.map((job, index) => (
              <Card key={job.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{index + 1}. {job.title}</CardTitle>
                      <p className="text-muted-foreground">{job.role_overview}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      Full-time
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Responsibilities:
                    </h4>
                    <ul className="space-y-2">
                      {job.responsibilities.map((responsibility, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span>•</span>
                          <span>{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Qualifications:
                    </h4>
                    <ul className="space-y-2">
                      {job.qualifications.map((qualification, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span>•</span>
                          <span>{qualification}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Why Join Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">💡 Why Join Us?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🌟 Pioneer the Future</h3>
                <p className="text-sm text-muted-foreground">
                  Be part of a pioneering crypto-native creator platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🏠 Remote First</h3>
                <p className="text-sm text-muted-foreground">
                  Fully remote team with flexible hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">🤝 Expert Team</h3>
                <p className="text-sm text-muted-foreground">
                  Work alongside experienced builders in Web3
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">💰 Great Compensation</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive compensation with token/equity opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Application Form */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">📩 Ready to join?</h2>
          <p className="text-muted-foreground mb-8">
            Fill out the form below with your resume, CV, GitHub, portfolio and social links.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Job Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Position Selection */}
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <select
                    id="position"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                    required
                  >
                    <option value="">Select a position</option>
                    {jobPostings.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Your full name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="your.email@example.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume/CV</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {resumeFile && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {resumeFile.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your resume in PDF or Word format (max 5MB)
                  </p>
                </div>

                {/* Links */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      {...form.register('portfolio_url')}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub URL</Label>
                    <Input
                      id="github"
                      {...form.register('github_url')}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <Label>Social Links</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                      <Input
                        id="twitter"
                        {...form.register('social_links.twitter')}
                        placeholder="https://twitter.com/yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        {...form.register('social_links.linkedin')}
                        placeholder="https://linkedin.com/in/yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-sm">Discord</Label>
                      <Input
                        id="discord"
                        {...form.register('social_links.discord')}
                        placeholder="username#1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="text-sm">Telegram</Label>
                      <Input
                        id="telegram"
                        {...form.register('social_links.telegram')}
                        placeholder="@yourusername"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <Label htmlFor="cover_letter">Cover Letter *</Label>
                  <Textarea
                    id="cover_letter"
                    {...form.register('cover_letter')}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                  />
                  {form.formState.errors.cover_letter && (
                    <p className="text-sm text-destructive">{form.formState.errors.cover_letter.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !selectedJob}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
