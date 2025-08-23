
-- Add social media and link columns to users table
ALTER TABLE public.users 
ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN website_url TEXT,
ADD COLUMN portfolio_url TEXT,
ADD COLUMN youtube_url TEXT;

-- Add a comment to document the social_links structure
COMMENT ON COLUMN public.users.social_links IS 'JSON object containing social media links: {"twitter": "url", "facebook": "url", "instagram": "url", "telegram": "url", "discord": "url", "medium": "url", "linkedin": "url"}';
