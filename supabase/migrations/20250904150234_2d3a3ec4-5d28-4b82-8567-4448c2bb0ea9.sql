-- Create platform_wallets table for escrow wallet management
CREATE TABLE public.platform_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  icon_url TEXT,
  explorer_url TEXT,
  color_class TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active platform wallets" 
ON public.platform_wallets 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage platform wallets" 
ON public.platform_wallets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Insert existing platform wallet data
INSERT INTO public.platform_wallets (network, name, wallet_address, icon_url, explorer_url, color_class) VALUES
('ethereum', 'Ethereum', '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/eth_logo.png', 'https://etherscan.io/tx/', 'bg-blue-500'),
('base', 'Base', '0x4DEe7D9fa0E3e232AF7EfDF809E1fA5AdF4af61B', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/eth_logo.png', 'https://basescan.org/tx/', 'bg-blue-600'),
('solana', 'Solana', 'FeByoSMhWJpo4f6M333RvHAe7ssvDGkioGVJTNyN3ihg', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/solana_logo.png', 'https://solscan.io/tx/', 'bg-purple-600'),
('bsc', 'BSC', '0x30D1Bbf45BEB26fA704114b3B876FD715D3ef505', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/BSC_logo.png', 'https://bscscan.com/tx/', 'bg-yellow-500'),
('sui', 'Sui', '0x7895d5b72e5df22e707149f31051e993ab304334191b84acbb14503134e4c95e', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/SUI_LOGO.png', 'https://suiexplorer.com/txblock/', 'bg-cyan-500'),
('cardano', 'Cardano', 'addr1q98rwvzkmzjw20zh6uzw4yvkzhhsnl9rtdf9xzdy6xn58ddphkx64axgy5x8argzpv6hzyker4g7nlxdll4fq8q3ajvsn24vy3', 'https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/cardano_logo.png', 'https://cardanoscan.io/transaction/', 'bg-indigo-600');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_platform_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_wallets_updated_at
  BEFORE UPDATE ON public.platform_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_platform_wallets_updated_at();