import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../hooks/useAuth';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { currentTheme } = useThemeStore();
  const { loading, error, setError, handleLogin, handleGoogleSignIn, handleAppleSignIn } = useAuth();
  const googleButtonRef = useRef<HTMLButtonElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Simple check if user is already authenticated - don't redirect if on auth page
    // This prevents white screen issues
    if (user) {
      // Only redirect if this was a regular login, not a force auth
      const currentPath = window.location.pathname;
      if (currentPath === '/auth') {
        navigate('/');
      }
    }
    
    // Check if the user was redirected after email confirmation
    if (urlParams.has('confirmed') && urlParams.get('confirmed') === 'true') {
      setShowEmailConfirmed(true);
    }
    
    // Check if there was an error with social authentication
    if (urlParams.has('error') && urlParams.get('error') === 'social_auth_failed') {
      setFormData(prevState => prevState); // Trigger re-render without state change
      setError('Social sign-in failed. Please try again or use email and password.');
    }
    
    // Check if we should auto-trigger Google sign-in - With enhanced debugging
    console.log('🔍 Auth page: Checking for login parameter in URL');
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 URL search params:', [...urlParams.entries()]);
    console.log('🔍 Has login param:', urlParams.has('login'));
    console.log('🔍 Login param value:', urlParams.get('login'));
    
    if (urlParams.has('login') && urlParams.get('login') === 'google') {
      console.log('✅ DETECTED GOOGLE LOGIN PARAMETER IN AUTH PAGE - Auto-triggering Google sign-in');
      
      // Show loading message
      setError('Preparing Google sign-in...');
      
      // Try multiple times with increasing delays to ensure the button is found
      [500, 1000, 1500, 2000].forEach(delay => {
        setTimeout(() => {
          console.log(`🔍 Auth page: Attempting to find Google button (delay: ${delay}ms)`);
          
          // Check if button exists
          if (googleButtonRef.current) {
            // Log additional information about the button
            console.log('🔘 Auth page: Button details:', 
              googleButtonRef.current.id,
              googleButtonRef.current.className,
              googleButtonRef.current.innerText);
            
            console.log('🔘 Auth page: Auto-clicking Google sign-in button NOW');
            googleButtonRef.current.click();
          } else if (delay === 2000) {
            // Last attempt - use direct function call if button still not found
            console.warn('❌ Auth page: Google sign-in button reference not found after multiple attempts!');
            console.log('⚠️ Auth page: Falling back to direct function call for Google sign-in');
            // Direct function call as fallback
            handleGoogleSignIn();
          }
        }, delay);
      });
    } else {
      console.log('ℹ️ Auth page: No Google login parameter detected in URL');
    }
  }, [user, navigate, handleGoogleSignIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(formData);
  };

  // Theme-based classes
  const bgClass = currentTheme === 'dark' ? 'bg-[#1e1e2d]' : 'bg-gray-50';
  const cardBgClass = currentTheme === 'dark' ? 'bg-[#252532]' : 'bg-white';
  const secondaryTextClass = currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = currentTheme === 'dark' ? 'bg-[#1e1e2d]' : 'bg-white';
  const inputBorderClass = currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const floTextClass = currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-700';

  return (
    <div className={`min-h-[100dvh] ${bgClass} flex flex-col pt-safe pb-safe`}>
      <div className="flex-1 flex items-start sm:items-center justify-center p-4">
        <div className={`${cardBgClass} rounded-xl shadow-lg w-full max-w-md p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6`}>
          {/* Logo */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-primary">SERV</span>
              <span className={floTextClass}>FLO</span>
            </h1>
            <p className={`${secondaryTextClass} text-base sm:text-lg`}>
              Service Business Management Platform
            </p>

            {/* Email confirmation success message */}
            {showEmailConfirmed && (
              <div className="mt-2 sm:mt-4 bg-green-50 text-green-700 p-3 sm:p-4 rounded-lg animate-pulse">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-1 sm:mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium text-center text-sm sm:text-base">Email confirmed successfully!</p>
                <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-center">You can now sign in with your email and password to access your account.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                Email Address
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full rounded-lg border ${inputBorderClass} ${inputBgClass} px-3 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base`}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5 sm:mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full rounded-lg border ${inputBorderClass} ${inputBgClass} px-3 py-2.5 sm:px-4 sm:py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 sm:p-2 -mr-1 sm:-mr-2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>


            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="rememberMe" className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 py-0.5 sm:py-1">
                Remember me
              </label>
            </div>

            {error && (
              <div className={`text-xs sm:text-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 ${
                error.toLowerCase().includes("redirecting")
                  ? "text-blue-600 bg-blue-50"
                  : "text-red-600 bg-red-50"
              }`}>
                {error}
              </div>
            )}

            <button
              data-testid="sign-in-button"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base touch-manipulation"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
              ) : (
                'Sign In'
              )}
            </button>

            {/* Social Sign-in Options */}
            <div className="mt-2 sm:mt-4">
              <div className="relative flex items-center py-1 sm:py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className={`px-2 sm:px-3 text-xs sm:text-sm ${secondaryTextClass}`}>Or continue with</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                {/* Google Sign In Button */}
                <button
                  ref={googleButtonRef}
                  id="google-signin-button"
                  data-provider="google"
                  data-native-signin="true"
                  type="button"
                  onClick={(e) => {
                    // Try to detect if we're in iOS
                    const isIOSApp = navigator.userAgent.includes('servflo-ios-app');
                    if (isIOSApp) {
                      console.log("iOS app detected, showing direct confirmation");
                      // Change button text to show feedback
                      const target = e.currentTarget;
                      const span = target.querySelector('span');
                      if (span) {
                        span.innerText = "Opening Safari...";
                      }
                      // Make button green to show it was clicked
                      target.style.backgroundColor = "#34d399";
                      target.style.color = "white";
                      // Prevent default behavior in iOS
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    handleGoogleSignIn();
                  }}
                  disabled={loading}
                  className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border ${inputBorderClass} ${inputBgClass} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="sm:w-5 sm:h-5">
                    <path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">Google</span>
                </button>

                {/* Apple Sign In Button */}
                <button
                  id="apple-signin-button"
                  data-provider="apple"
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border ${inputBorderClass} ${inputBgClass} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="sm:w-5 sm:h-5">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.45-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.45C2.33 15.85 3.07 8.08 8.05 7.82c1.32.07 2.25.78 3.05.84.89-.23 1.89-.95 3.2-.81 1.67.17 2.92.99 3.73 2.53-3.36 1.89-2.58 6.14.45 7.35-.65 1.57-1.48 3.13-3.06 4.55zM13 5.35c.18-1.34-.37-2.67-1.21-3.5C10.5 1.08 8.8.92 7.68 2c-.24.96-.08 1.67.17 2.38.31.88 1.17 1.93 2.5 1.96.2-1.22 1.08-2.09 2.65-2.99z" fill="currentColor" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">Apple</span>
                </button>
              </div>
            </div>
          </form>

          {/* Subscription Section */}
          <div className="text-center">
            <div className={`py-3 px-3 sm:py-4 md:py-5 sm:px-4 md:px-5 mt-3 sm:mt-4 md:mt-5 rounded-lg sm:rounded-xl border ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <h3 className={`text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 ${
                currentTheme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                New to ServFlo?
              </h3>

              <div className={`mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-1 ${
                currentTheme === 'dark' ? 'text-primary' : 'text-primary'
              }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Try ServFlo FREE for 30 days</span>
              </div>

              <p className={`text-xs sm:text-sm mb-2 sm:mb-3 md:mb-4 hidden sm:block ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Streamline your service business with our all-in-one platform
              </p>

              <button
                type="button"
                onClick={() => navigate('/sign-up')}
                className="w-full py-2.5 sm:py-3 md:py-3 px-4 sm:px-5 md:px-6 text-sm sm:text-base font-medium rounded-lg transition-colors shadow-sm bg-primary text-white hover:bg-primary/90 touch-manipulation"
              >
                Start Your Free Trial
              </button>

              <p className={`mt-2 sm:mt-3 text-xs ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No credit card required. Cancel anytime.
              </p>
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 mb-1 sm:mb-2">
              <button
                type="button"
                onClick={() => window.location.href = 'mailto:support@servflo.app'}
                className="text-xs sm:text-sm text-primary hover:underline py-1 sm:py-2"
              >
                Need help? Contact support
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Auth;