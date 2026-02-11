'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, Loader2, Shield, Kanban, Moon, Sun } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useTheme } from '../theme-provider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session.user);

            // Fetch role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            setRole(profile?.role);

            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Leads', href: '/leads', icon: Users },
        { name: 'Pipeline', href: '/pipeline', icon: Kanban },
    ];



    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-app)', color: 'var(--color-accent-primary)' }}>
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                background: 'var(--color-bg-app)', // Changed from hardcoded rgba
                position: 'fixed',
                height: '100vh',
                zIndex: 50
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>JV</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.5px', lineHeight: '1.2' }}>Jeevana Vidya</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Online School</span>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                color: isActive ? 'white' : 'var(--color-text-secondary)',
                                background: isActive ? 'var(--color-accent-primary)' : 'transparent',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                textDecoration: 'none'
                            }}>
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '10px',
                            marginBottom: '16px',
                            borderRadius: '8px',
                            color: 'var(--color-text-secondary)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                            <Shield size={16} color="var(--color-text-secondary)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.user_metadata?.full_name || 'User'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{user?.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            color: '#EF4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ marginLeft: '260px', flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
