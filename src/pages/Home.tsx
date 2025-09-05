
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, MessageSquare, Video, FileText, Megaphone, Instagram, Facebook, Zap, Hash, Palette, Trophy, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function Home() {
  const { user } = useAuth();

  // Fetch Pro creators for featured section
  const { data: proCreators = [], isLoading, error: proCreatorsError } = useQuery({
    queryKey: ['pro-creators'],
    queryFn: async () => {
      console.log('Fetching pro creators...');
      
      // Step 1: Get pro creators with user info
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creators')
        .select(`
          *,
          users!inner(handle, avatar_url)
        `)
        .eq('tier', 'pro')
        .eq('approved', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false });

      if (creatorsError) {
        console.error('Pro creators query error:', creatorsError);
        throw creatorsError;
      }

      console.log('Pro creators found:', creatorsData?.length || 0);

      // Step 2: Get service counts for each creator
      const creatorsWithServiceCount = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          // Get current user's handle for availability filtering
          const { data: { user } } = await supabase.auth.getUser();
          let userHandle = null;
          if (user) {
            const { data: userData } = await supabase
              .from('users')
              .select('handle')
              .eq('id', user.id)
              .single();
            userHandle = userData?.handle;
          }

          let countQuery = supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', creator.user_id)
            .eq('active', true);

          // Apply availability filter
          if (userHandle) {
            countQuery = countQuery.or(`availability_type.eq.everyone,and(availability_type.eq.select_user,target_username.eq.${userHandle})`);
          } else {
            countQuery = countQuery.eq('availability_type', 'everyone');
          }

          const { count } = await countQuery;

          return {
            ...creator,
            serviceCount: count || 0
          };
        })
      );
      
      console.log('Pro creators with service counts:', creatorsWithServiceCount);
      
      return creatorsWithServiceCount;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent 5-star reviews for testimonials using separate queries approach
  const { data: testimonials = [], isLoading: testimonialsLoading, error: testimonialsError } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      console.log('Fetching 5-star reviews for testimonials...');
      
      try {
        // Step 1: Fetch 5-star reviews with basic data
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, reviewer_id, booking_id')
          .eq('rating', 5)
          .order('created_at', { ascending: false })
          .limit(3);

        if (reviewsError) {
          console.error('Reviews query error:', reviewsError);
          throw reviewsError;
        }

        if (!reviewsData?.length) {
          console.log('No 5-star reviews found');
          return [];
        }

        console.log('Found 5-star reviews:', reviewsData.length);

        // Extract IDs for additional queries
        const reviewerIds = reviewsData.map(r => r.reviewer_id);
        const bookingIds = reviewsData.map(r => r.booking_id);

        // Step 2: Fetch reviewer handles
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, handle')
          .in('id', reviewerIds);

        if (usersError) {
          console.error('Users query error:', usersError);
          throw usersError;
        }

        // Step 3: Fetch service titles via bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, services(title)')
          .in('id', bookingIds);

        if (bookingsError) {
          console.error('Bookings query error:', bookingsError);
          throw bookingsError;
        }

        // Step 4: Combine data client-side to match expected structure
        const combinedTestimonials = reviewsData.map(review => {
          const user = usersData?.find(u => u.id === review.reviewer_id);
          const booking = bookingsData?.find(b => b.id === review.booking_id);
          
          return {
            ...review,
            users: user ? { handle: user.handle } : { handle: 'Unknown' },
            bookings: booking?.services ? { 
              services: { title: booking.services.title } 
            } : { 
              services: { title: 'Service' } 
            }
          };
        });

        console.log('Combined testimonials data:', combinedTestimonials);
        console.log('Successfully processed', combinedTestimonials.length, '5-star reviews');
        
        return combinedTestimonials;
      } catch (error) {
        console.error('Testimonials fetch error:', error);
        // Return empty array to fall back to static testimonials
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const services = [
    { name: 'Host an AMA', icon: MessageSquare, description: 'Telegram, Twitter, Discord' },
    { name: 'Tweet & Threads', icon: Hash, description: 'Engaging Twitter content' },
    { name: 'Promo Videos', icon: Video, description: 'TikTok, Reels, YouTube Shorts' },
    { name: 'Product Tutorials', icon: FileText, description: 'Walkthroughs & guides' },
    { name: 'Product Reviews', icon: Star, description: 'Honest project reviews' },
    { name: 'Host Twitter Spaces', icon: Megaphone, description: 'Live audio engagement' },
    { name: 'Instagram Posts', icon: Instagram, description: 'Visual content creation' },
    { name: 'Facebook Posts', icon: Facebook, description: 'Social media reach' },
    { name: 'General Marketing', icon: Target, description: 'Full campaign strategies' },
    { name: 'Project Branding', icon: Palette, description: 'Brand identity & design' },
    { name: 'Discord Contests', icon: Trophy, description: 'Community engagement' },
    { name: 'Blogs & Articles', icon: FileText, description: 'Written content' },
    { name: 'Reddit Posts', icon: Hash, description: 'Community discussions' },
    { name: 'Meme Creation', icon: Zap, description: 'Viral content creation' },
  ];

  const featuredCategories = [
    { title: 'Top AMA Hosts', description: 'Expert hosts for live sessions', count: 'Coming Soon' },
    { title: 'Best at Twitter Campaigns', description: 'Proven Twitter growth specialists', count: 'Coming Soon' },
    { title: 'Rising Video Creators', description: 'Trending video content makers', count: 'Coming Soon' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-lg md:text-6xl font-bold mb-6">
            <div className="mb-2">
              Hire the right Content Creator for your budget & Amplify Your Project.
            </div>
            <span className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] bg-clip-text text-transparent">
              Seamless stablecoin payments, no matter which chain you're on.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-4xl mx-auto">
            Connect directly with trusted & influential creators across Twitter (X), Facebook, Instagram, LinkedIn, TikTok, YouTube, Discord, & Telegram. Book everything from AMA's, Twitter spaces, full marketing campaigns, project reviews, product tutorials, & more. All services paid in crypto stable coins on all major blockchains & safeguarded by escrow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/browse">Browse Creators</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">Browse Services</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/become-creator">Become a Creator</Link>
            </Button>
          </div>
          
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-6 md:py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Level Up Your Marketing in 4 Easy Steps</h2>
          
          <div className="grid md:grid-cols-4 gap-8 mt-12">
            <div className="text-center">
              <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Find_Your_Creator-removebg-preview.png" alt="Find Your Creator" className="mx-auto mb-6 h-30 w-30" />
              <h3 className="text-xl font-semibold mb-4">1. Find Your Creator</h3>
              <p className="text-muted-foreground">Find the right creator or influencer for your needs—any platform, any expertise, any budget.</p>
            </div>
            
            <div className="text-center">
              <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/chat_image.png" alt="Instant Chat" className="mx-auto mb-6 h-30 w-30" />
              <h3 className="text-xl font-semibold mb-4">2. Instant Chat</h3>
              <p className="text-muted-foreground">Instantly chat with influencers and stay in touch throughout the whole transaction, ensuring your ideas and goals are carried out.</p>
            </div>
            
            <div className="text-center">
              <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Book___Pay_in_USDC-removebg-preview.png" alt="Book & Pay in USDC" className="mx-auto mb-6 h-30 w-30" />
              <h3 className="text-xl font-semibold mb-4">3. Book & Pay in USDC</h3>
              <p className="text-muted-foreground">Simple checkout via ANY crypto wallet that you hold USDC or USDM on Ethereum, Solana, BSC, SUI, or Cardano.</p>
            </div>
            
            <div className="text-center">
              <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Get_Your_Content_or_Service-removebg-preview.png" alt="Get Your Content or Service" className="mx-auto mb-6 h-30 w-30" />
              <h3 className="text-xl font-semibold mb-4">4. Get Your Content or Service</h3>
              <p className="text-muted-foreground">From AMAs to full marketing campaigns, creators deliver exactly what you need at the price that fits your budget.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Categories Section with Carousel */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Services That Drive Web3 Growth</h2>
          <p className="text-xl text-muted-foreground text-center mb-12">Higher the right creator for any type of marketing needs</p>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
            className="w-full max-w-7xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4 [&_.overflow-hidden]:overflow-visible">
              {services.map((service, index) => {
                // Map service names to category values for navigation
                const getCategoryFromService = (serviceName: string) => {
                  const serviceMapping: Record<string, string> = {
                    'Host an AMA': 'ama',
                    'Tweet & Threads': 'twitter',
                    'Promo Videos': 'video',
                    'Product Tutorials': 'tutorials',
                    'Product Reviews': 'reviews',
                    'Host Twitter Spaces': 'twitter-spaces',
                    'Instagram Posts': 'instagram',
                    'Facebook Posts': 'facebook',
                    'General Marketing': 'marketing',
                    'Project Branding': 'branding',
                    'Discord Contests': 'discord',
                    'Blogs & Articles': 'blogs',
                    'Reddit Posts': 'reddit',
                    'Meme Creation': 'memes'
                  };
                  return serviceMapping[serviceName] || 'all';
                };

                 return (
                   <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/3 lg:basis-1/5">
                     <Link to={`/browse?category=${getCategoryFromService(service.name)}`}>
                       <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-card border-border w-[125%] h-[125%] -mx-[12.5%] md:w-auto md:h-auto md:mx-0">
                         <div className="hover:scale-105 transition-transform duration-300">
                           <CardContent className="p-6 md:p-4 text-center">
                             <service.icon className="h-10 w-10 md:h-8 md:w-8 mx-auto mb-4 md:mb-3 text-primary" />
                             <h3 className="font-semibold text-base md:text-sm mb-3 md:mb-2">{service.name}</h3>
                             <p className="text-sm md:text-xs text-muted-foreground">{service.description}</p>
                           </CardContent>
                         </div>
                       </Card>
                     </Link>
                   </CarouselItem>
                 );
              })}
            </CarouselContent>
             <CarouselPrevious className="hidden md:flex" />
             <CarouselNext className="hidden md:flex" />
             
             {/* Mobile arrows */}
             <CarouselPrevious className="flex md:hidden -left-4 bg-background/90 hover:bg-background border-2 border-border shadow-lg" />
             <CarouselNext className="flex md:hidden -right-4 bg-background/90 hover:bg-background border-2 border-border shadow-lg" />
          </Carousel>
        </div>
      </section>

      {/* Why LeveledUP Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            The First Creator <span className="md:inline block">Market<br className="md:hidden" />place</span> Built for Web3
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
            <Card className="bg-card border-border w-[140%] -mx-[20%] md:w-auto md:mx-0">
              <CardContent className="p-6 md:p-8 text-center">
                <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Crypto-Native_Payments.png" alt="Crypto-Native Payments" className="h-18 w-18 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Crypto-Native Payments</h3>
                <p className="text-muted-foreground">Pay in USDC & USDM (ETH, Solana, Sui, BSC, & Cardano).</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border w-[140%] -mx-[20%] md:w-auto md:mx-0">
              <CardContent className="p-6 md:p-8 text-center">
                <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Escrow___Security-removebg-preview.png" alt="Escrow & Security" className="h-18 w-18 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Escrow & Security</h3>
                <p className="text-muted-foreground">Your payment stays safe in escrow until the work is delivered and approved, backed by our dispute resolution system.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border w-[140%] -mx-[20%] md:w-auto md:mx-0">
              <CardContent className="p-6 md:p-8 text-center">
                <img src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/Blockchain/Cross-Platform_Reach-removebg-preview.png" alt="Cross-Platform Reach" className="h-18 w-18 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Cross-Platform Reach</h3>
                <p className="text-muted-foreground">From Twitter to Telegram, work with creators where the crypto community actually lives.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Pro Creators Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Featured Pro Creators</h2>
          
           {proCreatorsError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Error loading pro creators</p>
              <p className="text-sm text-muted-foreground">{proCreatorsError.message}</p>
            </div>
           ) : isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-4"></div>
                    <div className="h-6 bg-muted rounded-full w-20 mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : proCreators.length > 0 ? (
             <div className="relative px-2 md:px-16">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 4000,
                      stopOnInteraction: false,
                    }),
                  ]}
                  className="w-full max-w-6xl mx-auto"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                     {proCreators.map((creator) => (
                       <CarouselItem key={creator.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                        <Link to={`/profile/${creator.users.handle}`}>
                          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-card border-2 border-border h-full overflow-hidden w-[260%] -mx-[80%] min-h-[120%] md:w-auto md:mx-0 md:min-h-0">
                            <div className="hover:scale-105 transition-transform duration-300">
                              <CardContent className="p-6 md:p-6 text-center">
                                 <div className="mb-4">
                                   <Avatar className="w-32 h-32 md:w-48 md:h-48 mx-auto">
                                     <AvatarImage src={creator.users.avatar_url} alt={creator.users.handle} />
                                     <AvatarFallback className="text-lg font-semibold">
                                       {creator.users.handle?.slice(0, 2).toUpperCase() || 'CR'}
                                     </AvatarFallback>
                                   </Avatar>
                                 </div>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <h3 className="text-base md:text-lg font-semibold">@{creator.users.handle}</h3>
                                  <Badge className="bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-0 text-xs px-2 py-1">
                                    Pro
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-3">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">
                                    {creator.rating ? Number(creator.rating).toFixed(1) : '5.0'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({creator.review_count || 0} reviews)
                                  </span>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                                  {creator.serviceCount} {creator.serviceCount === 1 ? 'service' : 'services'} available
                                </Badge>
                              </CardContent>
                            </div>
                          </Card>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                   <CarouselPrevious className="hidden md:flex" />
                   <CarouselNext className="hidden md:flex" />
                   
                   {/* Mobile arrows */}
                   <CarouselPrevious className="flex md:hidden -left-2 bg-background/90 hover:bg-background border-2 border-border shadow-lg" />
                   <CarouselNext className="flex md:hidden -right-2 bg-background/90 hover:bg-background border-2 border-border shadow-lg" />
                </Carousel>
              </div>
           ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Pro Creators', description: 'Premium creators coming soon', count: 'Coming Soon' },
                { title: 'Expert Specialists', description: 'Top-tier professionals', count: 'Coming Soon' },
                { title: 'Verified Pros', description: 'Trusted pro creators', count: 'Coming Soon' }
              ].map((category) => (
                <Card key={category.title} className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {category.count}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What People Are Saying</h2>
          
          {testimonialsError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Error loading testimonials</p>
              <p className="text-sm text-muted-foreground">{testimonialsError.message}</p>
            </div>
          ) : testimonialsLoading ? (
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 animate-pulse h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className="h-4 w-4 bg-muted rounded"></div>
                        ))}
                      </div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-16 bg-muted rounded mb-4"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <h3 className="font-semibold mb-2">{testimonial.bookings?.services?.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">"{testimonial.comment}"</p>
                      <div className="text-xs text-muted-foreground">@{testimonial.users?.handle}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {[
                {
                  project: "DeFi Protocol Launch",
                  review: "LeveledUP connected us with amazing creators who helped launch our protocol. The AMA host was professional and the Twitter campaign drove real engagement.",
                  rating: 5
                },
                {
                  project: "NFT Collection Marketing", 
                  review: "The video content created for our NFT drop was incredible. Sales increased 300% after working with creators from this platform.",
                  rating: 5
                },
                {
                  project: "Web3 Gaming Startup",
                  review: "Found the perfect creators for our Discord community building. The engagement and growth has been phenomenal since launch.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="p-[2px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg h-full">
                  <Card className="bg-card border-0 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <h3 className="font-semibold mb-2">{testimonial.project}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">"{testimonial.review}"</p>
                      <div className="text-xs text-muted-foreground">Verified Project Review</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Creator Onboarding Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Are You a Creator? Want To Earn Crypto for Your Skills.</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Monetize your audience. Offer AMAs, tweet campaigns, videos, and more. Set your price, get paid in USDC, and grow your influence.
          </p>
          
          <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/become-creator">Apply as a Creator</Link>
          </Button>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/62634403-0cf8-4432-a1e2-28c295b08bd6.png" 
              alt="LeveledUP Logo" 
              className="h-8 w-8"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] bg-clip-text text-transparent">
              LeveledUP
            </span>
          </div>
          <p className="text-muted-foreground mb-4">LeveledUP — the crypto creator marketplace</p>
          
          <p className="text-muted-foreground mb-4">Follow us on our socials</p>
          
          <div className="flex items-center justify-center space-x-4">
            <a 
              href="https://twitter.com/RULeveledUP" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/6aed84a1-41ef-494b-874f-e8b1b82e2152.png" 
                alt="X (Twitter)" 
                className="h-14 w-14"
              />
            </a>
            <a 
              href="https://instagram.com/RULeveledUp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/f8e8abb3-ce3f-46fa-bda6-3fb8e0057f01.png" 
                alt="Instagram" 
                className="h-14 w-14"
              />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
