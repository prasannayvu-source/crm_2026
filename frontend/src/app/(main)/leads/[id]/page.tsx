'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ArrowLeft, Phone, Mail, Calendar, Edit, CircleAlert, CheckCircle, Trash2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function LeadDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('new');
    const [tasks, setTasks] = useState<any[]>([]);

    // Status options
    const statuses = ['new', 'attempted_contact', 'connected', 'visit_scheduled', 'application_submitted', 'enrolled', 'lost'];

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');

    // Edit Lead State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ parent_name: '', email: '', phone: '', source: '' });

    // Add Student State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', grade_applying_for: '', dob: '' });

    // Notes State
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    const fetchTasks = async () => {
        if (!id) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('lead_id', id)
            .order('due_date', { ascending: true });
        setTasks(data || []);
    };

    const fetchNotes = async () => {
        if (!id) return;
        const { data } = await supabase
            .from('notes')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });
        setNotes(data || []);
    };

    useEffect(() => {
        if (!id) return;

        const fetchLead = async () => {
            const { data, error } = await supabase
                .from('leads')
                .select('*, students(*)')
                .eq('id', id)
                .single();

            if (data) {
                setLead(data);
                setStatus(data.status);
                // Pre-fill edit form
                setEditForm({
                    parent_name: data.parent_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    source: data.source || ''
                });
            }
            if (error) {
                console.error("Error fetching lead:", error);
            }
            setLoading(false);
        };
        fetchLead();
        fetchTasks();
        fetchNotes();
    }, [id]);

    const handleStatusUpdate = async (newStatus: string) => {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setStatus(newStatus);
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        } else {
            toast.error("Failed to update status");
        }
    };

    const handleUpdateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase
            .from('leads')
            .update(editForm)
            .eq('id', id);

        if (!error) {
            setLead({ ...lead, ...editForm });
            setShowEditModal(false);
            toast.success("Lead updated successfully");
        } else {
            console.error(error);
            toast.error("Failed to update lead");
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('students').insert([{
            lead_id: id,
            ...newStudent
        }]);

        if (!error) {
            setShowStudentModal(false);
            setNewStudent({ name: '', grade_applying_for: '', dob: '' });
            // Refresh lead data to show new student
            const { data } = await supabase.from('leads').select('*, students(*)').eq('id', id).single();
            if (data) setLead(data);
            toast.success("Student added successfully");
        } else {
            console.error(error);
            toast.error("Failed to add student");
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('tasks').insert([{
            lead_id: id,
            title: newTaskTitle,
            due_date: newTaskDate ? new Date(newTaskDate).toISOString() : null,
            status: 'pending',
            assigned_to: (await supabase.auth.getUser()).data.user?.id
        }]);

        if (!error) {
            setShowTaskModal(false);
            setNewTaskTitle('');
            setNewTaskDate('');
            fetchTasks();
            toast.success("Task added");
        } else {
            toast.error("Failed to add task");
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
        fetchTasks();
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;

        const { error } = await supabase.from('notes').insert([{
            lead_id: id,
            content: newNote,
            created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

        if (!error) {
            setNewNote('');
            fetchNotes();
            toast.success("Note saved");
        } else {
            console.error(error);
            toast.error("Failed to save note");
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;
    if (!lead) return <div>Lead not found</div>;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/leads" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lead.parent_name}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Created on {new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                        value={status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        className="glass-input"
                        style={{ width: 'auto', paddingRight: '32px', color: 'white', background: 'rgba(255,255,255,0.1)' }}
                    >
                        {statuses.map(s => (
                            <option key={s} value={s} style={{ color: 'black' }}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        onClick={() => setShowEditModal(true)}
                    >
                        <Edit size={16} /> Edit Lead
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Left Column: Lead Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Contact Card */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={18} /> Contact Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</label>
                                <p style={{ fontSize: '1rem' }}>{lead.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Phone</label>
                                <p style={{ fontSize: '1rem' }}>{lead.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Source</label>
                                <p style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{lead.source}</p>
                            </div>
                        </div>
                    </div>

                    {/* Students Card */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={18} /> Students
                            </h3>
                            <button
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setShowStudentModal(true)}
                            >
                                <Plus size={16} /> Add Student
                            </button>
                        </div>

                        {lead.students && lead.students.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {lead.students.map((student: any) => (
                                    <div key={student.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                        <p style={{ fontWeight: 600 }}>{student.name}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Grade: {student.grade_applying_for}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No students added yet.</p>
                        )}
                    </div>

                </div>

                {/* Right Column: Tasks & Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={18} /> Tasks
                            </h3>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                + Add Task
                            </button>
                        </div>

                        {tasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-secondary)' }}>
                                <p>No tasks yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {tasks.map(task => (
                                    <div key={task.id} style={{
                                        padding: '12px',
                                        background: task.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        opacity: task.status === 'completed' ? 0.6 : 1
                                    }}>
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            disabled={task.status === 'completed'}
                                            style={{
                                                marginTop: '2px',
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '4px',
                                                border: task.status === 'completed' ? 'none' : '2px solid var(--color-text-secondary)',
                                                background: task.status === 'completed' ? 'var(--color-accent-secondary)' : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {task.status === 'completed' && <CheckCircle size={14} color="white" />}
                                        </button>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</p>
                                            {task.due_date && (
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Due: {new Date(task.due_date).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: '24px', opacity: 0.9 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Notes</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                            {notes.length === 0 ? (
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No notes yet.</p>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                                        <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                            {new Date(note.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <textarea
                            className="glass-input"
                            rows={3}
                            placeholder="Add a note..."
                            style={{ resize: 'vertical' }}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        ></textarea>
                        <button
                            className="btn-secondary"
                            style={{ marginTop: '12px', width: '100%' }}
                            onClick={handleSaveNote}
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '24px', background: '#0F1117', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>New Task</h3>
                        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Task Title</label>
                                <input
                                    type="text"
                                    required
                                    className="glass-input"
                                    placeholder="e.g. Follow up call"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Due Date</label>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={newTaskDate}
                                    onChange={e => setNewTaskDate(e.target.value)}
                                    // Make date input readable in dark mode
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Lead Modal */}
            {showEditModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card" style={{ width: '500px', padding: '24px', background: '#0F1117', border: '1px solid var(--color-border)', position: 'relative' }}>
                        <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Edit Lead Details</h3>
                        <form onSubmit={handleUpdateLead} style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Parent Name</label>
                                <input type="text" className="glass-input" value={editForm.parent_name} onChange={e => setEditForm({ ...editForm, parent_name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Email</label>
                                    <input type="email" className="glass-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Phone</label>
                                    <input type="tel" className="glass-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Source</label>
                                <select className="glass-input" value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })}>
                                    <option value="website" style={{ color: 'black' }}>Website</option>
                                    <option value="walk_in" style={{ color: 'black' }}>Walk In</option>
                                    <option value="referral" style={{ color: 'black' }}>Referral</option>
                                    <option value="social" style={{ color: 'black' }}>Social Media</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showStudentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card" style={{ width: '400px', padding: '24px', background: '#0F1117', border: '1px solid var(--color-border)', position: 'relative' }}>
                        <button onClick={() => setShowStudentModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Add Student</h3>
                        <form onSubmit={handleAddStudent} style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Student Name</label>
                                <input type="text" className="glass-input" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Grade Applying For</label>
                                <input type="text" className="glass-input" value={newStudent.grade_applying_for} onChange={e => setNewStudent({ ...newStudent, grade_applying_for: e.target.value })} required placeholder="e.g. Grade 5" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Date of Birth (Optional)</label>
                                <input type="date" className="glass-input" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} style={{ colorScheme: 'dark' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowStudentModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Add Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
