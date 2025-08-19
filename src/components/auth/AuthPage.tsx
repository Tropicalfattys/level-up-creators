
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { signUp, signIn, signInWithProvider } from '@/lib/auth';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { 
  validateInput, 
  emailSchema, 
  passwordSchema, 
  handleSchema, 
  referralCodeSchema,
  sanitizeString,
  createRateLimiter
} from '@/lib/validation';
import { 
  handleSupabaseError, 
  showErrorToast, 
  ValidationError, 
  RateLimitError 
} from '@/lib/errorHandler';

// Rate limiters for different actions
const signInLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const signUpLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    handle: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const ref = sanitizeString(searchParams.get('ref') || '');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Email validation
    const emailResult = validateInput(emailSchema, formData.email);
    if (!emailResult.success) {
      errors.email = emailResult.errors[0];
    }

    // Password validation
    const passwordResult = validateInput(passwordSchema, formData.password);
    if (!passwordResult.success) {
      errors.password = passwordResult.errors[0];
    }

    if (mode === 'signup') {
      // Handle validation
      const handleResult = validateInput(handleSchema, formData.handle);
      if (!handleResult.success) {
        errors.handle = handleResult.errors[0];
      }

      // Password confirmation
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      // Referral code validation (optional)
      if (formData.referralCode) {
        const referralResult = validateInput(referralCodeSchema, formData.referralCode);
        if (!referralResult.success) {
          errors.referralCode = 'Invalid referral code format';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeString(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check rate limits
    const clientIP = 'user'; // In production, you'd get the actual IP
    const limiter = mode === 'signin' ? signInLimiter : signUpLimiter;
    
    if (!limiter(clientIP)) {
      showErrorToast(new RateLimitError());
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(
          formData.email, 
          formData.password, 
          formData.referralCode || undefined, 
          formData.handle
        );
        
        if (error) {
          const appError = handleSupabaseError(error);
          showErrorToast(appError);
        } else {
          toast({
            title: "Success",
            description: "Please check your email to confirm your account"
          });
          // Clear form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            handle: '',
            referralCode: ''
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          const appError = handleSupabaseError(error);
          showErrorToast(appError);
        }
      }
    } catch (error) {
      showErrorToast(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    if (!signInLimiter('social')) {
      showErrorToast(new RateLimitError());
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        const appError = handleSupabaseError(error);
        showErrorToast(appError);
      }
    } catch (error) {
      showErrorToast(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' 
              ? 'Welcome back! Please sign in to your account.'
              : 'Join the crypto creator marketplace today.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
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
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                required
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="handle">Username</Label>
                <Input
                  id="handle"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.handle}
                  onChange={(e) => handleInputChange('handle', e.target.value)}
                  disabled={loading}
                  required
                  className={validationErrors.handle ? 'border-red-500' : ''}
                />
                {validationErrors.handle ? (
                  <p className="text-sm text-red-500">{validationErrors.handle}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, letters, numbers, underscores and dashes only
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={loading}
                  required
                  className={validationErrors.password ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-red-500">{validationErrors.password}</p>
              )}
              {mode === 'signup' && !validationErrors.password && (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={loading}
                      required
                      className={validationErrors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value)}
                    disabled={loading}
                    className={validationErrors.referralCode ? 'border-red-500' : ''}
                  />
                  {validationErrors.referralCode && (
                    <p className="text-sm text-red-500">{validationErrors.referralCode}</p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setMode('signup')}
                  disabled={loading}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setMode('signin')}
                  disabled={loading}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
