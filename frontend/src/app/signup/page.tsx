"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Loader2, User } from "lucide-react";

export default function SignupPage() {
    // ... similar refactor for Signup to match Login aesthetic ...
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });
            if (error) throw error;
            router.push("/login?signup=success"); // Optional: redirect to login or show success message
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* LEFT SIDE: Form */}
            <div className="auth-form-side">
                <div className="auth-content">
                    <div style={{ marginBottom: "40px" }}>
                        <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-text-primary)" }}>
                            <span className="text-gradient">Chiranjeevi Kamasani CRM</span>
                        </Link>
                    </div>

                    <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "12px", color: "var(--color-text-primary)" }}>Get started today</h1>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px", lineHeight: "1.6" }}>
                        Create your account and start managing your admissions pipeline.
                    </p>

                    {error && (
                        <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.9rem", marginBottom: "24px" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Full Name</label>
                            <input type="text" required className="glass-input" placeholder="e.g. John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Email</label>
                            <input type="email" required className="glass-input" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Password</label>
                            <input type="password" required className="glass-input" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Confirm Password</label>
                            <input type="password" required className="glass-input" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", paddingTop: "14px", paddingBottom: "14px" }}>
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Create Account"}
                        </button>
                    </form>

                    <p style={{ marginTop: "32px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "var(--color-accent-primary)", fontWeight: "600" }}>Sign in</Link>
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Hero / Feature Highlight */}
            <div className="auth-hero-side">
                {/* Background Image */}
                <div className="auth-bg-image" style={{ backgroundImage: "url('/images/Image.webp')" }}></div>

                {/* Overlay */}
                <div className="auth-hero-overlay"></div>

                {/* Content */}
                <div className="auth-hero-content" style={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <p style={{
                        color: "white",
                        fontSize: "2rem",
                        fontWeight: "700",
                        maxWidth: "80%",
                        lineHeight: "1.4",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        textAlign: "center"
                    }}>
                        &quot;This CRM changed the game for our school. 30% more enrollments within 3 months.&quot;
                    </p>
                </div>
            </div>
        </div>
    );
}
