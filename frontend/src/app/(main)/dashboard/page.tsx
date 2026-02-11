'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, ArrowRight, UserPlus, Users, ListTodo, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
    const [leads, setLeads] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('dashboard_leads');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [tasks, setTasks] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('dashboard_tasks');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [stats, setStats] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('dashboard_stats');
            return cached ? JSON.parse(cached) : { totalLeads: 0, activeTasks: 0, conversionRate: 0 };
        }
        return { totalLeads: 0, activeTasks: 0, conversionRate: 0 };
    });

    // Only show loader if we miss critical data
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('dashboard_stats');
        }
        return true;
    });

    useEffect(() => {
        const fetchData = async () => {
            // Fetch total leads
            const { count: totalLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            // Fetch enrolled leads
            const { count: enrolledLeads } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'enrolled');

            const calculatedRate = totalLeads ? Math.round((enrolledLeads || 0) / totalLeads * 100) : 0;

            // Fetch recent leads
            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch pending tasks
            const { data: tasksData, count: tasksCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(5);

            const newStats = {
                totalLeads: totalLeads || 0,
                activeTasks: tasksCount || 0,
                conversionRate: calculatedRate
            };

            setLeads(leadsData || []);
            setTasks(tasksData || []);
            setStats(newStats);

            // Cache Data
            localStorage.setItem('dashboard_leads', JSON.stringify(leadsData || []));
            localStorage.setItem('dashboard_tasks', JSON.stringify(tasksData || []));
            localStorage.setItem('dashboard_stats', JSON.stringify(newStats));

            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, here&apos;s what&apos;s happening today.</p>
                </div>
                <Link href="/leads/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} />
                    New Lead
                </Link>
            </header>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>Total Leads</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{stats.totalLeads}</h3>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#60A5FA' }}>
                        <Users size={24} />
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>Active Tasks</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{stats.activeTasks}</h3>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#F87171' }}>
                        <ListTodo size={24} />
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>Conversion Rate</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{stats.conversionRate}%</h3>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#34D399' }}>
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Main Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

                {/* Recent Leads */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Recent Leads</h3>
                        <Link href="/leads" style={{ color: 'var(--color-accent-primary)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {leads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                            <UserPlus size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                            <p>No leads yet. Add your first one!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {leads.map(lead => (
                                <div key={lead.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3730a3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                            {lead.parent_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600, color: 'white' }}>{lead.parent_name}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{lead.email || lead.phone}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        background: lead.status === 'new' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        color: lead.status === 'new' ? '#60A5FA' : '#9CA3AF',
                                        textTransform: 'uppercase'
                                    }}>
                                        {lead.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Tasks */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>My Tasks Today</h3>
                        {/* Placeholder Link */}
                    </div>

                    {tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                            <ListTodo size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                            <p>No pending tasks. Great job!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tasks.map(task => (
                                <div key={task.id} style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                }}>
                                    <div
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('tasks')
                                                .update({ status: 'completed' })
                                                .eq('id', task.id);

                                            if (!error) {
                                                setTasks((prev: any[]) => prev.filter(t => t.id !== task.id));
                                                // Update stats count
                                                setStats((prev: any) => ({ ...prev, activeTasks: prev.activeTasks - 1 }));
                                                toast.success("Task completed!");
                                            }
                                        }}
                                        style={{
                                            marginTop: '2px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '4px',
                                            border: '2px solid var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-accent-secondary)';
                                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    ></div>
                                    <div>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{task.title}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            <Calendar size={12} />
                                            <span>{new Date(task.due_date || task.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
