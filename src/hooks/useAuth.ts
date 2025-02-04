import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const checkUserRole = async (userId: string) => {
      if (!userId) {
        setIsAdmin(false);
        setIsBlocked(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsAdmin(data.role === 'admin');
          setIsBlocked(data.role === 'blocked');
          
          // If user is blocked, sign them out and redirect to login
          if (data.role === 'blocked') {
            await supabase.auth.signOut();
            navigate('/login', { 
              state: { 
                error: 'Your account has been blocked. Please contact an administrator.' 
              }
            });
          }
        } else {
          // Only try to create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert([{ id: userId, role: 'user' }], { 
              onConflict: 'id',
              ignoreDuplicates: true 
            });

          if (insertError) throw insertError;
          setIsAdmin(false);
          setIsBlocked(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setError(error as Error);
        setIsAdmin(false);
        setIsBlocked(false);
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
          setTimeout(() => checkUserRole(userId), retryDelay * retryCount);
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setUser(session?.user ?? null);
        if (session?.user) {
          await checkUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error as Error);
        setIsLoading(false);
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkUserRole(session.user.id);
      } else {
        setIsAdmin(false);
        setIsBlocked(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { user, isAdmin, isBlocked, isLoading, error };
}