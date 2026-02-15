'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Lock, Shield, Activity, AlertCircle, Check, Trash2, Eye, EyeOff } from 'lucide-react';

// --- Shared Styles (Bypassing potential Tailwind Config Issues) ---
const styles = {
    modalOverlay: {
        zIndex: 9999,
        position: 'fixed' as 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)'
    },
    modalContainer: {
        position: 'relative' as 'relative',
        backgroundColor: '#111827', // Gray 900
        width: '100%',
        maxWidth: '600px', // User requested ~600px
        borderRadius: '12px',
        border: '1px solid #374151', // Gray 700
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column' as 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        margin: '16px'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #1F2937', // Gray 800
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    content: {
        padding: '24px',
        overflowY: 'auto' as 'auto',
        maxHeight: 'calc(90vh - 140px)' // Reserve space for header/footer
    },
    footer: {
        padding: '20px 24px',
        borderTop: '1px solid #1F2937',
        backgroundColor: '#0F1117', // Slightly darker footer
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    label: {
        display: 'block',
        color: '#D1D5DB', // Gray 300
        fontSize: '14px',
        fontWeight: 500,
        marginBottom: '8px'
    },
    inputWrapper: {
        position: 'relative' as 'relative'
    },
    input: {
        width: '100%',
        backgroundColor: '#1F2937', // Gray 800
        border: '1px solid #374151', // Gray 700
        borderRadius: '8px',
        padding: '12px 16px 12px 42px', // Left padding for icon
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        height: '48px', // Increased height
        transition: 'border-color 0.2s'
    },
    select: {
        width: '100%',
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px 16px 12px 42px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        height: '48px',
        cursor: 'pointer',
        appearance: 'none' as 'none'
    },
    helperText: {
        display: 'block',
        marginTop: '6px',
        fontSize: '12px',
        color: '#9CA3AF' // Gray 400
    },
    primaryButton: {
        backgroundColor: '#2563EB', // Blue 600
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        border: '1px solid #4B5563', // Gray 600
        color: '#E5E7EB', // Gray 200
        borderRadius: '8px',
        padding: '10px 24px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    },
    icon: {
        position: 'absolute' as 'absolute',
        left: '14px',
        top: '14px',
        color: '#9CA3AF',
        pointerEvents: 'none' as 'none'
    }
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div
                className="absolute inset-0"
                onClick={onClose}
            />
            <div style={styles.modalContainer}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// User Creation Modal

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    roles?: { id: string; name: string; }[];
}

export function CreateUserModal({ isOpen, onClose, onSave, roles = [] }: CreateUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'counselor',
        status: 'active'
    });
    const [sendInvite, setSendInvite] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
            setFormData({ full_name: '', email: '', password: '', role: 'counselor', status: 'active' });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New User"
            subtitle="Enter user details below to create a new account."
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        style={styles.secondaryButton}
                    >
                        Cancel
                    </button>
                    <button
                        form="create-user-form"
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.primaryButton, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Create User
                    </button>
                </>
            }
        >
            <form id="create-user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Full Name */}
                <div>
                    <label style={styles.label}>Full Name</label>
                    <div style={styles.inputWrapper}>
                        <User style={styles.icon} size={20} />
                        <input
                            required
                            style={styles.input}
                            placeholder="e.g. John Doe"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label style={styles.label}>Email Address</label>
                    <div style={styles.inputWrapper}>
                        <Mail style={styles.icon} size={20} />
                        <input
                            required
                            type="email"
                            style={styles.input}
                            placeholder="e.g. john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <span style={styles.helperText}>We'll send account details to this email.</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Role */}
                    <div>
                        <label style={styles.label}>Role</label>
                        <div style={styles.inputWrapper}>
                            <Shield style={styles.icon} size={20} />
                            <select
                                style={styles.select}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {roles.length > 0 ? (
                                    roles.map(role => (
                                        <option key={role.id} value={role.name.toLowerCase()}>{role.name}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="counselor">Counselor</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label style={styles.label}>Status</label>
                        <div style={styles.inputWrapper}>
                            <Activity style={styles.icon} size={20} />
                            <select
                                style={styles.select}
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid #1F2937' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>Password <span style={{ color: '#6B7280', fontWeight: 400 }}>(Optional)</span></label>
                        <div style={styles.inputWrapper}>
                            <Lock style={styles.icon} size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                style={{ ...styles.input, paddingRight: '40px' }}
                                placeholder="Auto-generate if empty"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <span style={styles.helperText}>Leave blank to auto-generate a secure password.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: sendInvite ? '1px solid #2563EB' : '1px solid #4B5563',
                                backgroundColor: sendInvite ? '#2563EB' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => setSendInvite(!sendInvite)}
                        >
                            {sendInvite && <Check size={14} className="text-white" />}
                        </div>
                        <span style={{ fontSize: '14px', color: '#D1D5DB', cursor: 'pointer' }} onClick={() => setSendInvite(!sendInvite)}>
                            Send email invitation to user
                        </span>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

// User Edit Modal

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSave: (id: string, data: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    roles?: { id: string; name: string; }[];
}

export function EditUserModal({ isOpen, onClose, user, onSave, onDelete, roles = [] }: EditUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: '',
        status: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                role: user.role || 'counselor',
                status: user.status || 'active'
            });
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(user.id, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit User"
            subtitle="Modify user account details."
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    {onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                    onDelete(user.id);
                                    onClose();
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#EF4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        >
                            <Trash2 size={16} />
                            Delete User
                        </button>
                    ) : <div />}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={onClose} style={styles.secondaryButton}>Cancel</button>
                        <button
                            form="edit-user-form"
                            type="submit"
                            disabled={loading}
                            style={{ ...styles.primaryButton, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            }
        >
            <form id="edit-user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={styles.label}>Full Name</label>
                    <div style={styles.inputWrapper}>
                        <User style={styles.icon} size={20} />
                        <input
                            required
                            style={styles.input}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label style={styles.label}>Email Address</label>
                    <div style={styles.inputWrapper}>
                        <Mail style={styles.icon} size={20} />
                        <input
                            required
                            type="email"
                            style={styles.input}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span style={styles.helperText}>Updating email only affects the profile, not login credentials.</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label style={styles.label}>Role</label>
                        <div style={styles.inputWrapper}>
                            <Shield style={styles.icon} size={20} />
                            <select
                                style={styles.select}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {roles.length > 0 ? (
                                    roles.map(role => (
                                        <option key={role.id} value={role.name.toLowerCase()}>{role.name}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="counselor">Counselor</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>Status</label>
                        <div style={styles.inputWrapper}>
                            <Activity style={styles.icon} size={20} />
                            <select
                                style={styles.select}
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

// Role Creation Modal
interface CreateRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export function CreateRoleModal({ isOpen, onClose, onSave }: CreateRoleModalProps) {
    const [loading, setLoading] = useState(false);
    const [roleName, setRoleName] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ name: roleName, description: desc, permissions: {} });
            onClose();
            setRoleName('');
            setDesc('');
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    return (
        <Modal
            isOpen={isOpen} onClose={onClose} title="Create Custom Role" subtitle="Define a new role."
            footer={
                <>
                    <button type="button" onClick={onClose} style={styles.secondaryButton}>Cancel</button>
                    <button form="create-role-form" type="submit" style={styles.primaryButton}>Create Role</button>
                </>
            }
        >
            <form id="create-role-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={styles.label}>Role Name</label>
                    <input required style={{ ...styles.input, paddingLeft: '16px' }} value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. SuperAdmin" />
                </div>
                <div>
                    <label style={styles.label}>Description</label>
                    <textarea style={{ ...styles.input, height: '100px', paddingLeft: '16px', resize: 'none' }} value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
            </form>
        </Modal>
    );
}

// Role Edit Modal
interface EditRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: any;
    onSave: (id: string, data: any) => Promise<void>;
}

export function EditRoleModal({ isOpen, onClose, role, onSave }: EditRoleModalProps) {
    const [loading, setLoading] = useState(false);
    const [roleName, setRoleName] = useState('');
    const [desc, setDesc] = useState('');

    useEffect(() => {
        if (isOpen && role) {
            setRoleName(role.name);
            setDesc(role.description);
        }
    }, [isOpen, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(role.id, { name: roleName, description: desc });
            onClose();
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    return (
        <Modal
            isOpen={isOpen} onClose={onClose} title="Edit Custom Role" subtitle="Update role details."
            footer={
                <>
                    <button type="button" onClick={onClose} style={styles.secondaryButton}>Cancel</button>
                    <button form="edit-role-form" type="submit" style={styles.primaryButton}>Save Changes</button>
                </>
            }
        >
            <form id="edit-role-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={styles.label}>Role Name</label>
                    <input required style={{ ...styles.input, paddingLeft: '16px' }} value={roleName} onChange={(e) => setRoleName(e.target.value)} />
                </div>
                <div>
                    <label style={styles.label}>Description</label>
                    <textarea style={{ ...styles.input, height: '100px', paddingLeft: '16px', resize: 'none' }} value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
            </form>
        </Modal>
    );
}

// Integration Modal
interface IntegrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    onSave: (data: any) => Promise<void>;
}

export function IntegrationModal({ isOpen, onClose, type, onSave }: IntegrationModalProps) {
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const isWebhook = type === 'webhooks';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ type, config: { api_key: apiKey, endpoint } });
            onClose();
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Configure ${type}`} footer={<><button onClick={onClose} style={styles.secondaryButton}>Cancel</button><button form="int-form" type="submit" style={{ ...styles.primaryButton, backgroundColor: '#059669' }}>Save</button></>}>
            <form id="int-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={styles.label}>{isWebhook ? 'Secret Key' : 'API Key'}</label>
                    <input required type="password" style={{ ...styles.input, paddingLeft: '16px' }} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                </div>
                {isWebhook && <div><label style={styles.label}>Endpoint URL</label><input required type="url" style={{ ...styles.input, paddingLeft: '16px' }} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} /></div>}
            </form>
        </Modal>
    );
}
