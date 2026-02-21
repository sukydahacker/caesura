import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { getMe } from '@/lib/api';
import { toast } from 'sonner';
import { User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="profile-loading"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[800px] mx-auto">
        <h1 className="font-heading text-5xl font-bold tracking-tight mb-12">Profile</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="border border-border p-8 space-y-8"
          data-testid="profile-card">
          
          <div className="flex items-center gap-6">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-24 h-24 rounded-full"
                data-testid="profile-picture"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            <div>
              <h2 className="font-heading text-3xl font-bold mb-1" data-testid="profile-name">{user.name}</h2>
              <p className="text-muted-foreground" data-testid="profile-email">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-border pt-8 space-y-4">
            <h3 className="font-heading text-xl font-semibold mb-4">Account Details</h3>
            
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium font-mono text-sm" data-testid="profile-user-id">{user.user_id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{format(new Date(user.created_at), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}