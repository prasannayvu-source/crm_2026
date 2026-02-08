'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, LogOut, Shield, User } from 'lucide-react';

interface UserProfile {
    id: string;
    role: string;
    full_name: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch profile
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
            setLoading(false);
        };

        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', backdropFilter: 'blur(12px)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>OnlyAI CRM</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <User className="h-4 w-4" />
                            <span>{profile?.full_name}</span>
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', background: 'rgba(79, 70, 229, 0.1)', color: '#818cf8', fontSize: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.2)', textTransform: 'capitalize' }}>
                                {profile?.role}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{ padding: '8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container" style={{ padding: '48px 16px' }}>
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', color: '#818cf8' }}>
                            <Shield className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                                Welcome to your Dashboard
                            </h1>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                You are logged in as a <span style={{ color: 'var(--color-accent-primary)', textTransform: 'capitalize' }}>{profile?.role}</span>.
                            </p>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: '24px' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            Phase 0 complete. Access control and authentication are active.
                            <br />
                            Navigate to implemented modules using the sidebar (Coming in Phase 1).
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
