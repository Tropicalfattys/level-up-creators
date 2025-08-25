import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp, signInWithProvider } from '@/lib/auth';
import { validateInput, emailSchema, passwordSchema, handleSchema, referralCodeSchema } from '@/lib/validation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthPage = () => {
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set referral code from URL params
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      console.log('Referral code from URL:', refParam);
    }
  }, [searchParams]);

  const validateForm = (isSignUp: boolean = false) => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailValidation = validateInput(emailSchema, email);
    if (emailValidation.success === false) {
      newErrors.email = emailValidation.errors[0];
    }

    // Password validation
    const passwordValidation = validateInput(passwordSchema, password);
    if (passwordValidation.success === false) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Handle validation (sign up only)
    if (isSignUp) {
      const handleValidation = validateInput(handleSchema, handle);
      if (handleValidation.success === false) {
        newErrors.handle = handleValidation.errors[0];
      }

      // Referral code validation (optional)
      if (referralCode) {
        const referralValidation = validateInput(referralCodeSchema, referralCode);
        if (referralValidation.success === false) {
          newErrors.referralCode = referralValidation.errors[0];
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSignIn function
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submission
    if (!validateForm()) return;

    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Handle specific auth errors
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else {
          toast.error(error.message);
        }
      } else if (data.session) {
        console.log('Sign in successful');
        toast.success('Welcome back!');
        navigate('/');
      } else {
        console.warn('Sign in returned no session');
        toast.error('Sign in failed. Please try again.');
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // handleSignUp function
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submission
    if (!validateForm(true)) return;

    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log('Attempting sign up for:', email, 'with referral:', referralCode);
      const { data, error } = await signUp(email, password, referralCode, handle);
      
      if (error) {
        console.error('Sign up error:', error);
        
        // Handle specific signup errors
        if (error.message.includes('already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password must be at least 6 characters long.');
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        console.log('Sign up successful, user created:', data.user.id);
        toast.success('Account created successfully! Please check your email to confirm your account before signing in.');
        
        // Clear form but keep on signup tab for user convenience
        setPassword('');
      } else {
        console.warn('Sign up returned no user data');
        toast.error('Account creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Sign up exception:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // handleSocialLogin function
  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    if (socialLoading) return; // Prevent multiple social logins
    
    setSocialLoading(provider);
    try {
      console.log('Attempting social login with:', provider);
      const { error } = await signInWithProvider(provider);
      if (error) {
        console.error('Social login error:', error);
        toast.error(`${provider} login failed: ${error.message}`);
      }
      // Success will be handled by auth state change
    } catch (error) {
      console.error('Social login exception:', error);
      toast.error('Social login failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to CryptoTalent</CardTitle>
          <CardDescription className="text-center">
            Connect with crypto experts and grow your skills
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {errors.email && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.email}</AlertDescription>
                    </Alert>
                  )}
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
                  {errors.password && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.password}</AlertDescription>
                    </Alert>
                  )}
                </div>

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
                  {errors.email && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.email}</AlertDescription>
                    </Alert>
                  )}
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
                  {errors.handle && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.handle}</AlertDescription>
                    </Alert>
                  )}
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
                  {errors.password && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.password}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {referralCode && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral">Referral Code</Label>
                    <Input
                      id="signup-referral"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      disabled={loading}
                    />
                    {errors.referralCode && (
                      <Alert className="py-2">
                        <AlertDescription className="text-sm">{errors.referralCode}</AlertDescription>
                      </Alert>
                    )}
                  </div>
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
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('google')}
                disabled={loading || !!socialLoading}
                className="w-full"
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Google'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('github')}
                disabled={loading || !!socialLoading}
                className="w-full"
              >
                {socialLoading === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'GitHub'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('twitter')}
                disabled={loading || !!socialLoading}
                className="w-full"
              >
                {socialLoading === 'twitter' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Twitter'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
