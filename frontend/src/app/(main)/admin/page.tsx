'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
// Added Edit2, Trash2 to imports
import { CreateUserModal, CreateRoleModal, IntegrationModal, EditUserModal, EditRoleModal } from '@/components/AdminModals';
import { toast } from 'sonner';
import { Shield, Lock, Users, BarChart3, Settings, Check, ChevronRight, AlertCircle, Plus, Edit2, Trash2, PieChart } from 'lucide-react';
import './admin.css';

interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    last_login: string | null;
    created_at: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    is_system: boolean;
    created_at: string;
}

interface Integration {
    id: string;
    type: string;
    name: string;
    status: 'connected' | 'disconnected';
    last_sync: string | null;
}

interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    resource: string;
    resource_id: string | null;
    user_name?: string;
    user_email?: string;
    details?: any;
    before_data?: any;
    after_data?: any;
    created_at: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modal States
    const [showUserModal, setShowUserModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [integrationModal, setIntegrationModal] = useState<{ isOpen: boolean; type: string }>({ isOpen: false, type: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    // Roles UI State
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');

    // System Roles Definition (Static for UI consistency)
    const SYSTEM_ROLES: Role[] = [];

    // Permission Categories for Mock Display
    const PERMISSION_GROUPS = [
        {
            category: 'User Management',
            icon: Users,
            permissions: [
                { id: 'users.view', label: 'View Users', desc: 'Can view all system users' },
                { id: 'users.create', label: 'Create Users', desc: 'Can add new accounts' },
                { id: 'users.edit', label: 'Edit Users', desc: 'Can modify user details' },
                { id: 'users.delete', label: 'Delete Users', desc: 'Can remove accounts' }
            ]
        },
        {
            category: 'Leads & Pipeline',
            icon: BarChart3,
            permissions: [
                { id: 'leads.view_all', label: 'View All Leads', desc: 'Access to global lead base' },
                { id: 'leads.create', label: 'Create Leads', desc: 'Can add new leads' },
                { id: 'leads.edit', label: 'Edit Leads', desc: 'Can modify lead details' },
                { id: 'leads.delete', label: 'Delete Leads', desc: 'Can remove leads' },
                { id: 'leads.view_financials', label: 'View Financials', desc: 'Access payment & revenue data' },
                { id: 'leads.edit_payments', label: 'Manage Payments', desc: 'Update payment status & records' },
                { id: 'leads.assign', label: 'Assign Leads', desc: 'Can distribute leads to team' },
                { id: 'leads.export', label: 'Export Data', desc: 'Can download lead reports' }
            ]
        },
        {
            category: 'Finance & Reports',
            icon: PieChart,
            permissions: [
                { id: 'finance.view', label: 'View Dashboards', desc: 'Access revenue & analytics' },
                { id: 'finance.export', label: 'Export Reports', desc: 'Download financial statements' },
                { id: 'reports.view', label: 'View Reports', desc: 'Access system reports' }
            ]
        },
        {
            category: 'System Configuration',
            icon: Settings,
            permissions: [
                { id: 'system.settings', label: 'General Settings', desc: 'Manage global preferences' },
                { id: 'system.integrations', label: 'Manage Integrations', desc: 'Configure API & Webhooks' }
            ]
        }
    ];

    // Combined Roles List (Deduplicated)
    const allRoles = [...roles];

    // Ensure activeRole is valid
    const activeRole = allRoles.find(r => r.id === selectedRoleId) || allRoles[0];

    // Permission State Implementation
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

    const isPermissionEnabled = (roleId: string, permId: string) => {
        return (rolePermissions[roleId] || []).includes(permId);
    };

    const togglePermission = async (roleId: string, permId: string) => {
        const role = allRoles.find(r => r.id === roleId);
        if (role?.is_system) {
            toast.error("System defined roles cannot be modified.");
            return;
        }

        // Calculate new permissions
        let newPerms: string[] = [];
        const current = rolePermissions[roleId] || [];
        const isEnabled = current.includes(permId);
        newPerms = isEnabled
            ? current.filter(id => id !== permId)
            : [...current, permId];

        // Optimistic Local Update
        setRolePermissions(prev => ({
            ...prev,
            [roleId]: newPerms
        }));

        // Persist to Backend
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Convert array to dict for storage usually expected by backend
            const permDict = newPerms.reduce((acc, id) => ({ ...acc, [id]: true }), {});

            const response = await fetch(`/api/v1/admin/roles/${roleId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permissions: permDict })
            });

            if (!response.ok) throw new Error("Failed to save permission");

        } catch (error) {
            console.error("Permission save failed", error);
            toast.error("Failed to save permission setting.");
            // Revert state
            setRolePermissions(prev => ({ ...prev, [roleId]: current }));
        }
    };

    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const init = async () => {
            const isAuth = await checkAdminAccess();
            if (isAuth) {
                setAuthorized(true);
                fetchData();
            }
        };
        init();
    }, [activeTab]);

    const checkAdminAccess = async (): Promise<boolean> => {
        // Get Supabase session token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            router.push('/login');
            return false;
        }

        const token = session.access_token;
        try {
            const response = await fetch('/api/v1/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            });

            if (response.ok) {
                const userData = await response.json();
                setCurrentUser(userData);

                // Strict Admin Access Check
                const hasAccess = userData.role === 'admin';

                if (!hasAccess) {
                    router.push('/dashboard');
                    return false;
                }
                return true;
            } else {
                // If API fails (e.g. 403 Profile not found), redirect
                console.warn('Admin check failed:', response.statusText);
                router.push('/dashboard');
                return false;
            }
        } catch (error) {
            console.error('Error checking access:', error);
            router.push('/dashboard');
            return false;
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const token = session.access_token;

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            if (activeTab === 'users') {
                const response = await fetch('/api/v1/admin/users', { headers });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                }

                // Also fetch roles for the modals
                const roleRes = await fetch('/api/v1/admin/roles', { headers });
                if (roleRes.ok) {
                    const roleData = await roleRes.json();
                    setRoles(roleData || []);
                }
            } else if (activeTab === 'audit') {
                const response = await fetch('/api/v1/admin/audit-logs', { headers });
                if (response.ok) {
                    const data = await response.json();
                    setAuditLogs(data.logs || []);
                }
            } else if (activeTab === 'roles') {
                const response = await fetch('/api/v1/admin/roles', { headers, cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    setRoles(data || []);

                    // Parse and load permissions into state
                    const perms: Record<string, string[]> = {};
                    (data || []).forEach((r: any) => {
                        let pData = r.permissions;

                        // Handle potential double-encoded strings from legacy data
                        if (typeof pData === 'string') {
                            try {
                                pData = JSON.parse(pData);
                            } catch (e) {
                                console.error("Failed to parse permissions for role", r.id, pData);
                            }
                        }

                        if (pData) {
                            if (Array.isArray(pData)) {
                                perms[r.id] = pData;
                            } else if (typeof pData === 'object') {
                                // Convert dict { "perm": true } to array ["perm"]
                                perms[r.id] = Object.keys(pData).filter(k => pData[k]);
                            }
                        }
                    });
                    setRolePermissions(prev => ({ ...prev, ...perms }));
                }
            } else if (activeTab === 'integrations') {
                const response = await fetch('/api/v1/admin/integrations', { headers });
                if (response.ok) {
                    const data = await response.json();
                    setIntegrations(data || []);
                }
                // Fetch logs
                try {
                    const logRes = await fetch('/api/v1/admin/integrations/logs?limit=10', { headers });
                    if (logRes.ok) {
                        const logData = await logRes.json();
                        setWebhookLogs(logData.logs || []);
                    }
                } catch (e) { console.error(e); }
            } else if (activeTab === 'health') {
                const response = await fetch('/api/v1/admin/health', { headers });
                if (response.ok) {
                    const data = await response.json();
                    setSystemHealth(data);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (data: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch('/api/v1/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create user');
            }

            toast.success('User created successfully');
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
            console.error(error);
        }
    };

    const handleUpdateUser = async (id: string, data: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`/api/v1/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update user');
            }

            toast.success('User updated successfully');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
            console.error(error);
        }
    };

    const handleDeleteUser = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`/api/v1/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            toast.success('User deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete user');
            console.error(error);
        }
    };

    const handleCreateRole = async (data: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch('/api/v1/admin/roles', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to create role');

            toast.success('Role created successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to create role');
        }
    };

    const handleUpdateRole = async (id: string, data: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`/api/v1/admin/roles/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update role');

            toast.success('Role updated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`/api/v1/admin/roles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete role');

            toast.success('Role deleted successfully');
            if (selectedRoleId === id) setSelectedRoleId('');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete role');
        }
    };

    const handleConnectIntegration = async (data: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const response = await fetch(`/api/v1/admin/integrations/${data.type}/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: data.type, config: data.config, type: data.type })
            });

            if (!response.ok) throw new Error('Failed to connect integration');

            toast.success(`${data.type} connected successfully`);
            fetchData();
        } catch (error) {
            toast.error(`Failed to connect ${data.type}`);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'users':
                return (
                    <div className="users-section">
                        <div className="section-header">
                            <h2>User Management</h2>
                            {(currentUser?.permissions?.['*'] || currentUser?.permissions?.['users.create']) && (
                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={() => {
                                        setShowUserModal(true);
                                    }}
                                >
                                    Add User
                                </button>
                            )}
                        </div>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.full_name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role?.toLowerCase().replace(/\s+/g, '-')}`}>{user.role}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${user.status}`}>{user.status}</span>
                                            </td>
                                            <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                                            <td style={{ display: 'flex', gap: '8px' }}>
                                                {(currentUser?.permissions?.['*'] || currentUser?.permissions?.['users.edit']) && (
                                                    <button
                                                        type="button"
                                                        className="action-btn edit-btn"
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowUserModal(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {(currentUser?.permissions?.['*'] || currentUser?.permissions?.['users.delete']) && (
                                                    <button
                                                        type="button"
                                                        className="action-btn delete-btn"
                                                        style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to delete this user?')) {
                                                                await handleDeleteUser(user.id);
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'roles':
                return (
                    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Roles & Permissions</h2>
                                <p className="text-gray-400 text-sm mt-1">Manage access control and user capabilities.</p>
                            </div>
                            <button
                                onClick={() => setShowRoleModal(true)}
                                style={{
                                    backgroundColor: '#2563EB', color: 'white', padding: '10px 20px', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                <Plus size={18} />
                                Create Role
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0, overflow: 'hidden' }}>
                            {/* Left Sidebar: Roles List */}
                            <div style={{
                                width: '320px', flexShrink: 0,
                                backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden'
                            }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid #1F2937', backgroundColor: '#0F1117' }}>
                                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Defined Roles
                                    </h3>
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {allRoles.map(role => {
                                        const isSelected = selectedRoleId === role.id;
                                        return (
                                            <div
                                                key={role.id}
                                                onClick={() => setSelectedRoleId(role.id)}
                                                style={{
                                                    padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                                                    border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                                                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                                    transition: 'all 0.2s',
                                                }}
                                                className="hover:bg-gray-800"
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h4 style={{ color: isSelected ? '#60A5FA' : '#E5E7EB', fontWeight: 600, fontSize: '14px' }}>
                                                        {role.name}
                                                    </h4>
                                                    {role.is_system && <Lock size={12} color="#6B7280" />}
                                                </div>
                                                <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {role.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Panel: Details */}
                            <div style={{
                                flex: 1,
                                backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden'
                            }}>
                                {activeRole ? (
                                    <>
                                        <div style={{ padding: '24px', borderBottom: '1px solid #1F2937', backgroundColor: '#0F1117', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{activeRole.name}</h3>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
                                                        backgroundColor: activeRole.is_system ? '#374151' : 'rgba(124, 58, 237, 0.2)',
                                                        color: activeRole.is_system ? '#D1D5DB' : '#A78BFA',
                                                        border: activeRole.is_system ? '1px solid #4B5563' : '1px solid rgba(124, 58, 237, 0.4)',
                                                        display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}>
                                                        {activeRole.is_system && <Lock size={10} />}
                                                        {activeRole.is_system ? 'System Default (Locked)' : 'Custom Role'}
                                                    </span>
                                                </div>
                                                <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>{activeRole.description}</p>
                                            </div>
                                            {!activeRole.is_system && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => setEditingRole(activeRole)} style={{ padding: '8px', backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', color: '#E5E7EB' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteRole(activeRole.id)} style={{ padding: '8px', backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', color: '#F87171' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                            {activeRole.is_system && (
                                                <div style={{ backgroundColor: 'rgba(30, 64, 175, 0.1)', border: '1px solid rgba(30, 64, 175, 0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                                                    <Shield size={20} color="#60A5FA" />
                                                    <div>
                                                        <h4 style={{ color: '#93C5FD', fontSize: '14px', fontWeight: 600 }}>Read-Only Permissions</h4>
                                                        <p style={{ color: '#BFDBFE', fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                                                            Standard system role permissions cannot be modified.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                {PERMISSION_GROUPS.map((group, idx) => (
                                                    <div key={idx}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1F2937' }}>
                                                            <group.icon size={18} color="#9CA3AF" />
                                                            <h4 style={{ color: '#E5E7EB', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {group.category}
                                                            </h4>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                                            {group.permissions.map((perm) => (
                                                                <div key={perm.id} style={{
                                                                    backgroundColor: '#1F2937', padding: '16px', borderRadius: '8px', border: '1px solid #374151',
                                                                    display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <div style={{ paddingRight: '12px' }}>
                                                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{perm.label}</div>
                                                                            <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>{perm.desc}</div>
                                                                        </div>
                                                                        {/* Mock Switch */}
                                                                        {/* Toggle Switch */}
                                                                        <div
                                                                            title={activeRole.is_system ? "System-defined roles are read-only and cannot be modified." : "Toggle permission"}
                                                                            style={{
                                                                                width: '44px', height: '24px', borderRadius: '99px', position: 'relative', flexShrink: 0,
                                                                                backgroundColor: isPermissionEnabled(activeRole.id, perm.id) ? '#2563EB' : '#374151',
                                                                                transition: 'background-color 0.2s',
                                                                                cursor: activeRole.is_system ? 'not-allowed' : 'pointer',
                                                                                opacity: activeRole.is_system ? 0.6 : 1
                                                                            }} onClick={() => !activeRole.is_system && togglePermission(activeRole.id, perm.id)}>
                                                                            <div style={{
                                                                                width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white',
                                                                                position: 'absolute', top: '3px',
                                                                                left: isPermissionEnabled(activeRole.id, perm.id) ? '23px' : '3px',
                                                                                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                            }}>
                                                                                {activeRole.is_system && <Lock size={10} color="#9CA3AF" />}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                                        <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                        <p>Select a role to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'integrations':
                return (
                    <div className="integrations-section">
                        <div className="section-header">
                            <h2>Integrations</h2>
                        </div>
                        <div className="integrations-grid">
                            <div className="integration-card" style={integrations.some(i => i.type === 'smtp' && i.status === 'connected') ? { borderColor: '#10b981' } : {}}>
                                <h3>SMTP Email</h3>
                                <p>Configure email server for notifications</p>
                                <button className="secondary-btn" onClick={() => setIntegrationModal({ isOpen: true, type: 'smtp' })}>
                                    {integrations.some(i => i.type === 'smtp' && i.status === 'connected') ? 'Configured' : 'Configure'}
                                </button>
                            </div>
                            <div className="integration-card" style={integrations.some(i => i.type === 'google workspace' && i.status === 'connected') ? { borderColor: '#10b981' } : {}}>
                                <h3>Google Workspace</h3>
                                <p>Sync with Google Calendar and Contacts</p>
                                <button className="secondary-btn" onClick={() => setIntegrationModal({ isOpen: true, type: 'google workspace' })}>
                                    {integrations.some(i => i.type === 'google workspace' && i.status === 'connected') ? 'Connected' : 'Connect'}
                                </button>
                            </div>
                            <div className="integration-card" style={integrations.some(i => i.type === 'webhooks') ? { borderColor: '#10b981' } : {}}>
                                <h3>Webhooks</h3>
                                <p>Send events to external systems</p>
                                <button className="secondary-btn" onClick={() => setIntegrationModal({ isOpen: true, type: 'webhooks' })}>
                                    {integrations.some(i => i.type === 'webhooks') ? 'Manage (Active)' : 'Manage'}
                                </button>
                            </div>
                            <div className="integration-card">
                                <h3>API Keys</h3>
                                <p>Generate keys for API access</p>
                                <button className="secondary-btn" onClick={() => setIntegrationModal({ isOpen: true, type: 'api keys' })}>Manage</button>
                            </div>
                        </div>

                        {/* Logs Section */}
                        <div style={{ marginTop: '32px', borderTop: '1px solid #374151', paddingTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>Recent Activity</h3>
                                <button onClick={() => fetchData()} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontSize: '12px' }}>Refresh</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #374151', color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '12px 0' }}>Time</th>
                                            <th style={{ padding: '12px 0' }}>Event</th>
                                            <th style={{ padding: '12px 0' }}>Status</th>
                                            <th style={{ padding: '12px 0' }}>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {webhookLogs.length === 0 ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#6B7280', fontSize: '13px' }}>No logs recorded yet.</td></tr>
                                        ) : (
                                            webhookLogs.map((log: any) => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #1F2937', color: '#D1D5DB', fontSize: '13px' }}>
                                                    <td style={{ padding: '12px 0', color: '#6B7280', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{ backgroundColor: '#1F2937', padding: '2px 6px', borderRadius: '4px', border: '1px solid #374151', fontSize: '11px', color: '#E5E7EB' }}>
                                                            {log.event_name}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            color: log.status === 'success' ? '#34D399' : log.status === 'failed' ? '#F87171' : '#FBBF24',
                                                            fontSize: '12px', fontWeight: 500
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                                                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 0', color: '#9CA3AF', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {log.response_status ? `HTTP ${log.response_status}` : ''} {log.response_body ? `- ${log.response_body.slice(0, 50)}` : ''}
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



            case 'health':
                return (
                    <div className="health-section">
                        <div className="section-header">
                            <h2>System Health</h2>
                        </div>
                        {systemHealth && (
                            <div className="health-metrics">
                                <div className="health-card">
                                    <h3>Server Status</h3>
                                    <div className={`status-indicator ${systemHealth.server_status === 'healthy' ? 'healthy' : systemHealth.server_status === 'high_load' ? 'warning' : 'critical'}`}>
                                        {systemHealth.server_status === 'high_load' ? 'High Load' : systemHealth.server_status.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="health-card">
                                    <h3>Database Status</h3>
                                    <div className={`status-indicator ${systemHealth.database_status === 'healthy' ? 'healthy' : systemHealth.database_status === 'disconnected' ? 'critical' : 'warning'}`}>
                                        {systemHealth.database_status === 'disconnected' ? 'Disconnected' : systemHealth.database_status.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">CPU Usage</div>
                                    <div className="metric-value">{systemHealth.cpu_usage?.toFixed(1)}%</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Memory Usage</div>
                                    <div className="metric-value">{systemHealth.memory_usage?.toFixed(1)}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'audit':
                return (
                    <div className="audit-section">
                        <div className="section-header">
                            <h2>Audit Logs</h2>
                        </div>
                        <div className="audit-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Activity Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap', color: '#9CA3AF', fontSize: '13px' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{log.user_name || 'System'}</span>
                                                    {log.user_email && <span style={{ color: '#6B7280', fontSize: '11px' }}>{log.user_email}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`action-badge ${log.action}`} style={{ marginBottom: '4px', display: 'inline-block', fontSize: '10px', padding: '2px 6px' }}>{log.action}</span>
                                                {formatAuditLog(log)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Helper to format audit log details
    const formatAuditLog = (log: AuditLog) => {
        const details = log.details || {};
        const resourceName = log.resource.charAt(0).toUpperCase() + log.resource.slice(1);

        switch (log.resource) {
            case 'user':
                const email = details.email || log.after_data?.email || log.before_data?.email || 'Unknown User';
                if (log.action === 'updated') {
                    // Check what changed if possible, simple implementation for now
                    const changes = [];
                    if (log.before_data && log.after_data) {
                        if (log.before_data.role !== log.after_data.role) changes.push(`Role: ${log.after_data.role}`);
                        if (log.before_data.status !== log.after_data.status) changes.push(`Status: ${log.after_data.status}`);
                    }
                    return (
                        <div className="flex flex-col">
                            <span className="text-gray-300 font-medium">Updated User Profile</span>
                            <span className="text-gray-500 text-xs">Target: {email}</span>
                            {changes.length > 0 && <span className="text-gray-500 text-xs italic mt-0.5">{changes.join(', ')}</span>}
                        </div>
                    );
                }
                if (log.action === 'deleted') {
                    return (
                        <div className="flex flex-col">
                            <span className="text-gray-300 font-medium">Deleted User</span>
                            <span className="text-gray-500 text-xs">Target: {email}</span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <span className="text-gray-300 font-medium">{resourceName} Action</span>
                        <span className="text-gray-500 text-xs">Target: {email}</span>
                    </div>
                );

            default:
                // Generic handling
                return (
                    <div className="flex flex-col">
                        <span className="text-gray-300 font-medium">{resourceName}</span>
                        <span className="text-gray-500 text-xs">
                            {JSON.stringify(details).slice(0, 50) + (JSON.stringify(details).length > 50 ? '...' : '')}
                        </span>
                    </div>
                );
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Admin Console</h1>
                <p className="subtitle">System administration and configuration</p>
            </div>

            {authorized ? (
                <div className="admin-content">
                    {/* Sidebar Navigation */}
                    <div className="admin-sidebar">
                        <div className="sidebar-section">
                            <div className="section-title">USER MANAGEMENT</div>
                            <button
                                className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                Users
                            </button>
                            <button
                                className={`sidebar-item ${activeTab === 'roles' ? 'active' : ''}`}
                                onClick={() => setActiveTab('roles')}
                            >
                                Roles & Permissions
                            </button>
                        </div>

                        <div className="sidebar-section">
                            <div className="section-title">SYSTEM</div>
                            <button
                                className={`sidebar-item ${activeTab === 'integrations' ? 'active' : ''}`}
                                onClick={() => setActiveTab('integrations')}
                            >
                                Integrations
                            </button>
                            <button
                                className={`sidebar-item ${activeTab === 'health' ? 'active' : ''}`}
                                onClick={() => setActiveTab('health')}
                            >
                                System Health
                            </button>
                            <button
                                className={`sidebar-item ${activeTab === 'audit' ? 'active' : ''}`}
                                onClick={() => setActiveTab('audit')}
                            >
                                Audit Logs
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="admin-main">
                        {renderContent()}
                    </div>
                </div>
            ) : (
                <div className="loading-container" style={{ minHeight: '60vh' }}>
                    <div className="spinner"></div>
                    <p>Verifying administrative privileges...</p>
                </div>
            )}
            {/* Modals */}
            <CreateUserModal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                onSave={handleCreateUser}
                roles={allRoles}
            />
            <CreateRoleModal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                onSave={handleCreateRole}
            />
            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                    onSave={handleUpdateUser}
                    onDelete={handleDeleteUser}
                    roles={allRoles}
                />
            )}
            {editingRole && (
                <EditRoleModal
                    isOpen={!!editingRole}
                    role={editingRole}
                    onClose={() => setEditingRole(null)}
                    onSave={handleUpdateRole}
                />
            )}
            {integrationModal.isOpen && (
                <IntegrationModal
                    isOpen={integrationModal.isOpen}
                    onClose={() => setIntegrationModal({ ...integrationModal, isOpen: false })}
                    type={integrationModal.type}
                    onSave={handleConnectIntegration}
                />
            )}
        </div>
    );
}
