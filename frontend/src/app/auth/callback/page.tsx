'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // The supabase client is initialized outside.
        // When this page loads with the hash fragment (access_token),
        // supabase-js (v2) automatically detects it and sets the session in local storage.
        // We just need to listen for the auth state change to know when it's ready.

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'ToKEN_REFRESHED') {
                // Successful login
                router.push('/dashboard');
            }
        });

        // Fallback: Check if session already exists (sometimes event fires before listener attached)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push('/dashboard');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Completing sign in...</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>Please wait while we redirect you.</p>
            </div>
        </div>
    );
}
