
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
          <Badge variant="secondary" className="mb-4">
            📚 Learn How It Works
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, Secure, <span className="text-primary">Fast</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get personalized content from top crypto creators in just a few clicks. 
            Our platform handles everything from payments to delivery.
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
                    Discover crypto creators across different categories. Filter by price, 
                    delivery time, ratings, and blockchain preference.
                  </CardDescription>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      <span>Search by category or creator name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <span>Check ratings and reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">ETH</Badge>
                      <Badge variant="outline">SUI</Badge>
                      <Badge variant="outline">SOL</Badge>
                      <Badge variant="outline">BSC</Badge>
                      <Badge variant="outline">Cardano</Badge>
                      <span>Choose your preferred blockchain</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="lg:py-12">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <Search className="h-16 w-16 text-primary" />
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardContent className="lg:py-12 order-2 lg:order-1">
                  <div className="aspect-video bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <Wallet className="h-16 w-16 text-green-600" />
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
                    Easily complete your order with secure crypto payments.
                  </CardDescription>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <span>Send payment manually from your wallet to our escrow wallet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Funds held in secure escrow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Instant booking confirmation</span>
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
                    Connect with your creator right away and share project details.
                    Share details, requirements, and track progress in real-time.
                  </CardDescription>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <span>Real-time messaging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Share requirements and expectations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>Track progress from start to finish</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="lg:py-12">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-16 w-16 text-blue-600" />
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Step 4 */}
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8">
                <CardContent className="lg:py-12 order-2 lg:order-1">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-purple-600" />
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
                    Get your custom content delivered securely. You have 3 days to review 
                    before funds are automatically released to the creator.
                  </CardDescription>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-purple-600" />
                      <span>Secure content delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <span>3-day review period</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-600" />
                      <span>Rate and review experience</span>
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
              Monetize your expertise and build your brand
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
                  Complete your profile, choose your membership tier, and wait for approval. 
                  Pro creators can upload intro videos for better visibility.
                </CardDescription>
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
                  Create multiple service offerings with different prices and delivery times. 
                  From trading advice to custom videos - you decide what to offer.
                </CardDescription>
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
                  Fulfill orders, chat with clients, and get paid automatically. 
                  You keep 85% of every booking with fast USDC payouts.
                </CardDescription>
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
              Your safety is our priority
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
                  Funds are held safely until content is delivered and approved
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
                  All creators go through our approval process before going live
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
                  Fair resolution process with dedicated support team
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
