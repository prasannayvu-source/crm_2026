'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Define Lead Interface
interface Lead {
    id: string;
    parent_name: string;
    status: string;
    updated_at: string;
    students?: {
        grade_applying_for: string;
        name: string;
    }[];
}

// Define Columns State
interface Columns {
    [key: string]: Lead[];
}

const STATUSES = ['new', 'attempted_contact', 'connected', 'visit_scheduled', 'application_submitted', 'enrolled', 'lost'];

const STATUS_LABELS: Record<string, string> = {
    new: 'New Lead',
    attempted_contact: 'Attempted Contact',
    connected: 'Connected',
    visit_scheduled: 'Visit Scheduled',
    application_submitted: 'App Submitted',
    enrolled: 'Enrolled',
    lost: 'Lost'
};

const SLA_HOURS: Record<string, number> = {
    new: 24,
    attempted_contact: 48,
    connected: 72,
    visit_scheduled: 168,
    application_submitted: 72,
    enrolled: 0,
    lost: 0
};

export default function PipelinePage() {
    const [columns, setColumns] = useState<Columns>(() => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('pipeline_columns');
            return cached ? JSON.parse(cached) : {};
        }
        return {};
    });

    // Only show loader if we have NO data in cache
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('pipeline_columns');
        }
        return true;
    });

    const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

    // Initialize counts or reset them
    const resetVisibleCounts = () => {
        const counts: Record<string, number> = {};
        STATUSES.forEach(s => counts[s] = 5); // Show 5 initially
        setVisibleCounts(counts);
    };

    const fetchLeads = async () => {
        // Only trigger full page loader if no cache, else silent update
        if (Object.keys(columns).length === 0) setLoading(true);

        const { data, error } = await supabase
            .from('leads')
            .select('id, parent_name, status, updated_at, students(name, grade_applying_for)')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            // Don't toast error if we have cached data visible, just log it
            if (Object.keys(columns).length === 0) toast.error('Failed to load pipeline');
            setLoading(false);
            return;
        }

        // Group by status
        const newColumns: Columns = {};
        STATUSES.forEach(s => newColumns[s] = []);

        data?.forEach((lead: any) => {
            if (newColumns[lead.status]) {
                newColumns[lead.status].push(lead);
            }
        });

        setColumns(newColumns);
        localStorage.setItem('pipeline_columns', JSON.stringify(newColumns));

        // Only reset counts on initial load or if empty
        if (Object.keys(visibleCounts).length === 0) {
            resetVisibleCounts();
        }
        setLoading(false);
    };

    const handleLoadMore = (status: string) => {
        setVisibleCounts(prev => ({
            ...prev,
            [status]: (prev[status] || 5) + 5
        }));
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        if (source.droppableId === destination.droppableId) {
            // Reordering within the same column (optional: handle visual reorder if needed)
            // For now, no API call or state change for same-column reorder to avoid issues
            return;
        }

        // Optimistic Update: Moving to a DIFFERENT column
        const startColumn = columns[source.droppableId];
        const finishColumn = columns[destination.droppableId];
        const lead = startColumn[source.index];

        const newStartList = Array.from(startColumn);
        newStartList.splice(source.index, 1);

        const newFinishList = Array.from(finishColumn);
        newFinishList.splice(destination.index, 0, { ...lead, status: destination.droppableId });

        const newColumns = {
            ...columns,
            [source.droppableId]: newStartList,
            [destination.droppableId]: newFinishList
        };

        setColumns(newColumns);

        // API Call via Backend to trigger automations (Tasks, Interactions)
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
            const response = await fetch(`${API_URL}/api/v1/leads/${draggableId}/status?status=${destination.droppableId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            toast.success(`Moved to ${STATUS_LABELS[destination.droppableId]}`);

            // If we moved to 'Visit Scheduled', maybe show a toast about the task?
            if (destination.droppableId === 'visit_scheduled') {
                toast.success('Task created: Prepare for Visit', {
                    description: 'Check your tasks list.'
                });
            }

        } catch (error) {
            console.error('Error moving lead:', error);
            toast.error('Failed to move lead');
            fetchLeads(); // Revert UI
        }
    };

    const isOverdue = (lead: Lead) => {
        const sla = SLA_HOURS[lead.status];
        if (!sla) return false;

        const lastUpdate = new Date(lead.updated_at).getTime();
        const now = new Date().getTime();
        const hoursInStage = (now - lastUpdate) / (1000 * 60 * 60);

        return hoursInStage > sla;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Pipeline</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Drag and drop leads to move them through the admissions process.</p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    paddingBottom: '16px',
                    height: '100%',
                    alignItems: 'flex-start'
                }}>
                    {STATUSES.map(statusId => (
                        <div key={statusId} style={{
                            minWidth: '280px',
                            width: '280px',
                            background: 'rgba(15, 17, 23, 0.6)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%'
                        }}>
                            {/* Column Header */}
                            <div style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {STATUS_LABELS[statusId]}
                                </span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                }}>
                                    {columns[statusId]?.length || 0}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={statusId}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{
                                            padding: '8px',
                                            flex: 1,
                                            overflowY: 'auto',
                                            minHeight: '100px',
                                            background: snapshot.isDraggingOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}
                                        className="pipeline-column-scroll"
                                    >
                                        <style jsx global>{`
                                            .pipeline-column-scroll::-webkit-scrollbar {
                                                width: 4px;
                                            }
                                            .pipeline-column-scroll::-webkit-scrollbar-track {
                                                background: rgba(255, 255, 255, 0.02);
                                            }
                                            .pipeline-column-scroll::-webkit-scrollbar-thumb {
                                                background: rgba(255, 255, 255, 0.1);
                                                border-radius: 4px;
                                            }
                                            .pipeline-column-scroll::-webkit-scrollbar-thumb:hover {
                                                background: rgba(255, 255, 255, 0.2);
                                            }
                                        `}</style>

                                        {columns[statusId]?.slice(0, visibleCounts[statusId] || 5).map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="glass-card"
                                                        style={{
                                                            padding: '0', // Remove padding from container to let Link fill it
                                                            background: snapshot.isDragging
                                                                ? 'var(--color-bg-card-hover)'
                                                                : 'var(--color-bg-card)',
                                                            border: '1px solid var(--color-border)',
                                                            ...provided.draggableProps.style,
                                                            opacity: snapshot.isDragging ? 0.9 : 1,
                                                            boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0,0,0,0.3)' : 'none'
                                                        }}
                                                    >
                                                        <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '12px' }}>
                                                            <div style={{ paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{lead.parent_name}</h4>
                                                                {lead.students && lead.students.length > 0 && (
                                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                                        {lead.students[0].name}
                                                                        <br />
                                                                        <span style={{ fontSize: '0.7rem' }}>{lead.students[0].grade_applying_for}</span>
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Footer / Badges */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                                                    <Clock size={12} />
                                                                    <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
                                                                </div>

                                                                {isOverdue(lead) && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                        <AlertCircle size={14} />
                                                                        <span>Stall</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {columns[statusId]?.length > (visibleCounts[statusId] || 5) && (
                                            <button
                                                onClick={() => handleLoadMore(statusId)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--color-accent-primary)',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    border: '1px dashed rgba(59, 130, 246, 0.3)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    marginTop: '4px',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                            >
                                                Show More ({columns[statusId].length - (visibleCounts[statusId] || 5)} remaining)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
