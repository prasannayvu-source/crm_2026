'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('leads_list');
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });

    // Only show loader if we have NO data AND we are on the initial default view
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('leads_list');
        }
        return true;
    });

    const [filterStatus, setFilterStatus] = useState<string>('all');
    // Simple statuses for filter
    const statuses = ['new', 'attempted_contact', 'connected', 'visit_scheduled', 'application_submitted', 'enrolled', 'lost'];
    const [searchQuery, setSearchQuery] = useState('');
    const [canCreateLead, setCanCreateLead] = useState(false);

    useEffect(() => {
        async function checkPermission() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const res = await fetch('http://localhost:8000/api/v1/auth/me', {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                });
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
        const fetchLeads = async () => {
            if (leads.length === 0) setLoading(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.error("No session found");
                    setLeads([]);
                    setLoading(false);
                    return;
                }

                const params = new URLSearchParams();
                if (filterStatus !== 'all') params.append('status', filterStatus);
                if (searchQuery) params.append('search', searchQuery);

                const response = await fetch(`http://localhost:8000/api/v1/leads/?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                if (response.status === 403) {
                    console.warn("User does not have permission to view leads.");
                    setLeads([]);
                    setLoading(false);
                    return;
                }

                if (response.status === 401) {
                    console.log('Leads: Session expired (401), redirecting to login');
                    const { error } = await supabase.auth.signOut();
                    // Use window.location because router might be unmounted if error boundary hits? No, safe to use router.
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                setLeads(data || []);

                // Cache default view
                if (filterStatus === 'all' && searchQuery === '') {
                    localStorage.setItem('leads_list', JSON.stringify(data || []));
                }
            } catch (error) {
                console.error('Error fetching leads:', error);
                setLeads([]); // Clear leads on error (e.g. 403 Forbidden)
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchLeads();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filterStatus, searchQuery]);

    return (
        <div>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Leads</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage and track your admissions pipeline.</p>
                </div>
                {canCreateLead && (
                    <Link href="/leads/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} />
                        Add Lead
                    </Link>
                )}
            </header>

            {/* Filters & Search Bar */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="glass-input"
                            style={{ paddingLeft: '40px', width: '300px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} color="var(--color-text-secondary)" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="glass-input"
                            style={{ width: 'auto', paddingRight: '32px' }}
                        >
                            <option value="all">All Statuses</option>
                            {statuses.map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                    </div>
                ) : leads.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <p>No leads found matching your criteria.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)' }}>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Name</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Source</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Date Added</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 600 }}>{lead.parent_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{lead.email || lead.phone}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            background: lead.status === 'new' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: lead.status === 'new' ? '#60A5FA' : 'var(--color-text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {lead.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textTransform: 'capitalize' }}>{lead.source}</td>
                                    <td style={{ padding: '16px' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px' }}>
                                        <Link href={`/leads/${lead.id}`} style={{ color: 'var(--color-accent-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
