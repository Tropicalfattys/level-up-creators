
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CreditCard, 
  MessageCircle, 
  Upload, 
  CheckCircle, 
  Shield, 
  Star,
  Wallet,
  Clock
} from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, Secure, <span className="text-primary">Fast</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get personalized content from top crypto creators & influencers in just a few clicks.
            Our platform handles everything from discovery to payments, delivery, and reviews.
          </p>
        </div>
      </section>

      {/* Step by Step Process */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">For Clients</h2>
            <p className="text-xl text-muted-foreground">
              Book your favorite creators in 4 simple steps
            </p>
          </div>

          <div className="grid gap-12">
            {/* Step 1 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardHeader className="lg:py-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                      1
                    </div>
                    <CardTitle className="text-2xl">Browse & Select</CardTitle>
                  </div>
                  <CardDescription className="text-lg mb-6">
                    Find the right creator for your project.
                    Scroll through a wide range of verified crypto creators across categories like trading, DeFi, SocialFi, NFTs, gaming, music, memes, and more.
                  </CardDescription>
                  <div className="space-y-6">
                    <div className="flex items-start gap-2">
                      <Search className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left">Search & filter by category, price, delivery time, or blockchain preference</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left">View full creator profiles with past work, reviews, and ratings</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left">Message creators before booking to ask questions or request custom offers</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left">Request exclusive services tailored just for you</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="lg:py-12">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Browse%20&%20Select.jpg" 
                      alt="Browse and Select creators interface"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardContent className="lg:py-12 order-2 lg:order-1">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Pay%20with%20Crypto.jpg" 
                      alt="Pay with crypto secure payment interface"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
                <CardHeader className="lg:py-12 order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      2
                    </div>
                    <CardTitle className="text-2xl">Pay with Crypto</CardTitle>
                  </div>
                  <CardDescription className="text-lg mb-6">
                    Book instantly with secure escrow payments.
                    We specialize in stablecoin payments across Ethereum, Solana, BSC, Cardano, and SUI. Your funds are always protected until you're satisfied.
                  </CardDescription>
                  <div className="space-y-6">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Escrow protection — funds are only released when you approve the work</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Instant booking confirmation once your payment is received</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Cheaper fees — only 15% compared to the industry's 25%+</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Wallet className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Multi-chain support — pay with your preferred blockchain</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Seamless crypto checkout — no cards, no banks, just Web3 simplicity</div>
                    </div>
                  </div>
                </CardHeader>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardHeader className="lg:py-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      3
                    </div>
                    <CardTitle className="text-2xl">Chat & Collaborate</CardTitle>
                  </div>
                  <CardDescription className="text-lg mb-6">
                    Work directly with your creator in real time.
                    Once booked, you'll unlock a dedicated chat window tied to your service. This is your project hub.
                  </CardDescription>
                  <div className="space-y-6">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Real-time messaging to stay aligned from start to finish</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Upload className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Secure file sharing — send and receive files, links, or video proofs</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Track everything in one place — payments, files, milestones, and delivery are linked to your booking</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Flexible adjustments — clarify requirements, share feedback, and keep the project on track</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="lg:py-12">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Chat%20&%20Collaborate.jpg" 
                      alt="Chat and collaborate interface"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Step 4 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardContent className="lg:py-12 order-2 lg:order-1">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="https://cpxqkiajkkeizsewhoel.supabase.co/storage/v1/object/public/icons/Receive%20&%20Review.jpg" 
                      alt="Receive and review content interface"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
                <CardHeader className="lg:py-12 order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      4
                    </div>
                    <CardTitle className="text-2xl">Receive & Review</CardTitle>
                  </div>
                  <CardDescription className="text-lg mb-6">
                    Get your custom content delivered & celebrate the results.
                    When your creator delivers, you'll have 3 days to review before escrow releases payment.
                  </CardDescription>
                  <div className="space-y-6">
                    <div className="flex items-start gap-2">
                      <Upload className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Exciting delivery experience — videos, files, or links all delivered securely in-platform</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-left">3-day review period to approve or request adjustments</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Leave a rating & review to help creators grow and guide future clients</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Fair dispute resolution — our team can step in if there are issues</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-left">Satisfaction guaranteed — creators only get paid when you're happy</div>
                    </div>
                  </div>
                </CardHeader>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* For Creators Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">For Creators</h2>
          <p className="text-xl text-muted-foreground">
            Turn your skills into income. Build your brand in Web3.
            Level Up makes it easy for crypto-native creators to monetize content, connect with clients, and get paid securely in stablecoins.
          </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Apply & Get Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create your profile and join the marketplace.
                  Sign up, add your socials, and tell us what you offer. Once approved, your profile is live and ready to attract clients.
                </CardDescription>
                
                <div className="space-y-6 mt-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Free plan includes up to 5 active services</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Fast approvals so you can start selling quickly</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Verified profile builds client trust</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Upgrade to Creator Plus or Pro for more services, higher rankings, and homepage features</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Set Your Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Showcase what you do best.
                  List your services with flexible pricing, delivery times, and details so clients know exactly what they're booking.
                </CardDescription>
                
                <div className="space-y-6 mt-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Add, edit, or swap services anytime</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Pro creators can upload a 2-minute intro video for maximum visibility</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Better visibility in search with higher-tier plans</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Offer anything from custom videos and AMAs to collabs, shoutouts, or design work</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Deliver & Earn</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get paid fast with secure escrow.
                  Chat directly with clients in your dedicated project chat, deliver files and links, and once the client approves, funds are released instantly.
                </CardDescription>
                
                <div className="space-y-6 mt-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Dedicated chat with secure file transfers</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Keep 85% of every booking (lowest fees in the industry)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Instant stablecoin payouts on Ethereum, Solana, BSC, Cardano, or SUI</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">Protected by fair dispute resolution so everyone gets a fair deal</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/become-creator">Start Creating Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Security & Trust</h2>
            <p className="text-xl text-muted-foreground">
              Safer Deals. Secured by Web3.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Secure Escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Every booking is backed by escrow. Payments are locked until you approve delivery, so creators only get paid when you're satisfied.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Verified Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  No fakes. No guesswork. Every creator is reviewed before going live, and Pro Creators must verify their socials through referral links for added authenticity.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  If something goes wrong, we step in. Our team provides fair dispute resolution, protecting both clients and creators so no one gets left behind.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-lg">Rating System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Transparent reviews help you make informed decisions
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/browse">Browse Creators</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/auth">Sign Up Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
