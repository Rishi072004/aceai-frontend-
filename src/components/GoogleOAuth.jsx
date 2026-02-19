import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const GoogleOAuth = ({ onSuccess, onError, children, className = "" }) => {
  const { googleLogin } = useAuth();
  const { toast } = useToast();

  // Load Google OAuth script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = useCallback(async (response) => {
    try {
      const result = await googleLogin(response.credential);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Signed in with Google successfully.",
        });
        onSuccess && onSuccess();
      } else {
        throw new Error(result.error || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      toast({
        title: "Error",
        description: "Google sign-in failed: " + error.message,
        variant: "destructive",
      });
      onError && onError(error);
    }
  }, [googleLogin, onSuccess, onError, toast]);

  useEffect(() => {
    // Initialize Google OAuth when script loads
    const initializeGoogleOAuth = () => {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
          return;
        }
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_button: true,
        });

        // Render the button
        if (window.google.accounts.id.renderButton) {
          window.google.accounts.id.renderButton(
            document.getElementById('google-oauth-button'),
            {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: '100%',
            }
          );
        }
      }
    };

    // Check if Google script is loaded
    if (document.readyState === 'complete') {
      initializeGoogleOAuth();
    } else {
      window.addEventListener('load', initializeGoogleOAuth);
    }

    return () => {
      window.removeEventListener('load', initializeGoogleOAuth);
    };
  }, [handleCredentialResponse]);

  return (
    <div className={className}>
      <div id="google-oauth-button"></div>
    </div>
  );
};

export default GoogleOAuth;
