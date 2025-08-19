

import { useState } from 'react';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useState(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  });

  const validateForm = (isSignUp: boolean = false) => {
    const newErrors: Record<string, string> = {};

    // Email validation with proper type checking
    const emailValidation = validateInput(emailSchema, email);
    if (!emailValidation.success) {
      newErrors.email = emailValidation.errors[0];
    }

    // Password validation with proper type checking
    const passwordValidation = validateInput(passwordSchema, password);
    if (!passwordValidation.success) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Handle validation (sign up only) with proper type checking
    if (isSignUp) {
      const handleValidation = validateInput(handleSchema, handle);
      if (!handleValidation.success) {
        newErrors.handle = handleValidation.errors[0];
      }

      // Referral code validation (optional) with proper type checking
      if (referralCode) {
        const referralValidation = validateInput(referralCodeSchema, referralCode);
        if (!referralValidation.success) {
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // handleSignUp function
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password, referralCode, handle);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email to confirm your account.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // handleSocialLogin function
  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    setLoading(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
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
                  {errors.referralCode && (
                    <Alert className="py-2">
                      <AlertDescription className="text-sm">{errors.referralCode}</AlertDescription>
                    </Alert>
                  )}
                </div>

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
                disabled={loading}
                className="w-full"
              >
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="w-full"
              >
                GitHub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('twitter')}
                disabled={loading}
                className="w-full"
              >
                Twitter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

