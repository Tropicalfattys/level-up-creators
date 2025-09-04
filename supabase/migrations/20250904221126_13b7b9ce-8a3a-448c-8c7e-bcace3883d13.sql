-- Add new categories: TikTok, LinkedIn, Reels, and Contest
INSERT INTO categories (value, label, description, sort_order, active) VALUES
('tiktok', 'TikTok Content', 'Short-form video content creation for TikTok marketing', 17, true),
('linkedin', 'LinkedIn Posts', 'Professional content and networking posts for LinkedIn', 18, true),
('reels', 'Reels Creation', 'Instagram and Facebook Reels for social media engagement', 19, true),
('contest', 'Contest Management', 'Social media contests, giveaways, and community engagement campaigns', 20, true);