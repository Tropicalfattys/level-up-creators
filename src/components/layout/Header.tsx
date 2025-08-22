
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { LogOut, User, Settings, DollarSign, Menu, Shield } from 'lucide-react';

export const Header = () => {
  const { user, userRole, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/62634403-0cf8-4432-a1e2-28c295b08bd6.png" 
            alt="LeveledUP Logo" 
            className="h-8 w-8"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] bg-clip-text text-transparent">
            LeveledUP
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Categories
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              <DropdownMenuItem>
                <Link to="/browse?category=ama" className="w-full">Host an AMA</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/browse?category=twitter" className="w-full">Tweet Campaigns</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/browse?category=video" className="w-full">Promo Videos</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/browse?category=tutorials" className="w-full">Product Tutorials</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link to="/become-creator" className="text-foreground/80 hover:text-foreground transition-colors">
            Become a creator
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.handle} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {userProfile?.handle?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-foreground">{userProfile?.handle}</p>
                    <p className="w-full truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    {userRole && (
                      <p className="text-xs text-primary font-medium capitalize">
                        {userRole}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                {userRole === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}

                {userRole === 'creator' && (
                  <DropdownMenuItem onClick={() => navigate('/creator-dashboard')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Creator Dashboard
                  </DropdownMenuItem>
                )}

                {userRole !== 'creator' && userRole !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/become-creator')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Become a Creator
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')} className="text-foreground/80 hover:text-foreground">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Account
              </Button>
            </div>
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
