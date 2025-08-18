
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DollarSign, Users, MessageCircle, Star } from 'lucide-react';

export default function Index() {
  const { userProfile, userRole } = useAuth();

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userProfile.handle}!
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'admin' && 'Manage the platform and support users'}
          {userRole === 'creator' && 'Create amazing content and grow your earnings'}
          {userRole === 'client' && 'Book your favorite creators and get personalized content'}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'creator' ? 'Total Earnings' : 'Total Spent'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'creator' ? 'Completed Orders' : 'Bookings Made'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No active conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'creator' ? 'Average Rating' : 'Referral Credits'}
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRole === 'creator' ? '0.0' : `$${userProfile.referral_credits || 0}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {userRole === 'creator' ? 'No reviews yet' : 'Available credits'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-3 gap-4">
              {userRole === 'client' && (
                <>
                  <Button asChild className="h-auto p-4">
                    <Link to="/browse" className="flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Browse Creators</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link to="/become-creator" className="flex flex-col items-center gap-2">
                      <DollarSign className="h-6 w-6" />
                      <span>Become Creator</span>
                    </Link>
                  </Button>
                </>
              )}
              
              {userRole === 'creator' && (
                <>
                  <Button asChild className="h-auto p-4">
                    <Link to="/creator-dashboard" className="flex flex-col items-center gap-2">
                      <DollarSign className="h-6 w-6" />
                      <span>Creator Dashboard</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-4">
                    <Link to="/services" className="flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Manage Services</span>
                    </Link>
                  </Button>
                </>
              )}

              {userRole === 'admin' && (
                <>
                  <Button asChild className="h-auto p-4">
                    <Link to="/admin" className="flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Admin Panel</span>
                    </Link>
                  </Button>
                </>
              )}

              <Button variant="outline" asChild className="h-auto p-4">
                <Link to="/settings" className="flex flex-col items-center gap-2">
                  <Star className="h-6 w-6" />
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Friends & Earn</CardTitle>
            <CardDescription>
              Share your referral link and earn $1.00 credit for each successful signup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {window.location.origin}/auth?ref={userProfile.referral_code}
                </code>
                <Button 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${userProfile.referral_code}`);
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You have ${userProfile.referral_credits || 0} in referral credits
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
