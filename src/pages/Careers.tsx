
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Briefcase, Users, Globe, Zap, FileText, Github, ExternalLink } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  role_overview: string;
  responsibilities: string[];
  qualifications: string[];
  active: boolean;
  sort_order: number;
}

interface JobApplicationForm {
  name: string;
  email: string;
  phone: string;
  job_posting_id: string;
  cover_letter: string;
  resume_url: string;
  portfolio_url: string;
  github_url: string;
  social_links: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
  };
}

const Careers = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobApplicationForm>({
    name: '',
    email: '',
    phone: '',
    job_posting_id: '',
    cover_letter: '',
    resume_url: '',
    portfolio_url: '',
    github_url: '',
    social_links: {}
  });

  useEffect(() => {
    fetchJobPostings();
  }, []);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      
      // Use type assertion approach to work around missing types
      const { data, error } = await (supabase as any)
        .from('job_postings')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching job postings:', error);
        toast.error('Failed to load job postings');
        return;
      }

      setJobPostings(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_posting_id) {
      toast.error('Please select a position to apply for');
      return;
    }

    try {
      setSubmitting(true);

      const applicationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        job_posting_id: formData.job_posting_id,
        cover_letter: formData.cover_letter || null,
        resume_url: formData.resume_url || null,
        portfolio_url: formData.portfolio_url || null,
        github_url: formData.github_url || null,
        social_links: formData.social_links,
        status: 'pending'
      };

      const { error } = await (supabase as any)
        .from('job_applications')
        .insert(applicationData);

      if (error) throw error;

      toast.success('Application submitted successfully! We\'ll be in touch soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        job_posting_id: '',
        cover_letter: '',
        resume_url: '',
        portfolio_url: '',
        github_url: '',
        social_links: {}
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted/20">
        <div className="container mx-auto px-6 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted/20">
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Zap className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Careers at LeveledUp
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join us in building the world's first crypto-native creator marketplace, where fans connect directly with influencers, creators, and thought leaders in Web3.
          </p>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            We're a fast-moving startup shaping the future of creator monetization through blockchain and decentralized payments. If you're passionate about crypto, community, and building scalable products that empower creators, we want you on our team.
          </p>
        </div>

        {/* Why Join Us Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">💡 Why Join Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Pioneer Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Be part of a pioneering crypto-native creator platform</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Fully Remote</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Fully remote team with flexible hours</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Expert Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Work alongside experienced builders in Web3</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Token Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Competitive compensation with token/equity opportunities</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">🌍 Open Positions</h2>
          <div className="space-y-8">
            {jobPostings.map((job, index) => (
              <Card key={job.id} className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-primary mb-2">
                        {index + 1}. {job.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        <strong>Role Overview:</strong><br />
                        {job.role_overview}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Responsibilities:</h4>
                    <ul className="space-y-2">
                      {job.responsibilities.map((responsibility, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          <span className="text-muted-foreground">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Qualifications:</h4>
                    <ul className="space-y-2">
                      {job.qualifications.map((qualification, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          <span className="text-muted-foreground">{qualification}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">📩 Ready to join?</CardTitle>
              <CardDescription>
                Fill out the form below with your resume, CV, GitHub, portfolio and social links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position Applied For *</Label>
                    <select
                      id="position"
                      value={formData.job_posting_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_posting_id: e.target.value }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
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
                </div>

                <div>
                  <Label htmlFor="cover_letter">Cover Letter</Label>
                  <Textarea
                    id="cover_letter"
                    value={formData.cover_letter}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Links & Portfolio</h4>
                  
                  <div>
                    <Label htmlFor="resume_url">Resume/CV URL</Label>
                    <div className="flex">
                      <FileText className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                      <Input
                        id="resume_url"
                        type="url"
                        value={formData.resume_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, resume_url: e.target.value }))}
                        placeholder="https://drive.google.com/... or dropbox link"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="portfolio_url">Portfolio URL</Label>
                    <div className="flex">
                      <ExternalLink className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                      <Input
                        id="portfolio_url"
                        type="url"
                        value={formData.portfolio_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <div className="flex">
                      <Github className="h-4 w-4 mt-3 mr-2 text-muted-foreground" />
                      <Input
                        id="github_url"
                        type="url"
                        value={formData.github_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Social Links</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.social_links.twitter || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          social_links: { ...prev.social_links, twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/yourusername"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.social_links.linkedin || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          social_links: { ...prev.social_links, linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/in/yourusername"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Careers;
