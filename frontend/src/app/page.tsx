'use client';
import Link from "next/link";
import { ArrowRight, BarChart3, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="navbar glass-card" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div className="container navbar-content">
          <Link href="#" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-indigo-500" />
            <span className="text-xl font-bold text-gradient">
              Jeevana Vidya Online School
            </span>
          </Link>

          <nav className="nav-links">
            <Link className="btn-secondary" style={{ border: 'none' }} href="#features">Features</Link>
            <Link className="btn-secondary" style={{ border: 'none' }} href="#pricing">Pricing</Link>
            <Link className="btn-secondary" style={{ border: 'none' }} href="#about">About</Link>
          </nav>

          <div className="flex gap-4">
            <Link className="btn-secondary text-sm" href="/login">Log In</Link>
            <Link className="btn-primary text-sm" href="/signup">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="flex-col">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg"></div>
          <div className="container">
            <h1 className="hero-title">
              Jeevana Vidya <span className="text-gradient">Online School</span>
            </h1>
            <p className="hero-subtitle">
              Integrative Education with Ethical Principles and Morals. The modern education platform for future leaders.
            </p>
            <div className="flex justify-center gap-4">
              <Link className="btn-primary" href="/signup" style={{ padding: '12px 32px', fontSize: '1.125rem' }}>
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link className="btn-secondary" href="#features" style={{ padding: '12px 32px', fontSize: '1.125rem' }}>
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="container">
            <div className="text-center" style={{ marginBottom: '64px' }}>
              <div style={{
                display: 'inline-block',
                borderRadius: '9999px',
                background: 'rgba(79, 70, 229, 0.1)',
                padding: '4px 12px',
                color: '#818cf8',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '16px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                Key Features
              </div>
              <h2 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Designed for Growth</h2>
              <p className="hero-subtitle" style={{ marginBottom: 0 }}>
                Everything you need to manage parent relationships and boost enrollment numbers.
              </p>
            </div>

            <div className="grid-3">
              {/* Feature 1 */}
              <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', width: 'fit-content', color: '#818cf8' }}>
                  <Users className="h-6 w-6" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Centralized Lead Management</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Never lose a parent enquiry again. Capture leads from web, phone, and walk-ins in one secure database.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', width: 'fit-content', color: '#4ade80' }}>
                  <Zap className="h-6 w-6" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Automated Follow-ups</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Let the system remind your team who to call. Set rules to automate tasks and ensure timely engagement.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', width: 'fit-content', color: '#fbbf24' }}>
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Real-time Insights</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Track counselor performance and pipeline health with beautiful, interactive dashboards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: '32px 0', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
        <div className="container flex items-center justify-between" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          <p>© 2026 Jeevana Vidya Online School. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#">Terms of Service</Link>
            <Link href="#">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
