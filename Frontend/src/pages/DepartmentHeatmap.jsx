import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    Building2, 
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    RefreshCcw,
    Filter
} from 'lucide-react';

/**
 * Department Heatmap View
 * Purpose: Systemic issue detection
 * Shows (per dept / sub-dept):
 * - Avg iterations
 * - SLA breach %
 * - Red alerts
 * - FTR %
 * This is how PMO fixes process, not people.
 */
export default function DepartmentHeatmap() {
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        fetchHeatmapData();
    }, []);

    const fetchHeatmapData = async () => {
        setLoading(true);
        try {
            // Get departments
            const deptsData = await api.meta.departments();
            setDepartments(deptsData);

            // Get all tickets and analytics
            const [ticketsData, alertsData, analyticsData] = await Promise.all([
                api.tickets.list(),
                api.alerts.list(),
                api.analytics.overview()
            ]);

            // Calculate metrics per department
            const heatmap = deptsData.map(dept => {
                // Get tickets for this department
                const deptTickets = ticketsData.filter(t => t.department_id === dept.id);
                
                // Calculate iterations
                const ticketsWithIterations = deptTickets.filter(t => t.iteration_count > 0);
                const totalIterations = ticketsWithIterations.reduce((sum, t) => sum + (t.iteration_count || 1), 0);
                const avgIterations = ticketsWithIterations.length > 0 
                    ? totalIterations / ticketsWithIterations.length 
                    : 0;

                // Calculate SLA breach %
                const ticketsWithDeadline = deptTickets.filter(t => t.delivery_datetime);
                const breached = ticketsWithDeadline.filter(t => {
                    const deliveryDate = new Date(t.delivery_datetime);
                    const completedDate = t.updated_at ? new Date(t.updated_at) : new Date();
                    return completedDate > deliveryDate && ['DELIVERED', 'CLOSED'].includes(t.status);
                }).length;
                const slaBreachPercent = ticketsWithDeadline.length > 0 
                    ? (breached / ticketsWithDeadline.length) * 100 
                    : 0;

                // Count red alerts
                const deptAlerts = alertsData.filter(a => {
                    const ticket = ticketsData.find(t => t.id === a.ticket_id);
                    return ticket && ticket.department_id === dept.id;
                });

                // Calculate FTR %
                const completedTickets = deptTickets.filter(t => 
                    ['DELIVERED', 'CLOSED'].includes(t.status)
                );
                const ftrTickets = completedTickets.filter(t => 
                    (t.iteration_count || 1) === 1
                );
                const ftrPercent = completedTickets.length > 0 
                    ? (ftrTickets.length / completedTickets.length) * 100 
                    : 0;

                return {
                    department: dept,
                    avg_iterations: avgIterations.toFixed(2),
                    sla_breach_percent: slaBreachPercent.toFixed(1),
                    red_alerts_count: deptAlerts.length,
                    ftr_percent: ftrPercent.toFixed(1),
                    total_tickets: deptTickets.length
                };
            });

            // Sort by risk (combination of metrics)
            heatmap.sort((a, b) => {
                const aRisk = parseFloat(a.sla_breach_percent) + (a.red_alerts_count * 10) + (parseFloat(a.avg_iterations) * 5);
                const bRisk = parseFloat(b.sla_breach_percent) + (b.red_alerts_count * 10) + (parseFloat(b.avg_iterations) * 5);
                return bRisk - aRisk;
            });

            setHeatmapData(heatmap);
        } catch (err) {
            console.error('Failed to fetch heatmap data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevel = (item) => {
        const riskScore = parseFloat(item.sla_breach_percent) + (item.red_alerts_count * 10) + (parseFloat(item.avg_iterations) * 5);
        if (riskScore > 50) return { level: 'high', color: '#ef4444' };
        if (riskScore > 20) return { level: 'medium', color: '#f97316' };
        return { level: 'low', color: '#10b981' };
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Department Heatmap</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Systemic issue detection - fix process, not people</p>
                </div>
                <Button variant="outline" onClick={fetchHeatmapData} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {loading ? (
                <div>Loading department metrics...</div>
            ) : heatmapData.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No department data available</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {heatmapData.map((item) => {
                        const risk = getRiskLevel(item);
                        return (
                            <Card
                                key={item.department.id}
                                style={{
                                    padding: '1.5rem',
                                    border: `2px solid ${risk.color}40`,
                                    background: `${risk.color}10`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {item.department.name}
                                        </h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            {item.total_tickets} tickets
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: `${risk.color}20`,
                                        color: risk.color,
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        {risk.level.toUpperCase()} RISK
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Avg Iterations
                                        </div>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 700,
                                            color: parseFloat(item.avg_iterations) > 2.5 ? '#ef4444' : parseFloat(item.avg_iterations) > 1.5 ? '#f97316' : '#10b981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            {parseFloat(item.avg_iterations) > 2.5 ? (
                                                <TrendingUp size={16} />
                                            ) : (
                                                <TrendingDown size={16} />
                                            )}
                                            {item.avg_iterations}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            SLA Breach %
                                        </div>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 700,
                                            color: parseFloat(item.sla_breach_percent) > 30 ? '#ef4444' : parseFloat(item.sla_breach_percent) > 10 ? '#f97316' : '#10b981'
                                        }}>
                                            {item.sla_breach_percent}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Red Alerts
                                        </div>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 700,
                                            color: item.red_alerts_count > 0 ? '#ef4444' : '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            {item.red_alerts_count > 0 && <AlertTriangle size={16} />}
                                            {item.red_alerts_count}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            FTR %
                                        </div>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: 700,
                                            color: parseFloat(item.ftr_percent) >= 80 ? '#10b981' : parseFloat(item.ftr_percent) >= 60 ? '#eab308' : '#ef4444'
                                        }}>
                                            {item.ftr_percent}%
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
