
-- Create a shopping cart table to track items before payment
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable Row-Level Security
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping cart access
CREATE POLICY "Users can view their own cart items" 
  ON public.shopping_cart 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their own cart" 
  ON public.shopping_cart 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their own cart" 
  ON public.shopping_cart 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add foreign key relationships (optional, for data integrity)
ALTER TABLE public.shopping_cart 
ADD CONSTRAINT fk_shopping_cart_service 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

ALTER TABLE public.shopping_cart 
ADD CONSTRAINT fk_shopping_cart_creator 
FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;
