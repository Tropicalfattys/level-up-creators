import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Code, Globe, Palette, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const jobPositions = [
  {
    id: 'full-stack-developer',
    title: 'Full-Stack Developer',
    icon: Code,
    overview: "As a Full-Stack Developer, you'll play a key role in building new features, improving performance, and scaling our crypto-first creator platform. You'll work closely with product, design, and network teams to deliver seamless user experiences and secure blockchain integrations.",
    responsibilities: [
      'Develop and maintain both frontend and backend systems',
      'Integrate blockchain payment and escrow flows',
      'Write clean, secure, and scalable code',
      'Collaborate with designers to deliver pixel-perfect UI/UX',
      'Debug, test, and deploy new features'
    ],
    qualifications: [
      'Strong experience with Node.js, TypeScript, and React',
      'Familiarity with web3.js, ethers.js, or other blockchain libraries',
      'Experience with SQL/NoSQL databases',
      'Understanding of API design and REST/GraphQL',
      'Prior experience building crypto/web3 applications is a plus'
    ]
  },
  {
    id: 'frontend-developer',
    title: 'Frontend Developer (React + TypeScript)',
    icon: Code,
    overview: "We're looking for a frontend developer with an eye for detail to bring our product to life. You'll be responsible for turning design concepts into highly interactive, responsive, and user-friendly interfaces.",
    responsibilities: [
      'Develop responsive, mobile-first web pages with React + TypeScript',
      'Optimize UI performance and load speeds',
      'Ensure cross-browser compatibility',
      'Work with designers to create intuitive user experiences'
    ],
    qualifications: [
      'Expert in React, TypeScript, HTML, CSS, Tailwind/Styled Components',
      'Experience with Next.js or similar SSR frameworks a plus',
      'Knowledge of state management tools (Redux, Zustand, etc.)',
      'Passion for great design and UX'
    ]
  },
  {
    id: 'network-engineer',
    title: 'Network Engineer',
    icon: Globe,
    overview: "As our Network Engineer, you'll help build and maintain the backend infrastructure that supports secure blockchain payments, real-time messaging, and smooth content delivery.",
    responsibilities: [
      'Design, implement, and manage network architecture',
      'Ensure uptime, scalability, and security of backend systems',
      'Support integration of blockchain escrow wallets',
      'Monitor system performance and optimize for speed'
    ],
    qualifications: [
      'Strong background in cloud platforms (AWS, GCP, or Azure)',
      'Knowledge of network security protocols, firewalls, and monitoring tools',
      'Familiarity with Docker, Kubernetes, CI/CD pipelines',
      'Experience working with crypto nodes/APIs is highly desirable'
    ]
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    icon: Palette,
    overview: "We're seeking a creative designer to craft intuitive, modern, and clean interfaces for our crypto creator platform. You'll ensure users can discover, book, and pay creators seamlessly.",
    responsibilities: [
      'Create wireframes, mockups, and user flows',
      'Collaborate with developers to implement designs',
      'Conduct usability testing and gather feedback',
      'Maintain a consistent visual identity across the product'
    ],
    qualifications: [
      'Proficiency with Figma, Sketch, or Adobe XD',
      'Strong portfolio of web/app design projects',
      'Experience designing for web3/crypto products is a bonus',
      'Understanding of responsive design principles'
    ]
  },
  {
    id: 'business-development-lead',
    title: 'Business Development Lead',
    icon: TrendingUp,
    overview: "As Business Development Lead, you'll drive partnerships, onboard new creators, and grow platform adoption. You'll be the face of our platform to influencers, agencies, and crypto-native projects.",
    responsibilities: [
      'Identify and secure partnerships with top crypto influencers',
      'Develop business strategies to expand creator and fan adoption',
      'Negotiate deals and collaborations',
      'Track KPIs and growth metrics'
    ],
    qualifications: [
      'Proven experience in business development, partnerships, or sales',
      'Network within the crypto/Web3 creator ecosystem',
      'Strong communication and negotiation skills',
      'Passion for building communities and markets'
    ]
  },
  {
    id: 'community-liaison',
    title: 'Community Liaison',
    icon: Users,
    overview: "We're looking for community builders who live and breathe crypto culture. As a Community Liaison, you'll help grow, moderate, and energize our community across Twitter, Discord, and Telegram.",
    responsibilities: [
      'Engage with users and creators across social channels',
      'Organize AMAs, giveaways, and content campaigns',
      'Collect and report community feedback to the product team',
      'Build strong relationships with early adopters'
    ],
    qualifications: [
      'Experience in community management or social media',
      'Familiarity with Discord, Telegram, and Twitter dynamics',
      'Deep understanding of crypto culture, memes, and trends',
      'Strong written communication skills'
    ]
  }
];

export default function Careers() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    resumeUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    coverLetter: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      telegram: '',
      discord: ''
    }
  });
  const [submitted, setSubmitted] = useState(false);

  // Form submission mutation using the same safe pattern as ContactForm
  const submitApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any)
        .from('job_applications')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          job_posting_id: null, // We'll connect this to job_postings later in Phase 3
          resume_url: data.resumeUrl,
          portfolio_url: data.portfolioUrl,
          github_url: data.githubUrl,
          cover_letter: data.coverLetter,
          social_links: data.socialLinks,
          status: 'pending'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application submitted successfully! We\'ll review it and get back to you within 3-5 business days.');
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        resumeUrl: '',
        portfolioUrl: '',
        githubUrl: '',
        coverLetter: '',
        socialLinks: {
          twitter: '',
          linkedin: '',
          telegram: '',
          discord: ''
        }
      });
    },
    onError: (error) => {
      console.error('Job application error:', error);
      toast.error('Failed to submit application. Please try again.');
    }
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('social.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    submitApplication.mutate(formData);
  };

  // Success state display
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Application Submitted Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest in joining LeveledUp. We'll review your application and get back to you within 3-5 business days.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Submit Another Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">🚀 Careers at LeveledUp</h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            Join us in building the world's first crypto-native creator marketplace, where fans connect directly with influencers, creators, and thought leaders in Web3.
          </p>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            We're a fast-moving startup shaping the future of creator monetization through blockchain and decentralized payments. If you're passionate about crypto, community, and building scalable products that empower creators, we want you on our team.
          </p>
        </div>

        {/* Job Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">🌍 Open Positions</h2>
          <div className="grid gap-8 max-w-4xl mx-auto">
            {jobPositions.map((job, index) => {
              const Icon = job.icon;
              return (
                <Card key={job.id} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{index + 1}. {job.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      {job.overview}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Responsibilities:</h4>
                      <ul className="space-y-2">
                        {job.responsibilities.map((responsibility, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-muted-foreground">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Qualifications:</h4>
                      <ul className="space-y-2">
                        {job.qualifications.map((qualification, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-muted-foreground">{qualification}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Join Us */}
        <div className="mb-16 max-w-4xl mx-auto">
          <Card className="border-2 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">💡 Why Join Us?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Be part of a pioneering crypto-native creator platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Fully remote team with flexible hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Work alongside experienced builders in Web3</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Competitive compensation with token/equity opportunities</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Briefcase className="h-6 w-6" />
                📩 Ready to join?
              </CardTitle>
              <CardDescription>
                Fill out the form below with your resume, CV, GitHub, portfolio and social links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position Applying For *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobPositions.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume/CV URL</Label>
                    <Input
                      id="resume"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={formData.resumeUrl}
                      onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolioUrl}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={formData.githubUrl}
                    onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Social Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm">Twitter/X</Label>
                      <Input
                        id="twitter"
                        type="url"
                        placeholder="https://twitter.com/you"
                        value={formData.socialLinks.twitter}
                        onChange={(e) => handleInputChange('social.twitter', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/you"
                        value={formData.socialLinks.linkedin}
                        onChange={(e) => handleInputChange('social.linkedin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram" className="text-sm">Telegram</Label>
                      <Input
                        id="telegram"
                        type="text"
                        placeholder="@yourusername"
                        value={formData.socialLinks.telegram}
                        onChange={(e) => handleInputChange('social.telegram', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-sm">Discord</Label>
                      <Input
                        id="discord"
                        type="text"
                        placeholder="username#1234"
                        value={formData.socialLinks.discord}
                        onChange={(e) => handleInputChange('social.discord', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={submitApplication.isPending}
                >
                  {submitApplication.isPending ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
