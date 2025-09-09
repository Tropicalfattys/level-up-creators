
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { LogOut, User, Settings, DollarSign, Menu, Shield } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const { user, userRole, userProfile } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch categories from database
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data;
    },
  });

  const handleSignOut = async () => {
    try {
      console.log('Header: Starting sign out process');
      const result = await signOut();
      
      // Always navigate to home, even if there was an error
      console.log('Header: Sign out completed, navigating to home');
      navigate('/');
      
      // Force a page reload on production to ensure clean state
      if (window.location.hostname !== 'localhost') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error) {
      console.error('Header: Sign out error:', error);
      // Still navigate even if there's an error
      navigate('/');
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <img 
            src="/lovable-uploads/d172b9fc-950a-4abe-8f59-00d751cecddc.png" 
            alt="LeveledUP Logo" 
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
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
              {isLoading ? (
                <DropdownMenuItem disabled className="text-white/60">
                  Loading categories...
                </DropdownMenuItem>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link 
                      to={`/browse?category=${category.value}`} 
                      className="w-full text-white hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      {category.label}
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-white/60">
                  No categories available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/services" className="text-white/80 hover:text-white transition-colors">
            Services
          </Link>
          <Link to="/how-it-works" className="text-white/80 hover:text-white transition-colors">
            How it works
          </Link>
          <Link to="/become-creator" className="text-white/80 hover:text-white transition-colors">
            Become a creator
          </Link>
        </nav>

        {isMobile ? (
          /* Mobile Layout */
          <div className="flex items-center space-x-4">
            {/* Notification Bell for mobile */}
            {user && (
              <div className="flex-shrink-0">
                <NotificationBell />
              </div>
            )}
            
            {/* Mobile Menu */}
            <div className="flex-shrink-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-zinc-800">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-900 border-zinc-800">
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="flex flex-col space-y-4 mt-6 px-1">
                  {/* User Profile Section - Only show when signed in */}
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.handle || 'User')}&background=3b82f6&color=ffffff&size=128`} 
                          alt={userProfile?.handle} 
                        />
                        <AvatarFallback className="bg-zinc-700 text-white">
                          {userProfile?.handle?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium text-white text-sm">{userProfile?.handle}</p>
                        {userRole && (
                          <p className="text-xs text-cyan-400 font-medium capitalize">
                            {userRole}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <Link 
                    to="/browse" 
                    className="text-white/80 hover:text-white transition-colors p-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Browse Creators
                  </Link>
                  <Link 
                    to="/services" 
                    className="text-white/80 hover:text-white transition-colors p-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Services
                  </Link>
                  <Link 
                    to="/how-it-works" 
                    className="text-white/80 hover:text-white transition-colors p-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How it works
                  </Link>
                  <Link 
                    to="/become-creator" 
                    className="text-white/80 hover:text-white transition-colors p-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Become a creator
                  </Link>
                  
                  {/* Authenticated User Actions */}
                  {user ? (
                    <div className="border-t border-zinc-800 pt-4 space-y-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          navigate('/dashboard');
                          setMobileMenuOpen(false);
                        }} 
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          navigate('/settings');
                          setMobileMenuOpen(false);
                        }} 
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      
                      {userRole === 'creator' && (
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            navigate('/creator-dashboard');
                            setMobileMenuOpen(false);
                          }} 
                          className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Creator Dashboard
                        </Button>
                      )}

                      {userRole === 'admin' && (
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            navigate('/admin');
                            setMobileMenuOpen(false);
                          }} 
                          className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Button>
                      )}

                      <div className="border-t border-zinc-800 pt-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }} 
                          className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-zinc-800 pt-4 space-y-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          navigate('/auth');
                          setMobileMenuOpen(false);
                        }} 
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-zinc-800"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => {
                          navigate('/auth?mode=signup');
                          setMobileMenuOpen(false);
                        }} 
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                      >
                        Create Account
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
              </Sheet>
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            {user && (
              <NotificationBell />
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.handle || 'User')}&background=3b82f6&color=ffffff&size=64`} 
                      alt={userProfile?.handle} 
                    />
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
          </div>
        )}
      </div>
    </header>
  );
};
