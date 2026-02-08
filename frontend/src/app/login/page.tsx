"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="auth-container">
            {/* LEFT SIDE: Form */}
            <div className="auth-form-side">
                {/* Background Image for Left Panel */}
                <div className="auth-bg-image" style={{ backgroundImage: "url('/images/Login_Background.webp')" }}></div>

                {/* Overlay to Tint the Background */}
                <div className="auth-bg-tint"></div>

                {/* Login Card Container */}
                <div className="auth-glass-card">
                    <div style={{ marginBottom: "32px", textAlign: "center" }}>
                        <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--color-text-primary)" }}>
                            {/* Logo Icon */}
                            <div style={{ width: "36px", height: "36px", background: "var(--color-accent-primary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                <span style={{ fontWeight: "800", fontSize: "1.2rem" }}>C</span>
                            </div>
                            <span className="text-gradient" style={{ fontSize: "1.25rem" }}>Chiranjeevi Kamasani CRM</span>
                        </Link>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "8px", color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>Welcome back</h1>
                        <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem" }}>
                            Please enter your details to access your account.
                        </p>
                    </div>

                    {error && (
                        <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.9rem", marginBottom: "24px", textAlign: "center" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "var(--color-text-primary)", marginBottom: "6px" }}>Email</label>
                            <input
                                type="email"
                                required
                                className="glass-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ padding: "12px 16px", fontSize: "0.95rem" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "var(--color-text-primary)", marginBottom: "6px" }}>Password</label>
                            <input
                                type="password"
                                required
                                className="glass-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ padding: "12px 16px", fontSize: "0.95rem" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--color-text-secondary)" }}>
                                <input type="checkbox" style={{ accentColor: "var(--color-accent-primary)", width: "16px", height: "16px" }} />
                                Remember me
                            </label>
                            <Link href="#" style={{ color: "var(--color-accent-primary)", fontWeight: "600" }}>Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", fontSize: "1rem", fontWeight: "600", marginTop: "4px" }}>
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Sign in"}
                        </button>
                    </form>

                    <div className="divider" style={{ margin: "24px 0" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Or continue with</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="btn-secondary"
                        style={{ width: "100%", justifyContent: "center", background: "white", color: "#111827", borderColor: "#e5e7eb", fontWeight: "600", gap: "10px", padding: "12px", fontSize: "0.95rem" }}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px", height: "20px" }} />
                        Sign in with Google
                    </button>

                    <p style={{ marginTop: "24px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" style={{ color: "var(--color-accent-primary)", fontWeight: "600" }}>Sign up</Link>
                    </p>
                </div>

                {/* Footer on the Left Side - Outside Card */}
                <div className="auth-footer">
                    <span>© 2026 CK CRM</span>
                    <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
                    <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
                </div>
            </div>

            {/* RIGHT SIDE: Hero / Testimonial */}
            <div className="auth-hero-side">
                {/* Background Image */}
                <div className="auth-bg-image" style={{ backgroundImage: "url('/images/campus-hero.jpg')", filter: "brightness(0.95)" }}></div>

                {/* Overlay */}
                <div className="auth-hero-overlay"></div>

                {/* Content Container */}
                <div className="auth-hero-content">
                    {/* LEFT: Founder Profile (Anchored) */}
                    <div className="founder-profile">
                        {/* Founder Image */}
                        <div className="founder-image-wrapper">
                            <img
                                src="/images/founder.jpg"
                                alt="Chiranjeevi Kamasani"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </div>

                        {/* Founder Info */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{
                                color: "white",
                                fontWeight: "700",
                                fontSize: "1.1rem",
                                letterSpacing: "-0.5px"
                            }}>
                                Chiranjeevi Kamasani
                            </span>
                            <span style={{
                                color: "#93C5FD",
                                textTransform: "uppercase",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                letterSpacing: "1px"
                            }}>
                                Founder & Visionary
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Vision & Message (Content) */}
                    <div style={{
                        maxWidth: "550px",
                        textAlign: "right",
                        textShadow: "0 2px 10px rgba(0,0,0,0.8)"
                    }}>
                        <h2 style={{
                            color: "white",
                            fontSize: "2.25rem",
                            fontWeight: "800",
                            lineHeight: "1.2",
                            marginBottom: "16px"
                        }}>
                            Where Future Leaders <br />
                            <span style={{ color: "#60A5FA" }}>Are Forged.</span>
                        </h2>
                        <p style={{
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "1.05rem",
                            lineHeight: "1.6",
                            fontWeight: "400"
                        }}>
                            &quot;We don&apos;t just teach syllabus; we ignite curiosity. With world-class infrastructure and a culture of excellence, this school is a launchpad for greatness.&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
