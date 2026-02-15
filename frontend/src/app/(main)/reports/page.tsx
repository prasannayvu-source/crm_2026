'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './reports.css';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            console.log('Reports: Starting to fetch templates...');
            const startTime = performance.now();

            // Get Supabase session token
            const sessionResponse = await supabase.auth.getSession();
            console.log('Reports: Got session response in', (performance.now() - startTime).toFixed(0), 'ms');

            // Better null checking
            if (!sessionResponse || !sessionResponse.data || !sessionResponse.data.session) {
                console.log('Reports: No session found, redirecting to login');
                router.push('/login');
                return;
            }

            const session = sessionResponse.data.session;
            const token = session.access_token;
            const fetchStart = performance.now();

            const response = await fetch('http://127.0.0.1:8000/api/v1/reports/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Reports: API response in', (performance.now() - fetchStart).toFixed(0), 'ms, status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Reports: Got', data?.length || 0, 'templates');
                setTemplates(data || []);
            } else {
                if (response.status === 401) {
                    console.log('Reports: Session expired (401), redirecting to login');
                    await supabase.auth.signOut();
                    router.push('/login');
                    return;
                }
                const errorText = await response.text();
                console.error('Reports: API error', response.status, errorText);
                setTemplates([]);
            }

            console.log('Reports: Total time:', (performance.now() - startTime).toFixed(0), 'ms');
        } catch (error) {
            console.error('Reports: Error fetching templates:', error);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: string) => {
        if (!selectedTemplate) {
            alert('Please select a report template first');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const token = session.access_token;

            // Use 127.0.0.1 to avoid network delays
            const response = await fetch('http://127.0.0.1:8000/api/v1/reports/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    report_id: selectedTemplate,
                    format: format
                })
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    alert(`Report exported successfully! Download URL: ${data.download_url}`);
                } else {
                    // It's a file blob (for CSV)
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
            } else {
                let errorMessage = 'Export failed. Please try again.';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMessage = `Export failed: ${errorData.detail}`;
                } catch (e) {
                    // Ignore JSON parse error, use default message
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('An error occurred during export.');
        }
    };

    if (loading) {
        return (
            <div className="reports-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h1>Reports Center</h1>
                <p className="subtitle">Build, schedule, and export custom reports</p>
            </div>

            <div className="reports-content">
                {/* Sidebar - Report Templates */}
                <div className="reports-sidebar">
                    <h3>Report Templates</h3>
                    <div className="templates-list">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className={`template-item ${selectedTemplate === template.id ? 'selected' : ''}`}
                                onClick={() => setSelectedTemplate(template.id)}
                            >
                                <div className="template-name">{template.name}</div>
                                <div className="template-description">{template.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="reports-main">
                    {selectedTemplate ? (
                        <div className="report-builder">
                            <h2>Report Builder</h2>
                            <p className="builder-subtitle">Selected: {templates.find(t => t.id === selectedTemplate)?.name}</p>

                            <div className="export-section">
                                <h3>Export Report</h3>
                                <div className="export-buttons">
                                    <button onClick={() => handleExport('csv')} className="export-btn">
                                        Export as CSV
                                    </button>
                                    <button onClick={() => handleExport('xlsx')} className="export-btn">
                                        Export as Excel
                                    </button>
                                    <button onClick={() => handleExport('pdf')} className="export-btn">
                                        Export as PDF
                                    </button>
                                </div>
                            </div>

                            <div className="schedule-section">
                                <h3>Schedule Report</h3>
                                <p className="coming-soon">Scheduling feature coming soon...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h2>Select a Report Template</h2>
                            <p>Choose a template from the sidebar to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
