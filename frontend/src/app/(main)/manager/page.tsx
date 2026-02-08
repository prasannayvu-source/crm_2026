'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
    // Only show loader if we have NO data
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('pipeline_summary');
        }
        return true;
    });

    useEffect(() => {
        const fetchReportData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Authentication error');
                return;
            }
            const token = session.access_token;

            try {
                const [summaryRes, agingRes] = await Promise.all([
                    fetch(`${API_URL}/pipeline/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/pipeline/aging?threshold_days=3`, { headers: { Authorization: `Bearer ${token}` } })
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

            } catch (err) {
                console.error(err);
                // Silent fail is better for background updates if we have cache
                if (summary.length === 0) toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    if (loading) {
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
                                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>Inacitve Since</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                                        {new Date(lead.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
