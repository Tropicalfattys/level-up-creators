
-- First, let's check if we have a categories table, and if not, create one
-- This will be the single source of truth for all categories in the application

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text,
  description text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" 
  ON public.categories 
  FOR SELECT 
  USING (active = true);

-- Create policy for admin management
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" 
  ON public.categories 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Insert all categories to ensure they exist
INSERT INTO public.categories (value, label, description, sort_order) VALUES
('ama', 'Host an AMA', 'Live Ask Me Anything sessions on Telegram, Twitter, Discord', 1),
('twitter', 'Tweet Campaigns & Threads', 'Engaging Twitter content and viral thread creation', 2),
('video', 'Promo Videos', 'TikTok, Reels, YouTube Shorts for maximum reach', 3),
('tutorials', 'Product Tutorials', 'Step-by-step walkthroughs and educational content', 4),
('reviews', 'Product Reviews', 'Honest and detailed project reviews and analysis', 5),
('spaces', 'Host Twitter Spaces', 'Live audio engagement and community discussions', 6),
('instagram', 'Instagram Posts', 'Visual content creation for Instagram marketing', 7),
('facebook', 'Facebook Posts', 'Social media content for Facebook reach', 8),
('marketing', 'General Marketing', 'Full marketing campaign strategies and execution', 9),
('branding', 'Project Branding', 'Brand identity development and visual design', 10),
('discord', 'Discord Contests', 'Community engagement and contest management', 11),
('blogs', 'Blogs & Articles', 'Written content creation and thought leadership', 12),
('reddit', 'Reddit Posts', 'Community discussions and Reddit engagement', 13),
('memes', 'Meme Creation', 'Viral meme content and humorous marketing', 14),
('music', 'Music Production', 'Custom music, beats, jingles, and audio content creation', 15),
('other', 'Other Services', 'Unique and specialized services not covered elsewhere', 16)
ON CONFLICT (value) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
