
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { LogOut, User, Settings, DollarSign, Menu, Shield, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  const { user, userRole, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const categories = [
    { id: 'ama', name: 'Host an AMA', path: '/browse?category=ama' },
    { id: 'twitter', name: 'Tweet Campaigns', path: '/browse?category=twitter' },
    { id: 'video', name: 'Promo Videos', path: '/browse?category=video' },
    { id: 'tutorials', name: 'Product Tutorials', path: '/browse?category=tutorials' },
    { id: 'reviews', name: 'Product Reviews', path: '/browse?category=reviews' },
    { id: 'spaces', name: 'Twitter Spaces', path: '/browse?category=spaces' },
    { id: 'instagram', name: 'Instagram Posts', path: '/browse?category=instagram' },
    { id: 'facebook', name: 'Facebook Posts', path: '/browse?category=facebook' },
    { id: 'marketing', name: 'Marketing Campaigns', path: '/browse?category=marketing' },
    { id: 'branding', name: 'Project Branding', path: '/browse?category=branding' },
    { id: 'discord', name: 'Discord Contests', path: '/browse?category=discord' },
    { id: 'blogs', name: 'Blogs & Articles', path: '/browse?category=blogs' },
    { id: 'reddit', name: 'Reddit Posts', path: '/browse?category=reddit' },
    { id: 'memes', name: 'Meme Creation', path: '/browse?category=memes' }
  ];

  return (
    <header className="border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/d172b9fc-950a-4abe-8f59-00d751cecddc.png" 
            alt="LeveledUP Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
            LeveledUP
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-zinc-800">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800 z-50 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link 
                    to={category.path} 
                    className="w-full text-white hover:bg-zinc-800 focus:bg-zinc-800"
                  >
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/how-it-works" className="text-white/80 hover:text-white transition-colors">
            How it works
          </Link>
          <Link to="/become-creator" className="text-white/80 hover:text-white transition-colors">
            Become a creator
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Cart Icon */}
          <Button variant="ghost" size="icon" className="relative text-white/80 hover:text-white hover:bg-zinc-800">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white text-xs">
              0
            </Badge>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.handle} />
                    <AvatarFallback className="bg-zinc-800 text-white">
                      {userProfile?.handle?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 z-50" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-white">{userProfile?.handle}</p>
                    <p className="w-full truncate text-sm text-zinc-400">
                      {user.email}
                    </p>
                    {userRole && (
                      <p className="text-xs text-cyan-400 font-medium capitalize">
                        {userRole}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/settings')} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                {userRole === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}

                {userRole === 'creator' && (
                  <DropdownMenuItem onClick={() => navigate('/creator-dashboard')} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Creator Dashboard
                  </DropdownMenuItem>
                )}

                {userRole !== 'creator' && userRole !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/become-creator')} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Become a Creator
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleSignOut} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white/80 hover:text-white hover:bg-zinc-800">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700">
                Create Account
              </Button>
            </div>
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden text-white/80 hover:text-white hover:bg-zinc-800">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
