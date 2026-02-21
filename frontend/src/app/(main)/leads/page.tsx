'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
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
    const [visibleCount, setVisibleCount] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedLeads = [...leads].sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    useEffect(() => {
        async function checkPermission() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const res = await fetch('/api/v1/auth/me', {
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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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

                const response = await fetch(`${API_URL}/api/v1/leads/?${params.toString()}`, {
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
            } catch (error: any) {
                console.error('Error fetching leads:', error);
                alert(`Error loading leads: ${error.message}`);
                setLeads([]); // Clear leads on error (e.g. 403 Forbidden)
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchLeads();
            setVisibleCount(10);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filterStatus, searchQuery]);

    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [counselors, setCounselors] = useState<any[]>([]);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [targetCounselor, setTargetCounselor] = useState('');

    useEffect(() => {
        // Fetch counselors for reassignment
        async function loadCounselors() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            // Fetch users with role 'counselor' or 'admin'
            // We'll use the profiles table
            const { data } = await supabase.from('profiles').select('id, full_name').in('role', ['counselor', 'admin', 'manager']);
            setCounselors(data || []);
        }
        if (canCreateLead) loadCounselors(); // Only load if can manage leads
    }, [canCreateLead]);

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lid => lid !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleBulkReassign = async () => {
        if (!targetCounselor) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/v1/pipeline/bulk-assign', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lead_ids: selectedLeads,
                    new_owner_id: targetCounselor
                })
            });

            if (res.ok) {
                // Success
                setShowReassignModal(false);
                setSelectedLeads([]);
                // Refresh list
                const searchParams = new URLSearchParams();
                if (filterStatus !== 'all') searchParams.append('status', filterStatus);
                if (searchQuery) searchParams.append('search', searchQuery);

                // Trigger re-fetch logic (simplified by just reloading or calling fetchLeads if accessible)
                // We'll reload for simplicity or lift fetchLeads out. 
                // Currently fetchLeads is inside useEffect. We can just force a reload or dependency update.
                // Let's reload window for now to be safe with state
                window.location.reload();
            } else {
                const errData = await res.json().catch(() => ({ detail: res.statusText }));
                console.error("Failed to reassign:", res.status, errData);
                const errMsg = typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : (errData.detail || 'Unknown error');
                alert(`Failed: ${errMsg}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Leads</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Manage and track your admissions pipeline.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedLeads.length > 0 && canCreateLead && (
                        <button
                            onClick={() => setShowReassignModal(true)}
                            className="glass-card"
                            style={{
                                background: '#4F46E5', color: 'white', border: 'none',
                                padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            Reassign ({selectedLeads.length})
                        </button>
                    )}
                    {canCreateLead && (
                        <Link href="/leads/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={20} />
                            Add Lead
                        </Link>
                    )}
                </div>
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
                                {canCreateLead && (
                                    <th style={{ padding: '16px', width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.length === leads.length && leads.length > 0}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                    </th>
                                )}
                                <th onClick={() => handleSort('parent_name')} style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Name <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Status <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('source')} style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Source <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('created_at')} style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Date Added <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLeads.slice(0, visibleCount).map((lead) => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                                    {canCreateLead && (
                                        <td style={{ padding: '16px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.includes(lead.id)}
                                                onChange={() => toggleSelect(lead.id)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>
                                    )}
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
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {leads.length > visibleCount && (
                    <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            style={{
                                padding: '8px 24px',
                                fontSize: '0.9rem',
                                color: 'var(--color-accent-primary)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px dashed rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                fontWeight: 500
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                        >
                            Show More ({leads.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>

            {/* Reassign Modal */}
            {showReassignModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '24px', background: '#1F2937' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Assign to Counselor</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            Reassigning {selectedLeads.length} leads.
                        </p>
                        <select
                            className="glass-input"
                            style={{ padding: '12px', marginBottom: '24px', background: 'rgba(0,0,0,0.3)' }}
                            value={targetCounselor}
                            onChange={(e) => setTargetCounselor(e.target.value)}
                        >
                            <option value="">Select Counselor...</option>
                            {counselors.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowReassignModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleBulkReassign} className="btn-primary" disabled={!targetCounselor}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
