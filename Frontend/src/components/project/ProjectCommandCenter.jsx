import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
    Ticket, 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    Calendar,
    Target
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * Project Command Center - Overview Tab
 * Shows health indicators:
 * - Tickets committed vs delivered
 * - On-time %
 * - Red alerts
 * - Sprint alignment
 */
export default function ProjectCommandCenter({ project }) {
    const [loading, setLoading] = useState(true);
    const [healthMetrics, setHealthMetrics] = useState({
        totalTickets: 0,
        committedTickets: 0,
        deliveredTickets: 0,
        onTimePercentage: 0,
        redAlertsCount: 0,
        sprintAlignment: null
    });
    const [tickets, setTickets] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sprint, setSprint] = useState(null);

    useEffect(() => {
        fetchHealthMetrics();
    }, [project.id]);

    const fetchHealthMetrics = async () => {
        setLoading(true);
        try {
            const [ticketsData, alertsData, sprintData] = await Promise.all([
                api.tickets.list({ project_id: project.id }),
                api.projects.alerts(project.id),
                api.meta.sprints.list().then(sprints => 
                    sprints.find(s => {
                        const now = new Date();
                        const start = new Date(s.start_date);
                        const end = new Date(s.end_date);
                        return now >= start && now <= end;
                    })
                )
            ]);

            setTickets(ticketsData);
            setAlerts(alertsData);
            setSprint(sprintData);

            // Calculate metrics
            const totalTickets = ticketsData.length;
            const committedTickets = ticketsData.filter(t => 
                ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DELIVERED'].includes(t.status)
            ).length;
            const deliveredTickets = ticketsData.filter(t => 
                ['DELIVERED', 'CLOSED'].includes(t.status)
            ).length;

            // Calculate on-time percentage
            const deliveredWithDeadline = ticketsData.filter(t => 
                ['DELIVERED', 'CLOSED'].includes(t.status) && t.delivery_datetime
            );
            const onTime = deliveredWithDeadline.filter(t => {
                const deliveryDate = new Date(t.delivery_datetime);
                const completedDate = t.updated_at ? new Date(t.updated_at) : new Date();
                return completedDate <= deliveryDate;
            }).length;
            const onTimePercentage = deliveredWithDeadline.length > 0 
                ? (onTime / deliveredWithDeadline.length) * 100 
                : 0;

            // Sprint alignment (tickets in current sprint)
            const sprintTickets = sprintData 
                ? ticketsData.filter(t => t.sprint_id === sprintData.id).length
                : 0;
            const sprintAlignment = sprintData 
                ? (sprintTickets / totalTickets) * 100 
                : null;

            setHealthMetrics({
                totalTickets,
                committedTickets,
                deliveredTickets,
                onTimePercentage: onTimePercentage.toFixed(1),
                redAlertsCount: alertsData.length,
                sprintAlignment: sprintAlignment ? sprintAlignment.toFixed(1) : null
            });
        } catch (err) {
            console.error('Failed to fetch health metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Card style={{ padding: '2rem' }}>Loading health metrics...</Card>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Health Indicators Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {/* Tickets Committed vs Delivered */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Target size={20} color="#3b82f6" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Commitment</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {healthMetrics.deliveredTickets} / {healthMetrics.committedTickets}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Delivered / Committed
                    </div>
                    <div style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Total: {healthMetrics.totalTickets} tickets
                    </div>
                </Card>

                {/* On-Time Percentage */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Clock size={20} color={healthMetrics.onTimePercentage >= 80 ? '#10b981' : healthMetrics.onTimePercentage >= 60 ? '#eab308' : '#ef4444'} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>On-Time Delivery</h3>
                    </div>
                    <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        marginBottom: '0.5rem',
                        color: healthMetrics.onTimePercentage >= 80 ? '#10b981' : healthMetrics.onTimePercentage >= 60 ? '#eab308' : '#ef4444'
                    }}>
                        {healthMetrics.onTimePercentage}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Tickets delivered on time
                    </div>
                </Card>

                {/* Red Alerts */}
                <Card style={{ 
                    padding: '1.5rem',
                    border: healthMetrics.redAlertsCount > 0 ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--color-border)',
                    background: healthMetrics.redAlertsCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-card)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={20} color={healthMetrics.redAlertsCount > 0 ? '#ef4444' : '#6b7280'} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Red Alerts</h3>
                    </div>
                    <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        marginBottom: '0.5rem',
                        color: healthMetrics.redAlertsCount > 0 ? '#ef4444' : '#6b7280'
                    }}>
                        {healthMetrics.redAlertsCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Active alerts
                    </div>
                </Card>

                {/* Sprint Alignment */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Calendar size={20} color="#3b82f6" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sprint Alignment</h3>
                    </div>
                    {sprint ? (
                        <>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                {healthMetrics.sprintAlignment}%
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                {sprint.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                                No Active Sprint
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                No sprint currently active
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* Status Distribution */}
            <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Ticket Status Distribution</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DELIVERED', 'CLOSED'].map(status => {
                        const count = tickets.filter(t => t.status === status).length;
                        const percentage = healthMetrics.totalTickets > 0 
                            ? (count / healthMetrics.totalTickets) * 100 
                            : 0;
                        return (
                            <div key={status} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    {count}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    {status.replace('_', ' ')}
                                </div>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 500
                                }}>
                                    {percentage.toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Red Alerts List */}
            {healthMetrics.redAlertsCount > 0 && (
                <Card style={{ 
                    padding: '1.5rem',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ef4444' }}>
                            Active Red Alerts ({healthMetrics.redAlertsCount})
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {alerts.slice(0, 5).map(alert => (
                            <div 
                                key={alert.id}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--color-bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {alert.ticket_title || `Ticket ${alert.ticket_id}`}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {alert.reason}
                                </div>
                            </div>
                        ))}
                        {alerts.length > 5 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                                +{alerts.length - 5} more alerts
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
