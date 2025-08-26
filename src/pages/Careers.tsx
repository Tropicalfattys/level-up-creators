
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Briefcase, MapPin, Clock, Users, Rocket } from 'lucide-react';
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

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  portfolio_url: string;
  github_url: string;
  cover_letter: string;
  social_links: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
  };
}

export default function Careers() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [formData, setFormData] = useState<ApplicationForm>({
    name: '',
    email: '',
    phone: '',
    resume_url: '',
    portfolio_url: '',
    github_url: '',
    cover_letter: '',
    social_links: {}
  });
  const [submitting, setSubmitting] = useState(false);

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
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob) {
      toast.error('Please select a position to apply for');
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: selectedJob,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          resume_url: formData.resume_url,
          portfolio_url: formData.portfolio_url,
          github_url: formData.github_url,
          cover_letter: formData.cover_letter,
          social_links: formData.social_links,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        resume_url: '',
        portfolio_url: '',
        github_url: '',
        cover_letter: '',
        social_links: {}
      });
      setSelectedJob('');

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading careers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <Rocket className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold">
              Careers at <span className="text-primary">LeveledUp</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join us in building the world's first crypto-native creator marketplace, where fans connect 
            directly with influencers, creators, and thought leaders in Web3.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're a fast-moving startup shaping the future of creator monetization through blockchain 
            and decentralized payments. If you're passionate about crypto, community, and building 
            scalable products that empower creators, we want you on our team.
          </p>
        </div>
      </div>

      {/* Why Join Us Section */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">💡 Why Join Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Rocket className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Pioneer Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Be part of a pioneering crypto-native creator platform
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Fully Remote</h3>
                <p className="text-sm text-muted-foreground">
                  Fully remote team with flexible hours
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Experienced Team</h3>
                <p className="text-sm text-muted-foreground">
                  Work alongside experienced builders in Web3
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Great Compensation</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive compensation with token/equity opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🌍 Open Positions</h2>
            <p className="text-muted-foreground">Discover exciting opportunities to grow with us</p>
          </div>

          <div className="grid gap-8 max-w-4xl mx-auto">
            {jobPostings.map((job, index) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2 flex items-center">
                        <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        {job.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {job.role_overview}
                      </CardDescription>
                    </div>
                    <Briefcase className="h-6 w-6 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-primary">Responsibilities:</h4>
                      <ul className="space-y-1 text-sm">
                        {job.responsibilities.map((responsibility, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {responsibility}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-primary">Qualifications:</h4>
                      <ul className="space-y-1 text-sm">
                        {job.qualifications.map((qualification, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {qualification}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">📩 Ready to Join?</h2>
              <p className="text-muted-foreground">
                Fill out the form below with your resume, CV, GitHub, portfolio and social links.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="position" className="text-base font-semibold">
                      Position *
                    </Label>
                    <select
                      id="position"
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full mt-2 p-3 border rounded-lg bg-background"
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-semibold">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-base font-semibold">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-2"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resume" className="text-base font-semibold">
                        Resume/CV URL
                      </Label>
                      <Input
                        id="resume"
                        value={formData.resume_url}
                        onChange={(e) => handleInputChange('resume_url', e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio" className="text-base font-semibold">
                        Portfolio URL
                      </Label>
                      <Input
                        id="portfolio"
                        value={formData.portfolio_url}
                        onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="github" className="text-base font-semibold">
                      GitHub URL
                    </Label>
                    <Input
                      id="github"
                      value={formData.github_url}
                      onChange={(e) => handleInputChange('github_url', e.target.value)}
                      placeholder="https://github.com/username"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Social Links
                    </Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.social_links.twitter || ''}
                          onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                          placeholder="@username"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.social_links.linkedin || ''}
                          onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/username"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telegram" className="text-sm">Telegram</Label>
                        <Input
                          id="telegram"
                          value={formData.social_links.telegram || ''}
                          onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                          placeholder="@username"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cover-letter" className="text-base font-semibold">
                      Cover Letter
                    </Label>
                    <Textarea
                      id="cover-letter"
                      value={formData.cover_letter}
                      onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                      placeholder="Tell us why you're interested in this position and what you can bring to our team..."
                      className="mt-2 min-h-32"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-lg"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
