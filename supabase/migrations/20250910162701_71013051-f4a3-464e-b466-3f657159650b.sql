-- Create subscription_wallets table for creator tier subscription payments
CREATE TABLE public.subscription_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network text NOT NULL,
  name text NOT NULL,
  wallet_address text NOT NULL,
  icon_url text,
  explorer_url text,
  color_class text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable Row Level Security
ALTER TABLE public.subscription_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription wallets (same as platform_wallets)
CREATE POLICY "Admins can manage subscription wallets" 
ON public.subscription_wallets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "Everyone can view active subscription wallets" 
ON public.subscription_wallets 
FOR SELECT 
USING (active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_wallets_updated_at
  BEFORE UPDATE ON public.subscription_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_wallets_updated_at();

-- Insert the provided subscription wallet addresses
INSERT INTO public.subscription_wallets (network, name, wallet_address, icon_url, explorer_url, color_class) VALUES
('solana', 'Solana', 'C11w3Q19fEPSVCCUPL7fxGTPvthAFer3QMyaM52mW97a', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/solana_logo.png', 'https://solscan.io/tx/', 'bg-purple-600'),
('ethereum', 'Ethereum', '0xc71505A062f1506035a4DedBe20BB98B4EbF39b4', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/eth_logo.png', 'https://etherscan.io/tx/', 'bg-blue-500'),
('sui', 'Sui', '0x5387a549893a356ce63ec7cb417c002ba0564ef3c9e54029718096f4ba9f416e', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/SUI_LOGO.png', 'https://suiexplorer.com/txblock/', 'bg-cyan-500'),
('bsc', 'BSC', '0xA7dEad4E0a4aC2367a8e5A7188C093e46e0AA06b', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/BSC_logo.png', 'https://bscscan.com/tx/', 'bg-yellow-500'),
('cardano', 'Cardano', 'addr1q99zz8h37xgnvn0g9szx9c8tjt2jg9uyrkv397s4hjp323zf5l0wmwpchcf0gpa2nntxmprxt0w3gnpg348k9z30z0tsuttpqc', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/cardano_logo.png', 'https://cardanoscan.io/transaction/', 'bg-indigo-600');