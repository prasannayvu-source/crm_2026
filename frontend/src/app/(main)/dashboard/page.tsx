'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, ArrowRight, UserPlus, Users, ListTodo, Calendar, Clock, AlertTriangle } from 'lucide-react';
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
            return cached ? JSON.parse(cached) : { totalLeads: 0, activeTasks: 0, conversionRate: 0, overdueLeads: 0 };
        }
        return { totalLeads: 0, activeTasks: 0, conversionRate: 0, overdueLeads: 0 };
    });

    // Only show loader if we miss critical data
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('dashboard_stats');
        }
        return true;
    });

    const [canCreateLead, setCanCreateLead] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        async function checkPermission() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const res = await fetch(`${API_URL}/api/v1/auth/me`, {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
                if (res.status === 401) {
                    console.log('Dashboard: Session expired (401), redirecting to login');
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                    return;
                }

                if (res.status === 403) {
                    console.warn('Dashboard: Access Denied (403), user not in whitelist');
                    await supabase.auth.signOut();
                    window.location.href = '/login?error=access_denied';
                    return;
                }

                if (res.ok) {
                    const user = await res.json();
                    if (user.permissions && (user.permissions['*'] || user.permissions['leads.create'])) {
                        setCanCreateLead(true);
                    }
                }
            } catch (e) { console.error(e); }
        }
        checkPermission();
    }, []);

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

            // Calculate Overdue Leads (Client-side SLA Logic)
            const { data: allLeads } = await supabase
                .from('leads')
                .select('status, last_interaction_at, updated_at');

            let overdueCount = 0;
            const now = new Date();
            const slaMap: Record<string, number> = {
                "new": 24,
                "attempted_contact": 48,
                "connected": 72,
                "visit_scheduled": 168, // 7 days
                "application_submitted": 72
            };

            if (allLeads) {
                allLeads.forEach((lead: any) => {
                    const limit = slaMap[lead.status];
                    const dateStr = lead.last_interaction_at || lead.updated_at;
                    if (limit && dateStr) {
                        const lastInter = new Date(dateStr);
                        const diffHours = (now.getTime() - lastInter.getTime()) / (1000 * 60 * 60);
                        if (diffHours > limit) overdueCount++;
                    }
                });
            }

            const newStats = {
                totalLeads: totalLeads || 0,
                activeTasks: tasksCount || 0,
                conversionRate: calculatedRate,
                overdueLeads: overdueCount
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
                {canCreateLead && (
                    <Link href="/leads/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} />
                        New Lead
                    </Link>
                )}
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

                <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>Stalled Leads</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#F87171' }}>{stats.overdueLeads || 0}</h3>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#F87171' }}>
                        <AlertTriangle size={24} />
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
                            {leads.map((lead: any) => (
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
                            {tasks.map((task: any) => (
                                <div key={task.id} style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    cursor: 'default',
                                    transition: 'background 0.2s'
                                }}
                                    className="task-card"
                                >
                                    {/* Task Content - Click to Edit */}
                                    <div
                                        style={{ flex: 1, cursor: 'pointer' }}
                                        onClick={() => setSelectedTask({ ...task })}
                                    >
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

            {/* Task Details Modal */}
            {selectedTask && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }} onClick={() => setSelectedTask(null)}>
                    <div
                        className="glass-card"
                        style={{ width: '500px', padding: '32px', background: '#1F2937', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>{selectedTask.title}</h3>

                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>DESCRIPTION</p>
                            <textarea
                                className="glass-input"
                                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                                value={selectedTask.description || ''}
                                onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                placeholder="Add a description..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 600 }}>DUE DATE</p>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={selectedTask.due_date ? new Date(selectedTask.due_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 600 }}>STATUS</p>
                                <select
                                    className="glass-input"
                                    value={selectedTask.status}
                                    onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            {/* Save Changes Button */}
                            <button
                                onClick={async () => {
                                    // Handle empty date string by converting to null
                                    const updateData = {
                                        description: selectedTask.description,
                                        due_date: selectedTask.due_date || null,
                                        status: selectedTask.status
                                    };

                                    const { data, error } = await supabase
                                        .from('tasks')
                                        .update(updateData)
                                        .eq('id', selectedTask.id)
                                        .select();

                                    if (!error && data && data.length > 0) {
                                        const updatedTask = data[0];
                                        // Update UI with the real object from DB
                                        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

                                        // If status is completed, remove from dashboard list
                                        if (updatedTask.status === 'completed') {
                                            setTasks(prev => prev.filter(t => t.id !== updatedTask.id));
                                            setStats((prev: any) => ({ ...prev, activeTasks: Math.max(0, prev.activeTasks - 1) }));
                                        }

                                        toast.success("Task updated!");
                                        setSelectedTask(null);
                                    } else {
                                        console.error("Supabase Error:", error);
                                        toast.error(error?.message || "Failed to update task");
                                    }
                                }}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                            {/* Mark Complete Shortcut */}
                            {selectedTask.status !== 'completed' && (
                                <button
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('tasks')
                                            .update({ status: 'completed' })
                                            .eq('id', selectedTask.id);

                                        if (!error) {
                                            setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
                                            setStats((prev: any) => ({ ...prev, activeTasks: Math.max(0, prev.activeTasks - 1) }));
                                            toast.success("Task completed!");
                                            setSelectedTask(null);
                                        } else {
                                            toast.error("Failed to complete");
                                        }
                                    }}
                                    className="btn-primary"
                                    style={{ background: '#10B981', borderColor: '#059669' }}
                                >
                                    Mark Complete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
