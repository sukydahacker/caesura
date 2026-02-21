import { getMe } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logout } from '@/lib/api';
import { toast } from 'sonner';

export default function Navbar({ onLogin }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getMe();
        setUser(response.data);
      } catch (error) {
        // User not logged in
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <a href="/" className="font-heading text-2xl font-bold" data-testid="navbar-logo">
          CAESURA
        </a>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/marketplace')}
            className="rounded-full font-subheading"
            data-testid="navbar-marketplace-link"
          >
            Shop Now
          </Button>
          
          {user ? (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="rounded-full font-subheading"
                data-testid="navbar-dashboard-link"
              >
                Dashboard
              </Button>
              
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/admin')}
                  className="rounded-full font-subheading"
                  data-testid="navbar-admin-link"
                >
                  Admin
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/cart')}
                className="rounded-full"
                data-testid="navbar-cart-btn"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="rounded-full"
                data-testid="navbar-logout-btn"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            onLogin && (
              <Button 
                onClick={onLogin}
                className="rounded-full font-subheading bg-primary hover:bg-primary/90"
                data-testid="navbar-login-btn"
              >
                Sign In
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}