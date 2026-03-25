import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMe } from '@/lib/api';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cached = (() => { try { return JSON.parse(localStorage.getItem('caesura_user')) || null; } catch { return null; } })();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user || cached ? true : null);
  const [user, setUser] = useState(location.state?.user || cached);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await getMe();
        setIsAuthenticated(true);
        setUser(response.data);
        localStorage.setItem('caesura_user', JSON.stringify(response.data));
      } catch (error) {
        localStorage.removeItem('caesura_user');
        setIsAuthenticated(false);
        navigate('/', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}