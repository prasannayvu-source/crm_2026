'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './analytics.css';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

interface KPIMetrics {
    total_leads: number;
    total_enrollments: number;
    conversion_rate: number;
    active_pipeline: number;
    avg_time_to_convert: number | null;
    trend_vs_last_period: { [key: string]: number };
}

interface LeadVolumeData {
    date: string;
    count: number;
}

interface FunnelStageData {
    stage: string;
    count: number;
    percentage: number;
    drop_off_rate: number | null;
}

interface ConversionBySource {
    source: string;
    total_leads: number;
    enrolled: number;
    conversion_rate: number;
}

interface CounselorPerformance {
    counselor_id: string;
    counselor_name: string;
    total_leads: number;
    interactions_count: number;
    enrollments: number;
    conversion_rate: number;
}

interface AlertItem {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    link: string | null;
    created_at: string;
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KPIMetrics | null>(null);
    const [leadVolume, setLeadVolume] = useState<LeadVolumeData[]>([]);
    const [funnel, setFunnel] = useState<FunnelStageData[]>([]);
    const [conversionBySource, setConversionBySource] = useState<ConversionBySource[]>([]);
    const [counselorPerformance, setCounselorPerformance] = useState<CounselorPerformance[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    // Filters
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [selectedSource, setSelectedSource] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchAnalyticsData();
    }, [dateFrom, dateTo, selectedSource, selectedStatus]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            // Get Supabase session token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log('No session found, redirecting to login');
                router.push('/login');
                return;
            }

            const token = session.access_token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Build query params
            const params = new URLSearchParams();
            if (dateFrom) {
                const start = new Date(dateFrom);
                start.setHours(0, 0, 0, 0);
                params.append('date_from', start.toISOString());
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                params.append('date_to', end.toISOString());
            }
            if (selectedSource) params.append('source', selectedSource);
            if (selectedStatus) params.append('status', selectedStatus);

            const queryString = params.toString();

            console.log('🚀 Analytics: Starting fetch...');
            const overallStart = performance.now();

            // 🚀 ULTRA-FAST: Fetch ALL data in a single API call!
            const fetchStart = performance.now();
            const response = await fetch(`http://127.0.0.1:8000/api/v1/analytics/dashboard?${queryString}`, { headers });

            const fetchTime = performance.now() - fetchStart;
            console.log(`⚡ Dashboard API call completed in ${fetchTime.toFixed(0)}ms`);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Dashboard data received:', data);

                // Set all state from the single response
                setKpis(data.kpis);
                setLeadVolume(data.lead_volume);
                setFunnel(data.funnel);
                setConversionBySource(data.conversion_by_source);
                setCounselorPerformance(data.counselor_performance);
                setAlerts(data.alerts);
            } else {
                if (response.status === 401) {
                    console.log('Analytics: Session expired (401), redirecting to login');
                    await supabase.auth.signOut();
                    router.push('/login');
                    return;
                }
                const errorText = await response.text();
                console.error('❌ Dashboard error:', response.status, errorText);
            }

            const totalTime = performance.now() - overallStart;
            console.log(`🎯 TOTAL Analytics load time: ${totalTime.toFixed(0)}ms`);

        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Alert removed - check console for details
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setDateFrom(null);
        setDateTo(null);
        setSelectedSource('');
        setSelectedStatus('');
    };

    const handleDatePreset = (preset: string) => {
        const today = new Date();

        switch (preset) {
            case 'all':
                setDateFrom(null);
                setDateTo(null);
                break;
            case 'today':
                setDateFrom(today);
                setDateTo(today);
                break;
            case 'last7':
                const last7 = new Date(today);
                last7.setDate(today.getDate() - 7);
                setDateFrom(last7);
                setDateTo(today);
                break;
            case 'last30':
                const last30 = new Date(today);
                last30.setDate(today.getDate() - 30);
                setDateFrom(last30);
                setDateTo(today);
                break;
            case 'thisMonth':
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateFrom(firstDay);
                setDateTo(today);
                break;
            case 'lastMonth':
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                setDateFrom(lastMonthStart);
                setDateTo(lastMonthEnd);
                break;
        }
    };

    const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) {
        return (
            <div className="analytics-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            {/* Header */}
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <p className="subtitle">Real-time insights and performance metrics</p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                {/* Date Range Presets */}
                <div className="filter-group date-presets">
                    <label>Date Range</label>
                    <div className="preset-buttons">
                        <button
                            className={`preset-btn ${!dateFrom && !dateTo ? 'active' : ''}`}
                            onClick={() => handleDatePreset('all')}
                        >
                            All Time
                        </button>
                        <button
                            className="preset-btn"
                            onClick={() => handleDatePreset('today')}
                        >
                            Today
                        </button>
                        <button
                            className="preset-btn"
                            onClick={() => handleDatePreset('last7')}
                        >
                            Last 7 Days
                        </button>
                        <button
                            className="preset-btn"
                            onClick={() => handleDatePreset('last30')}
                        >
                            Last 30 Days
                        </button>
                        <button
                            className="preset-btn"
                            onClick={() => handleDatePreset('thisMonth')}
                        >
                            This Month
                        </button>
                        <button
                            className="preset-btn"
                            onClick={() => handleDatePreset('lastMonth')}
                        >
                            Last Month
                        </button>
                    </div>
                </div>

                {/* Custom Date Range */}
                <div className="filter-group custom-date-group">
                    <label>Custom Range</label>
                    <div className="date-range-inputs">
                        <div className="date-input-wrapper">
                            <DatePicker
                                selected={dateFrom}
                                onChange={(date: Date | null) => setDateFrom(date)}
                                selectsStart
                                startDate={dateFrom}
                                endDate={dateTo}
                                maxDate={dateTo || undefined}
                                placeholderText="From Date"
                                dateFormat="dd-MM-yyyy"
                                className="filter-input date-input"
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                            />
                        </div>
                        <span className="date-separator">to</span>
                        <div className="date-input-wrapper">
                            <DatePicker
                                selected={dateTo}
                                onChange={(date: Date | null) => setDateTo(date)}
                                selectsEnd
                                startDate={dateFrom}
                                endDate={dateTo}
                                minDate={dateFrom || undefined}
                                placeholderText="To Date"
                                dateFormat="dd-MM-yyyy"
                                className="filter-input date-input"
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                            />
                        </div>
                    </div>
                </div>

                {/* Source Filter */}
                <div className="filter-group">
                    <label>Source</label>
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Sources</option>
                        <option value="website">Website</option>
                        <option value="walk_in">Walk-in</option>
                        <option value="referral">Referral</option>
                        <option value="social">Social Media</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="attempted_contact">Attempted Contact</option>
                        <option value="connected">Connected</option>
                        <option value="visit_scheduled">Visit Scheduled</option>
                        <option value="application_submitted">Application Submitted</option>
                        <option value="enrolled">Enrolled</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>

                {/* Clear Filters */}
                {(dateFrom || dateTo || selectedSource || selectedStatus) && (
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear All Filters
                    </button>
                )}
            </div>

            {/* KPI Cards Row */}
            <div className="kpi-row">
                <div className="kpi-card">
                    <div className="kpi-value">{kpis?.total_leads || 0}</div>
                    <div className="kpi-label">TOTAL LEADS</div>
                    {kpis?.trend_vs_last_period?.total_leads !== undefined && (
                        <div className={`kpi-trend ${kpis.trend_vs_last_period.total_leads >= 0 ? 'positive' : 'negative'}`}>
                            {kpis.trend_vs_last_period.total_leads >= 0 ? '↑' : '↓'} {Math.abs(kpis.trend_vs_last_period.total_leads).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis?.total_enrollments || 0}</div>
                    <div className="kpi-label">ENROLLMENTS</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis?.conversion_rate || 0}%</div>
                    <div className="kpi-label">CONVERSION RATE</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{kpis?.active_pipeline || 0}</div>
                    <div className="kpi-label">ACTIVE PIPELINE</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="analytics-content">
                {/* Left Column - Charts */}
                <div className="charts-column">
                    {/* Lead Volume Chart */}
                    <div className="chart-card">
                        <h3>Lead Volume Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={leadVolume} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                                <Tooltip
                                    cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366F1"
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    name="Leads"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pipeline Funnel */}
                    <div className="chart-card">
                        <h3>Pipeline Funnel</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <FunnelChart>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                    formatter={(value: any, name: any, props: any) => [`${value} Leads`, props.payload.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())]}
                                />
                                <Funnel
                                    dataKey="count"
                                    data={funnel}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#fff" stroke="none" dataKey="stage" formatter={(val: string) => val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                                    <LabelList position="center" fill="#000" stroke="none" dataKey="count" />
                                    {
                                        funnel.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Conversion by Source */}
                    <div className="chart-card">
                        <h3>{conversionBySource.some(i => i.conversion_rate > 0) ? "Conversion by Source" : "Leads by Source"}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={conversionBySource.map(item => ({
                                    ...item,
                                    not_enrolled: item.total_leads - item.enrolled
                                }))}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 30, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" stroke="#9CA3AF" />
                                <YAxis
                                    dataKey="source"
                                    type="category"
                                    stroke="#9CA3AF"
                                    tickFormatter={(value) => value.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                    }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Legend />
                                <Bar dataKey="enrolled" stackId="a" fill="#10B981" name="Enrolled" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="not_enrolled" stackId="a" fill="#374151" name="Not Enrolled" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Counselor Performance Table */}
                    <div className="chart-card">
                        <h3>Counselor Performance</h3>
                        <div className="performance-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Counselor</th>
                                        <th>Leads</th>
                                        <th>Interactions</th>
                                        <th>Enrollments</th>
                                        <th>Conversion %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {counselorPerformance.map((counselor) => (
                                        <tr key={counselor.counselor_id}>
                                            <td>{counselor.counselor_name}</td>
                                            <td>{counselor.total_leads}</td>
                                            <td>{counselor.interactions_count}</td>
                                            <td>{counselor.enrollments}</td>
                                            <td className="conversion-cell">{counselor.conversion_rate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column - Alerts Rail */}
                <div className="alerts-rail">
                    <h3>Alerts & Notifications</h3>
                    {alerts.length === 0 ? (
                        <p className="no-alerts">No alerts at this time</p>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map((alert) => (
                                <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                                    <div className="alert-header">
                                        <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                                        <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                                    </div>
                                    <div className="alert-title">{alert.title}</div>
                                    <div className="alert-description">{alert.description}</div>
                                    {alert.link && (
                                        <button
                                            onClick={() => router.push(alert.link!)}
                                            className="alert-link-btn"
                                        >
                                            View Details →
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
