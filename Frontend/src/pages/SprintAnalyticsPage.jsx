import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { 
    Calendar, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    TrendingDown,
    RefreshCcw,
    Lock,
    Target
} from 'lucide-react';

/**
 * Sprint Analytics (NON-OPERATIONAL)
 * Strictly read-only
 * Shows:
 * - Committed vs delivered
 * - Avg resolution time
 * - Delay heatmap
 * Sprint NEVER changes ticket state.
 */
export default function SprintAnalyticsPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [sprint, setSprint] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState(id || '');

    useEffect(() => {
        const loadSprints = async () => {
            try {
                const sprintsData = await api.meta.sprints.list();
                setSprints(sprintsData);
                if (!selectedSprintId && sprintsData.length > 0) {
                    setSelectedSprintId(sprintsData[0].id);
                }
            } catch (err) {
                console.error('Failed to load sprints:', err);
            }
        };
        loadSprints();
    }, []);

    useEffect(() => {
        if (selectedSprintId) {
            fetchSprintAnalytics();
        }
    }, [selectedSprintId]);

    const fetchSprintAnalytics = async () => {
        setLoading(true);
        try {
            const [sprintData, analyticsData, ticketsData] = await Promise.all([
                api.meta.sprints.get(selectedSprintId),
                api.analytics.sprint(selectedSprintId),
                api.tickets.list({ sprint_id: selectedSprintId })
            ]);

            setSprint(sprintData);
            setAnalytics(analyticsData);

            // Calculate additional metrics
            const committedTickets = ticketsData.length;
            const deliveredTickets = ticketsData.filter(t => 
                ['DELIVERED', 'CLOSED'].includes(t.status)
            ).length;

            // Calculate resolution times
            const completedTickets = ticketsData.filter(t => 
                ['DELIVERED', 'CLOSED'].includes(t.status) && t.created_at && t.updated_at
            );
            const resolutionTimes = completedTickets.map(t => {
                const created = new Date(t.created_at);
                const completed = new Date(t.updated_at);
                return (completed - created) / (1000 * 60 * 60); // hours
            });
            const avgResolutionTime = resolutionTimes.length > 0
                ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
                : 0;

            // Delay heatmap (tickets by day with delays)
            const delayHeatmap = calculateDelayHeatmap(ticketsData, sprintData);

            setAnalytics({
                ...analyticsData,
                committed: committedTickets,
                delivered: deliveredTickets,
                avgResolutionTime: avgResolutionTime.toFixed(1),
                delayHeatmap
            });
        } catch (err) {
            console.error('Failed to fetch sprint analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDelayHeatmap = (tickets, sprint) => {
        if (!sprint) return [];
        
        const startDate = new Date(sprint.start_date);
        const endDate = new Date(sprint.end_date);
        const days = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayTickets = tickets.filter(t => {
                if (!t.delivery_datetime) return false;
                const deliveryDate = new Date(t.delivery_datetime);
                return deliveryDate.toDateString() === d.toDateString();
            });
            
            const onTime = dayTickets.filter(t => {
                const deliveryDate = new Date(t.delivery_datetime);
                const completedDate = t.updated_at ? new Date(t.updated_at) : new Date();
                return completedDate <= deliveryDate && ['DELIVERED', 'CLOSED'].includes(t.status);
            }).length;
            
            const delayed = dayTickets.filter(t => {
                const deliveryDate = new Date(t.delivery_datetime);
                const completedDate = t.updated_at ? new Date(t.updated_at) : new Date();
                return completedDate > deliveryDate && ['DELIVERED', 'CLOSED'].includes(t.status);
            }).length;

            days.push({
                date: new Date(d),
                onTime,
                delayed,
                total: dayTickets.length
            });
        }
        
        return days;
    };

    if (loading && !analytics) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading sprint analytics...</div>;
    }

    if (!sprint || !analytics) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>No sprint selected or sprint not found</p>
            </div>
        );
    }

    const completionRate = analytics.committed > 0 
        ? (analytics.delivered / analytics.committed) * 100 
        : 0;

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sprint Analytics</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Read-only sprint performance metrics</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        <Lock size={16} />
                        Read-Only
                    </div>
                    <select
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        {sprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={fetchSprintAnalytics} disabled={loading}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Sprint Info */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Calendar size={24} color="#3b82f6" />
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{sprint.name}</h2>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={14} />
                        Sprint does not control ticket state
                    </div>
                </div>
            </Card>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Committed vs Delivered */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Target size={20} color="#3b82f6" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Commitment</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {analytics.delivered} / {analytics.committed}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Delivered / Committed
                    </div>
                    <div style={{ 
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: completionRate >= 80 ? '#10b981' : completionRate >= 60 ? '#eab308' : '#ef4444'
                    }}>
                        {completionRate.toFixed(1)}% Completion Rate
                    </div>
                </Card>

                {/* Avg Resolution Time */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Clock size={20} color="#3b82f6" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Avg Resolution Time</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {analytics.avgResolutionTime || '0'}h
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Average time to complete tickets
                    </div>
                </Card>

                {/* Velocity */}
                {analytics.velocity && (
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            {analytics.velocity.on_track ? (
                                <TrendingUp size={20} color="#10b981" />
                            ) : (
                                <TrendingDown size={20} color="#ef4444" />
                            )}
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Velocity</h3>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {analytics.velocity.tickets_per_day || '0'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Tickets per day
                        </div>
                        <div style={{ 
                            marginTop: '0.75rem',
                            fontSize: '0.75rem',
                            color: analytics.velocity.on_track ? '#10b981' : '#ef4444',
                            fontWeight: 600
                        }}>
                            {analytics.velocity.on_track ? 'On Track' : 'Behind Schedule'}
                        </div>
                    </Card>
                )}
            </div>

            {/* Delay Heatmap */}
            {analytics.delayHeatmap && analytics.delayHeatmap.length > 0 && (
                <Card style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Delay Heatmap</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
                        {analytics.delayHeatmap.map((day, i) => {
                            const delayRatio = day.total > 0 ? day.delayed / day.total : 0;
                            const intensity = Math.min(delayRatio * 100, 100);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        padding: '0.75rem',
                                        background: delayRatio > 0.5 
                                            ? `rgba(239, 68, 68, ${0.2 + intensity / 200})`
                                            : delayRatio > 0
                                            ? `rgba(249, 115, 22, ${0.1 + intensity / 300})`
                                            : 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        textAlign: 'center',
                                        border: delayRatio > 0.5 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--color-border)'
                                    }}
                                    title={`${day.date.toLocaleDateString()}: ${day.onTime} on-time, ${day.delayed} delayed`}
                                >
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {day.date.getDate()}
                                    </div>
                                    <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                                        {day.total} tickets
                                    </div>
                                    {day.delayed > 0 && (
                                        <div style={{ fontSize: '0.625rem', color: '#ef4444', fontWeight: 600, marginTop: '0.25rem' }}>
                                            {day.delayed} delayed
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '16px', height: '16px', background: 'rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)' }} />
                            On Time
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '16px', height: '16px', background: 'rgba(249, 115, 22, 0.3)', borderRadius: 'var(--radius-sm)' }} />
                            Some Delays
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '16px', height: '16px', background: 'rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)' }} />
                            High Delays
                        </div>
                    </div>
                </Card>
            )}

            {/* Timeline Chart */}
            {analytics.timeline && (
                <Card style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Completion Timeline</h3>
                    <div style={{ position: 'relative', height: '200px', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '100%', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                            {analytics.timeline.map((point, i) => {
                                const maxValue = Math.max(...analytics.timeline.map(p => p.cumulative_completed));
                                const height = maxValue > 0 ? (point.cumulative_completed / maxValue) * 100 : 0;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: 'var(--color-primary)',
                                            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                            minHeight: point.tickets_completed > 0 ? '4px' : '0'
                                        }} />
                                        <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <div>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%', marginRight: '0.4rem' }}></span>
                            Cumulative Completed
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
