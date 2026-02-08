'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NewLeadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        parent_name: '',
        email: '',
        phone: '',
        status: 'new',
        source: 'walk_in'
    });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);
        };
        fetchUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!user) return;

        console.log("Creating lead with:", {
            parent_name: formData.parent_name,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            source: formData.source,
            created_by: user.id,
            assigned_to: user.id
        });

        const { data, error } = await supabase.from('leads').insert([{
            parent_name: formData.parent_name,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            source: formData.source,
            created_by: user.id,
            assigned_to: user.id
        }]).select();

        if (error) {
            console.error(error);
            alert('Error creating lead: ' + error.message);
            setLoading(false);
        } else {
            console.log("Success:", data);
            router.push('/leads');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '24px', textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Leads
            </Link>

            <div className="glass-card" style={{ padding: '32px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Add New Lead</h1>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Parent Name *</label>
                        <input
                            type="text"
                            required
                            className="glass-input"
                            value={formData.parent_name}
                            onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Email</label>
                            <input
                                type="email"
                                className="glass-input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Phone</label>
                            <input
                                type="tel"
                                className="glass-input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Source</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="glass-input"
                                value={formData.source}
                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                                style={{ appearance: 'none' }}
                            >
                                <option value="website" style={{ color: 'black' }}>Website</option>
                                <option value="walk_in" style={{ color: 'black' }}>Walk In</option>
                                <option value="referral" style={{ color: 'black' }}>Referral</option>
                                <option value="social" style={{ color: 'black' }}>Social Media</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading || !user} style={{ justifyContent: 'center', marginTop: '8px' }}>
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Lead'}
                    </button>
                </form>
            </div>
        </div>
    );
}
