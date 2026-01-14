import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    AlertTriangle, 
    Ticket, 
    RefreshCcw,
    Filter,
    CheckCircle,
    Clock,
    TrendingUp
} from 'lucide-react';

/**
 * Red Alert Control Panel
 * Grouped by reason:
 * - Iteration breach
 * - SLA breach
 * - Idle tickets
 * Each alert shows:
 * - Root cause
 * - Responsible role
 * - Suggested action
 */
export default function RedAlertControlPanel() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [groupedAlerts, setGroupedAlerts] = useState({});
    const [filters, setFilters] = useState({
        reason: '',
        project_id: '',
        status: 'active' // 'active', 'resolved', 'all'
    });
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const projectsData = await api.projects.list();
                setProjects(projectsData);
            } catch (err) {
                console.error('Failed to load projects:', err);
            }
        };
        loadProjects();
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [filters]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const alertsData = await api.alerts.list({
                ...(filters.reason && { reason: filters.reason }),
                ...(filters.project_id && { project_id: filters.project_id })
            });

            // Enrich alerts with ticket details
            const enrichedAlerts = await Promise.all(
                alertsData.map(async (alert) => {
                    try {
                        const ticket = await api.tickets.get(alert.ticket_id);
                        return {
                            ...alert,
                            ticket,
                            ticket_title: ticket.title,
                            project_name: ticket.project_name,
                            assignee_name: ticket.assignee_name,
                            status: ticket.status,
                            priority: ticket.priority,
                            delivery_datetime: ticket.delivery_datetime
                        };
                    } catch (err) {
                        return alert;
                    }
                })
            );

            setAlerts(enrichedAlerts);

            // Group by reason
            const grouped = enrichedAlerts.reduce((acc, alert) => {
                const reason = alert.reason || 'UNKNOWN';
                if (!acc[reason]) {
                    acc[reason] = [];
                }
                acc[reason].push(alert);
                return acc;
            }, {});

            setGroupedAlerts(grouped);
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (ticketId) => {
        if (!confirm('Mark this alert as resolved?')) return;
        
        try {
            await api.alerts.resolve(ticketId);
            fetchAlerts();
        } catch (err) {
            console.error('Failed to resolve alert:', err);
            alert('Failed to resolve alert');
        }
    };

    const getReasonInfo = (reason) => {
        switch (reason) {
            case 'ITERATION_BREACH':
                return {
                    label: 'Iteration Breach',
                    description: 'Ticket has exceeded 3 iterations',
                    color: '#ef4444',
                    icon: TrendingUp,
                    suggestedAction: 'Review ticket requirements and provide clear feedback',
                    responsibleRole: 'PM'
                };
            case 'SLA_BREACH':
                return {
                    label: 'SLA Breach',
                    description: 'Delivery deadline has passed',
                    color: '#f97316',
                    icon: Clock,
                    suggestedAction: 'Reassess deadline or escalate priority',
                    responsibleRole: 'PM'
                };
            case 'IDLE_TICKET':
                return {
                    label: 'Idle Ticket',
                    description: 'No activity for 48+ hours',
                    color: '#eab308',
                    icon: AlertTriangle,
                    suggestedAction: 'Check with assignee or reassign ticket',
                    responsibleRole: 'PM'
                };
            default:
                return {
                    label: reason?.replace('_', ' ') || 'Unknown',
                    description: 'Alert triggered',
                    color: '#6b7280',
                    icon: AlertTriangle,
                    suggestedAction: 'Review ticket status',
                    responsibleRole: 'PM'
                };
        }
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Red Alert Control Panel</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Monitor and resolve system alerts - grouped by root cause
                    </p>
                </div>
                <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Summary */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            Total Alerts
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                            {alerts.length}
                        </div>
                    </div>
                    {Object.entries(groupedAlerts).map(([reason, reasonAlerts]) => {
                        const info = getReasonInfo(reason);
                        return (
                            <div key={reason}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    {info.label}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: info.color }}>
                                    {reasonAlerts.length}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filters</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Reason
                        </label>
                        <select
                            value={filters.reason}
                            onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Reasons</option>
                            <option value="ITERATION_BREACH">Iteration Breach</option>
                            <option value="SLA_BREACH">SLA Breach</option>
                            <option value="IDLE_TICKET">Idle Ticket</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Project
                        </label>
                        <select
                            value={filters.project_id}
                            onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Grouped Alerts */}
            {loading ? (
                <div>Loading alerts...</div>
            ) : Object.keys(groupedAlerts).length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#10b981' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No active alerts</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {Object.entries(groupedAlerts).map(([reason, reasonAlerts]) => {
                        const info = getReasonInfo(reason);
                        const ReasonIcon = info.icon;

                        return (
                            <div key={reason}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: `${info.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ReasonIcon size={20} color={info.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {info.label} ({reasonAlerts.length})
                                        </h2>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            {info.description}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        Responsible: {info.responsibleRole}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem', padding: '1rem', background: `${info.color}10`, borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        Suggested Action:
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {info.suggestedAction}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {reasonAlerts.map(alert => (
                                        <Card
                                            key={alert.id}
                                            onClick={() => navigate(`/tickets/${alert.ticket_id}`)}
                                            style={{
                                                padding: '1.5rem',
                                                cursor: 'pointer',
                                                border: `2px solid ${info.color}40`,
                                                background: `${info.color}10`,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateX(4px)';
                                                e.currentTarget.style.borderColor = info.color;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateX(0)';
                                                e.currentTarget.style.borderColor = `${info.color}40`;
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                        {alert.ticket_title || `Ticket ${alert.ticket_id}`}
                                                    </h3>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                        <div>
                                                            Project: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
                                                                {alert.project_name || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            Assignee: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
                                                                {alert.assignee_name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            Status: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>
                                                                {alert.status || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            Priority: <span style={{
                                                                color: alert.priority === 'URGENT' ? '#ef4444' :
                                                                      alert.priority === 'HIGH' ? '#f97316' :
                                                                      alert.priority === 'MEDIUM' ? '#eab308' : '#3b82f6',
                                                                fontWeight: 500
                                                            }}>
                                                                {alert.priority || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleResolve(alert.ticket_id);
                                                    }}
                                                    style={{ marginLeft: '1rem' }}
                                                >
                                                    <CheckCircle size={16} />
                                                    Resolve
                                                </Button>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                Triggered: {new Date(alert.triggered_at).toLocaleString()}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
