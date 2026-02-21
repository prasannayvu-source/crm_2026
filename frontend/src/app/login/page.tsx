"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Inner component — uses useSearchParams(), must be inside <Suspense>
function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Check for error param on mount
    useEffect(() => {
        const errParam = searchParams.get('error');
        if (errParam === 'access_denied') {
            setError("Access Denied: You are not authorized to access this system. Please contact the administrator.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "An error occurred with Google login.");
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: "url('/images/Login_Background.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Dark Overlay with Blur */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(3, 7, 18, 0.8)', // Deep dark overlay
                backdropFilter: 'blur(8px)',
                zIndex: 1
            }}></div>

            {/* Main Card */}
            <div className="glass-card" style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '440px',
                padding: '48px 40px',
                borderRadius: '24px',
                background: 'rgba(17, 24, 39, 0.7)', // Darker glass
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}>
                {/* Logo Section */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.05))',
                        marginBottom: '16px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#2563EB',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '800',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                        }}>
                            JV
                        </div>
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: '#F9FAFB',
                        letterSpacing: '-0.025em',
                        marginBottom: '8px'
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Sign in to manage your school operations
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#FCA5A5',
                        fontSize: '0.875rem',
                        marginBottom: '24px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#E5E7EB',
                            marginBottom: '8px',
                            marginLeft: '2px'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            className="glass-input"
                            placeholder="name@school.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                padding: '14px 16px',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#E5E7EB',
                            marginBottom: '8px',
                            marginLeft: '2px'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="glass-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    padding: '14px 44px 14px 16px',
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#E5E7EB'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            color: '#9CA3AF',
                            fontSize: '0.875rem'
                        }}>
                            <input
                                type="checkbox"
                                style={{
                                    accentColor: '#2563EB',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            />
                            Remember me
                        </label>
                        <Link
                            href="#"
                            style={{
                                color: '#60A5FA',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'color 0.2s'
                            }}
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginTop: '8px',
                            background: '#2563EB',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="divider" style={{ margin: '28px 0', opacity: 0.6 }}>
                    <span style={{ color: '#6B7280', fontSize: '0.75rem', background: 'transparent' }}>OR CONTINUE WITH</span>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'white',
                        color: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        opacity: loading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'white')}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                    Sign in with Google
                </button>
            </div>

            {/* Simple Footer */}
            <div style={{
                position: 'absolute',
                bottom: '24px',
                zIndex: 10,
                color: '#6B7280',
                fontSize: '0.75rem',
                display: 'flex',
                gap: '24px'
            }}>
                <span>© 2026 Jeevana Vidya Online School</span>
                <a href="#" style={{ color: '#9CA3AF' }}>Privacy Policy</a>
                <a href="#" style={{ color: '#9CA3AF' }}>Terms of Service</a>
            </div>
        </div>
    );
}

// Default export wraps LoginContent in Suspense (required by Next.js for useSearchParams)
export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#030712' }} />}>
            <LoginContent />
        </Suspense>
    );
}
