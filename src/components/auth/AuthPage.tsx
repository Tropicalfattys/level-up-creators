import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp, signInWithProvider, resetPassword } from '@/lib/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set referral code from URL params
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(error.message);
        }
      } else if (data.session) {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password || !handle) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await signUp(email, password, referralCode, handle);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else if (error.message.includes('duplicate key value violates unique constraint "users_handle_key"') || 
                   error.message.includes('Database error saving new user')) {
          setError('Username Already Taken');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        toast.success('Account created successfully! Please check your email to confirm your account.');
        setPassword('');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetLoading) return;

    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }

    setResetLoading(true);
    setError('');
    
    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        setError(error.message);
      } else {
        toast.success('Password reset email sent! Please check your inbox.');
        setShowResetPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter') => {
    if (socialLoading) return;
    
    setSocialLoading(provider);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        toast.error(`${provider} login failed: ${error.message}`);
      }
    } catch (error) {
      toast.error('Social login failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to LeveledUp</CardTitle>
          <CardDescription className="text-center">
            Connect with content creators for any niche and grow your project!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showResetPassword ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetLoading}
                    required
                  />
                </div>

                {error && (
                  <Alert className="py-2">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setShowResetPassword(false);
                    setError('');
                    setResetEmail('');
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Tabs defaultValue="signin" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm px-0 h-auto"
                        onClick={() => {
                          setShowResetPassword(true);
                          setError('');
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </div>

                    {error && (
                      <Alert className="py-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-handle">Username</Label>
                      <Input
                        id="signup-handle"
                        type="text"
                        placeholder="Choose a username"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
                      <Input
                        id="signup-referral"
                        type="text"
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        disabled={loading}
                      />
                      {referralCode && (
                        <p className="text-xs text-muted-foreground">
                          You and your referrer will earn credits when you make your first booking!
                        </p>
                      )}
                    </div>

                    {error && (
                      <Alert className="py-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading || !!socialLoading}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    {socialLoading === 'google' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Continue with Google'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
