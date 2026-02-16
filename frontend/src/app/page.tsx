'use client';

import Link from "next/link";
import { ArrowRight, BarChart3, Users, Zap, Shield, CheckCircle, Lock } from "lucide-react";

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712', /* specific deep dark bg */
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* --- Navbar --- */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(12px)'
      }}>
        <div className="container" style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Zap size={18} fill="currentColor" />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
              Jeevana Vidya
            </span>
          </div>

          {/* Center Nav */}
          <nav style={{ display: 'flex', gap: '32px' }} className="hidden md:flex">
            <Link href="#features" style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 500 }}>Features</Link>
            <Link href="#security" style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 500 }}>Security</Link>
            <Link href="#resources" style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 500 }}>Resources</Link>
          </nav>

          {/* Auth Action */}
          <div>
            <Link
              href="/login"
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.9rem',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'white',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              }}
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: '70px' }}>

        {/* --- Hero Section --- */}
        <section style={{
          padding: '120px 0 100px',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Background Glow */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }}></div>

          <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '99px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '32px',
              fontSize: '0.875rem',
              color: '#93C5FD'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
              Enterprise Grade School CRM
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #ffffff, #9CA3AF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'white' /* Fallback */
            }}>
              The Operating System for <br /> Modern Schools
            </h1>

            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: '#9CA3AF',
              marginBottom: '48px',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              A unified platform to streamline admissions, manage student success, and empower educators with data-driven insights. Secure, scalable, and simple.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Link
                href="/login"
                className="btn-primary"
                style={{
                  height: '52px',
                  padding: '0 32px',
                  fontSize: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563EB'
                }}
              >
                Access Portal <ArrowRight size={18} />
              </Link>
            </div>

            <div style={{
              marginTop: '64px',
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              opacity: 0.5,
              filter: 'grayscale(100%)'
            }}>
              {/* Trust signals / generic placeholders since no logos provided */}
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#6B7280' }}>Trusted by Leading Institutes</div>
            </div>

          </div>
        </section>


        {/* --- Features Grid --- */}
        <section id="features" style={{ padding: '80px 0', backgroundColor: '#090E1A' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>Everything you need to grow</h2>
              <p style={{ color: '#9CA3AF' }}>Powerful tools designed for the unique needs of educational institutions.</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {/* Feature 1 */}
              <div style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(37,99,235,0.1)', color: '#60A5FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>Lead Management</h3>
                <p style={{ color: '#9CA3AF', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Capture and track student enquiries from multiple sources in one centralized dashboard.
                </p>
              </div>

              {/* Feature 2 */}
              <div style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)', color: '#34D399',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>Automated Workflows</h3>
                <p style={{ color: '#9CA3AF', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Streamline follow-ups and tasks with intelligent automation rules that save staff time.
                </p>
              </div>

              {/* Feature 3 */}
              <div style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.1)', color: '#FCD34D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <BarChart3 size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>Analytics & Reporting</h3>
                <p style={{ color: '#9CA3AF', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Gain real-time visibility into enrollment performance and team productivity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Trust/Security Mini Section --- */}
        <section id="security" style={{ padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
            <div style={{ maxWidth: '500px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '16px' }}>Enterprise-grade Security</h2>
              <p style={{ color: '#9CA3AF', lineHeight: 1.6 }}>We take data protection seriously. Your institution's data is encrypted, backed up, and protected by industry-leading security standards.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E5E7EB' }}>
                <Shield size={20} color="#60A5FA" /> 256-bit Encryption
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E5E7EB' }}>
                <Lock size={20} color="#60A5FA" /> Role-based Access
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E5E7EB' }}>
                <CheckCircle size={20} color="#60A5FA" /> Daily Backups
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E5E7EB' }}>
                <CheckCircle size={20} color="#60A5FA" /> GDPR Compliant
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer style={{
        padding: '40px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#030712'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          color: '#6B7280',
          fontSize: '0.875rem'
        }}>
          <div>
            &copy; 2026 Jeevana Vidya Online School. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
