'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    link?: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    // Define API URL once
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) return;

            const res = await fetch(`${API_URL}/api/v1/notifications?limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.read && !n.is_read).length); // Handle both fields if inconsistent
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const markAsRead = async (id: string) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        try {
            await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const markAllRead = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        try {
            await fetch(`${API_URL}/api/v1/notifications/mark-all-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#EF4444',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0, // Align right if in top bar
                    left: '100%', // OR Align left if in sidebar
                    marginTop: '8px',
                    marginLeft: '8px',
                    width: '320px',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ fontSize: '0.75rem', color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--color-border)',
                                    background: n.read || (n as any).is_read ? 'transparent' : 'rgba(var(--color-accent-primary-rgb), 0.1)',
                                    opacity: n.read || (n as any).is_read ? 0.6 : 1,
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                    className="notification-item"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{n.title}</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginLeft: '8px', flexShrink: 0 }}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>

                                    {(!n.read && !(n as any).is_read) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                            style={{
                                                marginTop: '8px',
                                                background: 'transparent',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                color: 'var(--color-accent-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Check size={12} /> Mark Read
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
