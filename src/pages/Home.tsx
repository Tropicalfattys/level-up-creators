
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Play, Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Home() {
  const { user } = useAuth();

  const categories = [
    { name: 'Actors', icon: '🎭' },
    { name: 'Reality TV', icon: '📺' },
    { name: 'Athletes', icon: '⚽' },
    { name: 'Comedians', icon: '🎤' },
    { name: 'Musicians', icon: '🎵' },
    { name: 'Creators', icon: '🎨' },
    { name: 'For Business', icon: '💼' },
  ];

  const topCreators = [
    { name: 'JAMES BUCKLEY', category: 'Actor, Inbetweeners', price: 50, rating: 4.97, image: '1' },
    { name: 'BOFEM', category: 'UK Drill Creator', price: 40, rating: 4.99, image: '2' },
    { name: 'JEN FROM CORPORATE', category: 'TV Commercial Artist', price: 32, rating: 4.56, image: '3' },
    { name: 'SMOOTH PAPI', category: 'R&B Artist', price: 55, rating: 4.67, image: '4' },
    { name: 'SOYTIET', category: 'Content Creator', price: 41, rating: 4.87, image: '5' },
    { name: 'KAGE', category: 'Gaming Creator', price: 100, rating: 4.95, image: '6' },
  ];

  const priceRanges = [
    { label: 'Under $25', color: 'from-purple-500 to-purple-600' },
    { label: 'Under $50', color: 'from-pink-500 to-pink-600' },
    { label: 'Under $100', color: 'from-teal-500 to-teal-600' },
    { label: 'Under $150', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Personalized videos from your favorite crypto creators
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for any crypto creator" 
                className="pl-10 bg-muted border-0 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/browse?category=${category.name.toLowerCase()}`}
                className="flex flex-col items-center p-4 rounded-full bg-muted hover:bg-accent transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-2">
                  {category.icon}
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </Link>
            ))}
            <Link
              to="/categories"
              className="flex flex-col items-center p-4 rounded-full bg-muted hover:bg-accent transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm mb-2">
                View all
              </div>
              <span className="text-sm font-medium text-center">View all</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Personalized Videos Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8">Personalized videos for every occasion</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 text-white">
              <CardContent className="p-6">
                <div className="text-4xl mb-2">🎂</div>
                <h3 className="font-semibold mb-1">Personalized videos for</h3>
                <p className="text-lg font-bold">Birthday</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-600 to-red-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="text-4xl mb-2">🏈</div>
                <h3 className="font-semibold mb-1">Find your draft target for</h3>
                <p className="text-lg font-bold">Fantasy Football</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-600 to-green-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="text-4xl mb-2">💍</div>
                <h3 className="font-semibold mb-1">The perfect gift for</h3>
                <p className="text-lg font-bold">Weddings</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="text-4xl mb-2">⭐</div>
                <h3 className="font-semibold mb-1">Get a shout from our</h3>
                <p className="text-lg font-bold">Trending Stars</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Top 10 Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Top 10 on CryptoCreators</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {topCreators.map((creator, index) => (
              <Card key={creator.name} className="group hover:shadow-lg transition-all duration-300 bg-card border-border">
                <CardContent className="p-4">
                  <div className="relative mb-4">
                    <div className="aspect-[4/5] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {creator.rating}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{creator.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{creator.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">${creator.price}+</span>
                    <Badge variant="secondary" className="text-xs">Pro</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instant Videos Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-2xl font-bold">Instant CryptoCreators videos</h2>
            <Badge variant="secondary" className="bg-green-600 text-white">0 - 60 min delivery</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 bg-card border-border">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <Play className="h-8 w-8 text-white" />
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Instant
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Creator Name</h3>
                  <p className="text-xs text-muted-foreground mb-2">Category</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">4.9 (45)</span>
                    </div>
                    <span className="font-semibold text-sm">$100</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">How CryptoCreators works</h2>
          <p className="text-center text-muted-foreground mb-12">
            Get a personalized video in just four easy steps. <Link to="/how-it-works" className="text-primary underline">Learn more</Link>
          </p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Find a celebrity', desc: 'Browse thousands of stars offering personalized videos.' },
              { step: 2, title: 'Tell them what to say', desc: 'During checkout, you\'ll provide the details about what you want them to say.' },
              { step: 3, title: 'Get your video', desc: 'Celebs have up to 7 days to complete your request, but many deliver much faster.' },
              { step: 4, title: 'Share with loved ones', desc: 'Send the video to friends and family via text, email, or post it on social media.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl font-bold text-primary">{item.step}</div>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Ranges */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Gifts for every budget</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {priceRanges.map((range) => (
              <Card key={range.label} className={`bg-gradient-to-br ${range.color} border-0 text-white hover:scale-105 transition-transform cursor-pointer`}>
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold mb-2">{range.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Recent reviews</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="font-semibold mb-2">Birthday from Joe Veloce</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    "Joe created a really heartfelt wish and encouragement for my son just today. He was delighted and said this was ..."
                  </p>
                  <div className="text-xs text-muted-foreground">Review from customer • Verified</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Categories</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/browse?category=${category.name.toLowerCase()}`}
                className="flex flex-col items-center p-4 rounded-full bg-muted hover:bg-accent transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-2xl mb-2">
                  {category.icon}
                </div>
                <span className="text-xs font-medium text-center">{category.name}</span>
              </Link>
            ))}
            <Link
              to="/categories"
              className="flex flex-col items-center p-4 rounded-full bg-muted hover:bg-accent transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm mb-2">
                View all
              </div>
              <span className="text-xs font-medium text-center">View all</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-muted">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">This is CryptoCreators</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Gifts as unique as the people you're gifting to</h3>
              <p className="text-sm text-muted-foreground">
                Thousands of personalized videos with one of the first connections between celebrities and the people they inspire.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Perfect for every occasion (or just because)</h3>
              <p className="text-sm text-muted-foreground">
                From your biggest milestones to everyday moments both big and small.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Someone for every fan</h3>
              <p className="text-sm text-muted-foreground">
                From A-list stars to reality TV and everything in between, thousands of celebrities there's a star for every fan on CryptoCreators.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <Link to={user ? "/browse" : "/auth"}>
                Browse Creators
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/become-creator">
                Become a Creator
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
