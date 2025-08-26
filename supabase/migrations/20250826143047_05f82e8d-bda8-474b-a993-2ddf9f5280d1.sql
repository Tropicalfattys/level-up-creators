
-- Create job_postings table
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  role_overview TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table (following contact_messages pattern)
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active job postings
CREATE POLICY "Active job postings are viewable by everyone" 
  ON public.job_postings 
  FOR SELECT 
  USING (active = true);

-- Admins can manage all job postings
CREATE POLICY "Admins can manage job postings" 
  ON public.job_postings 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Add RLS policies for job_applications (following contact_messages pattern)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can create job applications
CREATE POLICY "Anyone can create job applications" 
  ON public.job_applications 
  FOR INSERT 
  WITH CHECK (true);

-- Admins can view all job applications
CREATE POLICY "Admins can view all job applications" 
  ON public.job_applications 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can update job application status
CREATE POLICY "Admins can update job applications" 
  ON public.job_applications 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Create update trigger for job_postings
CREATE OR REPLACE FUNCTION public.update_job_postings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_postings_updated_at();

-- Insert initial job postings from the provided content
INSERT INTO public.job_postings (title, role_overview, responsibilities, qualifications, sort_order) VALUES
(
  'Full-Stack Developer',
  'As a Full-Stack Developer, you''ll play a key role in building new features, improving performance, and scaling our crypto-first creator platform. You''ll work closely with product, design, and network teams to deliver seamless user experiences and secure blockchain integrations.',
  '["Develop and maintain both frontend and backend systems", "Integrate blockchain payment and escrow flows", "Write clean, secure, and scalable code", "Collaborate with designers to deliver pixel-perfect UI/UX", "Debug, test, and deploy new features"]'::jsonb,
  '["Strong experience with Node.js, TypeScript, and React", "Familiarity with web3.js, ethers.js, or other blockchain libraries", "Experience with SQL/NoSQL databases", "Understanding of API design and REST/GraphQL", "Prior experience building crypto/web3 applications is a plus"]'::jsonb,
  1
),
(
  'Frontend Developer (React + TypeScript)',
  'We''re looking for a frontend developer with an eye for detail to bring our product to life. You''ll be responsible for turning design concepts into highly interactive, responsive, and user-friendly interfaces.',
  '["Develop responsive, mobile-first web pages with React + TypeScript", "Optimize UI performance and load speeds", "Ensure cross-browser compatibility", "Work with designers to create intuitive user experiences"]'::jsonb,
  '["Expert in React, TypeScript, HTML, CSS, Tailwind/Styled Components", "Experience with Next.js or similar SSR frameworks a plus", "Knowledge of state management tools (Redux, Zustand, etc.)", "Passion for great design and UX"]'::jsonb,
  2
),
(
  'Network Engineer',
  'As our Network Engineer, you''ll help build and maintain the backend infrastructure that supports secure blockchain payments, real-time messaging, and smooth content delivery.',
  '["Design, implement, and manage network architecture", "Ensure uptime, scalability, and security of backend systems", "Support integration of blockchain escrow wallets", "Monitor system performance and optimize for speed"]'::jsonb,
  '["Strong background in cloud platforms (AWS, GCP, or Azure)", "Knowledge of network security protocols, firewalls, and monitoring tools", "Familiarity with Docker, Kubernetes, CI/CD pipelines", "Experience working with crypto nodes/APIs is highly desirable"]'::jsonb,
  3
),
(
  'UI/UX Designer',
  'We''re seeking a creative designer to craft intuitive, modern, and clean interfaces for our crypto creator platform. You''ll ensure users can discover, book, and pay creators seamlessly.',
  '["Create wireframes, mockups, and user flows", "Collaborate with developers to implement designs", "Conduct usability testing and gather feedback", "Maintain a consistent visual identity across the product"]'::jsonb,
  '["Proficiency with Figma, Sketch, or Adobe XD", "Strong portfolio of web/app design projects", "Experience designing for web3/crypto products is a bonus", "Understanding of responsive design principles"]'::jsonb,
  4
),
(
  'Business Development Lead',
  'As Business Development Lead, you''ll drive partnerships, onboard new creators, and grow platform adoption. You''ll be the face of our platform to influencers, agencies, and crypto-native projects.',
  '["Identify and secure partnerships with top crypto influencers", "Develop business strategies to expand creator and fan adoption", "Negotiate deals and collaborations", "Track KPIs and growth metrics"]'::jsonb,
  '["Proven experience in business development, partnerships, or sales", "Network within the crypto/Web3 creator ecosystem", "Strong communication and negotiation skills", "Passion for building communities and markets"]'::jsonb,
  5
),
(
  'Community Liaison',
  'We''re looking for community builders who live and breathe crypto culture. As a Community Liaison, you''ll help grow, moderate, and energize our community across Twitter, Discord, and Telegram.',
  '["Engage with users and creators across social channels", "Organize AMAs, giveaways, and content campaigns", "Collect and report community feedback to the product team", "Build strong relationships with early adopters"]'::jsonb,
  '["Experience in community management or social media", "Familiarity with Discord, Telegram, and Twitter dynamics", "Deep understanding of crypto culture, memes, and trends", "Strong written communication skills"]'::jsonb,
  6
);
