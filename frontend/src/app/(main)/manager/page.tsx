'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerDashboard() {
    const [summary, setSummary] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('pipeline_summary');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });

    const [agingLeads, setAgingLeads] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('pipeline_aging');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });

    const [counselorPerformance, setCounselorPerformance] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('counselor_performance');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });

    // Only show loader if we have NO data in cache
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('pipeline_summary');
        }
        return true;
    });

    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    // Use relative path to leverage Next.js proxy
    const API_URL = '/api/v1';

    useEffect(() => {
        const checkAccessAndFetch = async () => {
            // 1. Check Access
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const token = session.access_token;
            try {
                // Determine Role
                const authRes = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store'
                });

                if (authRes.ok) {
                    const user = await authRes.json();
                    if (user.role !== 'admin' && user.role !== 'manager') {
                        toast.error('Access Denied: Managers only');
                        router.push('/dashboard');
                        return;
                    }
                    setAuthorized(true);
                } else {
                    router.push('/dashboard');
                    return;
                }

                // 2. Fetch Data (Only if authorized)
                setLoading(true);
                try {
                    const [summaryRes, agingRes, perfRes] = await Promise.all([
                        fetch(`${API_URL}/pipeline/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${API_URL}/pipeline/aging?threshold_days=3`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${API_URL}/analytics/counselor-performance`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);

                    if (summaryRes.ok) {
                        const summaryData = await summaryRes.json();
                        setSummary(summaryData);
                        localStorage.setItem('pipeline_summary', JSON.stringify(summaryData));
                    }

                    if (agingRes.ok) {
                        const agingData = await agingRes.json();
                        setAgingLeads(agingData || []);
                        localStorage.setItem('pipeline_aging', JSON.stringify(agingData));
                    }

                    if (perfRes.ok) {
                        const perfData = await perfRes.json();
                        setCounselorPerformance(perfData || []);
                        localStorage.setItem('counselor_performance', JSON.stringify(perfData));
                    }

                } catch (err) {
                    console.error('Fetch error:', err);
                    if (summary.length === 0) toast.error('Failed to update dashboard');
                } finally {
                    setLoading(false);
                }

            } catch (err) {
                console.error('Auth check error:', err);
                router.push('/dashboard');
            }
        };

        checkAccessAndFetch();
    }, []);

    if (loading || !authorized) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    // Chart Data Preparation (Simple Bar Logic)
    const maxCount = Math.max(...summary.map(s => s.count), 1);

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Manager Dashboard</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Overview of pipeline health and team performance.</p>
            </div>

            {/* Pipeline Health Section */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <BarChart2 size={20} color="var(--color-accent-primary)" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Pipeline Volume by Stage</h3>
                </div>

                <div style={{ display: 'flex', height: '300px', gap: '16px' }}>
                    {/* Y-Axis Labels */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '30px', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textAlign: 'right', paddingRight: '8px' }}>
                        <span>{maxCount}</span>
                        <span>{Math.round(maxCount * 0.75)}</span>
                        <span>{Math.round(maxCount * 0.5)}</span>
                        <span>{Math.round(maxCount * 0.25)}</span>
                        <span>0</span>
                    </div>

                    {/* Chart Area */}
                    <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                        {/* Grid Lines */}
                        <div style={{ position: 'absolute', inset: '0 0 30px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', width: '100%', height: '1px' }} />
                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', width: '100%', height: '1px' }} />
                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', width: '100%', height: '1px' }} />
                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', width: '100%', height: '1px' }} />
                            <div style={{ /* Bottom line handled by container border */ }} />
                        </div>

                        {/* Bars Container */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '0', position: 'relative', zIndex: 1, paddingLeft: '16px', paddingRight: '16px' }}>
                            {summary.map((stage) => {
                                const heightPercent = (stage.count / maxCount) * 100;

                                const STATUS_COLORS: Record<string, string> = {
                                    new: '#3B82F6', // Blue
                                    attempted_contact: '#6366F1', // Indigo
                                    connected: '#8B5CF6', // Violet
                                    visit_scheduled: '#A855F7', // Purple
                                    application_submitted: '#F59E0B', // Amber
                                    enrolled: '#10B981', // Emerald (Green)
                                    lost: '#EF4444' // Red
                                };

                                return (
                                    <div key={stage.status} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <div style={{
                                            width: '40%',
                                            maxWidth: '50px',
                                            height: `calc(${Math.max(heightPercent, 1)}% - 30px)`, // Subtract label height
                                            background: STATUS_COLORS[stage.status] || 'gray',
                                            opacity: 0.9,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s ease',
                                            position: 'relative',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}>
                                            <span style={{ position: 'absolute', top: '-22px', fontWeight: 600, fontSize: '0.8rem', color: 'white' }}>{stage.count > 0 ? stage.count : ''}</span>
                                        </div>
                                        <div style={{
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%'
                                        }}>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--color-text-secondary)',
                                                textTransform: 'uppercase',
                                                textAlign: 'center',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                padding: '0 4px'
                                            }}>
                                                {stage.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stalled Leads Section */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <AlertTriangle size={20} color="#F59E0B" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Stalled Leads (No updates in 3+ days)</h3>
                </div>

                {agingLeads.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <TrendingUp size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <p>No stalled leads found. Pipeline is moving fast!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {agingLeads.map((lead) => (
                            <div key={lead.id} style={{
                                padding: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{lead.parent_name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Current Status: <span style={{ color: 'white', fontWeight: 500, textTransform: 'uppercase' }}>{lead.status.replace('_', ' ')}</span>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>Inactive Since</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                                        {new Date(lead.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Team Performance Section */}
            <div className="glass-card" style={{ padding: '24px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <BarChart2 size={20} color="#10B981" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Team Performance</h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px', fontWeight: 600 }}>Counselor</th>
                                <th style={{ padding: '12px', fontWeight: 600 }}>Total Leads</th>
                                <th style={{ padding: '12px', fontWeight: 600 }}>Enrollments</th>
                                <th style={{ padding: '12px', fontWeight: 600 }}>Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counselorPerformance.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No performance data available.</td>
                                </tr>
                            ) : (
                                counselorPerformance.map((c: any) => (
                                    <tr key={c.counselor_id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{c.counselor_name}</td>
                                        <td style={{ padding: '16px' }}>{c.total_leads}</td>
                                        <td style={{ padding: '16px', color: '#10B981', fontWeight: 600 }}>{c.enrollments}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${c.conversion_rate}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.9rem' }}>{c.conversion_rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
