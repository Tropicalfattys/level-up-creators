
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Play, Star, Shield, Zap, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 The Future of Creator Economy
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Book crypto creators
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get personalized videos, trading advice, and exclusive content from your favorite crypto creators. 
            Pay with USDC on Ethereum, Base, or Solana.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to={user ? "/browse" : "/auth"}>
                Browse Creators
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
              <Link to="/become-creator">
                Become a Creator
              </Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Videos Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">$2M+</div>
              <div className="text-sm text-muted-foreground">Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Creators</h2>
            <p className="text-xl text-muted-foreground">
              Top-rated crypto creators ready to create content for you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="relative">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-full"></div>
                    <div>
                      <CardTitle className="text-lg">CryptoTrader{i}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.9 (127)</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    Trading analysis, market insights, and personalized investment advice
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">From $50 USDC</span>
                    <Badge variant="secondary">Pro</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/browse">View All Creators</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Simple, secure, and fast - get your custom content in 3 easy steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Browse & Book</h3>
              <p className="text-muted-foreground">
                Find your favorite creator and book their service. Pay instantly with USDC via MetaMask or Phantom.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Creator Delivers</h3>
              <p className="text-muted-foreground">
                Your creator gets to work and delivers your custom content within the agreed timeframe.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Secure Release</h3>
              <p className="text-muted-foreground">
                Funds are held in escrow and released automatically after 3 days, or instantly when you approve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                For Creators
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Monetize your crypto expertise
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Set Your Own Prices</h3>
                    <p className="text-muted-foreground">Control your earnings with flexible pricing on multiple services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Secure Payments</h3>
                    <p className="text-muted-foreground">Get paid in USDC with our secure escrow system</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Global Audience</h3>
                    <p className="text-muted-foreground">Reach crypto enthusiasts worldwide</p>
                  </div>
                </div>
              </div>
              <Button size="lg" asChild>
                <Link to="/become-creator">Join as Creator</Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">85%</div>
                  <div className="text-muted-foreground">Creator Earnings</div>
                  <div className="text-sm text-muted-foreground mt-2">You keep 85% of every booking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users already booking their favorite crypto creators
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to={user ? "/browse" : "/auth"}>Browse Creators</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/become-creator">Become a Creator</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
