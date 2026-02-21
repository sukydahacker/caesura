import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '@/lib/api';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Use ref to prevent double processing under StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Authentication failed');
          navigate('/', { replace: true });
          return;
        }

        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const response = await createSession(sessionId);
        const user = response.data;

        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard', { replace: true, state: { user } });
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/', { replace: true });
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen" data-testid="auth-callback-container">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" data-testid="auth-loading-spinner"></div>
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}