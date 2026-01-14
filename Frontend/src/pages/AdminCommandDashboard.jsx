import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    Ticket, 
    AlertTriangle, 
    UserX, 
    CheckCircle, 
    Clock,
    TrendingUp,
    TrendingDown,
    RefreshCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Admin Command Dashboard (NOT a normal dashboard)
 * Top Row – System Health: Active tickets, Tickets at risk, Active exits, Red alerts
 * Middle – Decision Queues: Tickets waiting approval, Employees in EXIT_INITIATED, Tickets crossing SLA in next 24h
 * Bottom – Analytics Snapshot: FTR %, Avg iterations, SLA success %, Top delay departments
 * This is where Admin decides, not browses.
 */
export default function AdminCommandDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [systemHealth, setSystemHealth] = useState({
        activeTickets: 0,
        ticketsAtRisk: 0,
        activeExits: 0,
        redAlerts: 0
    });
    const [decisionQueues, setDecisionQueues] = useState({
        pendingApprovals: [],
        exitInitiated: [],
        slaRisk24h: []
    });
    const [analytics, setAnalytics] = useState({
        ftr: 0,
        avgIterations: 0,
        slaSuccess: 0,
        topDelayDepts: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                statsData,
                ticketsData,
                alertsData,
                usersData,
                pendingApprovals,
                analyticsData
            ] = await Promise.all([
                api.analytics.overview(),
                api.tickets.list(),
                api.alerts.list(),
                api.users.list(),
                api.tickets.list({ status: 'SUBMITTED' }),
                api.analytics.overview()
            ]);

            // System Health
            const activeTickets = ticketsData.filter(t => 
                ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(t.status)
            ).length;

            const ticketsAtRisk = alertsData.filter(a => 
                a.reason === 'SLA_BREACH' || a.reason === 'IDLE_TICKET'
            ).length;

            const activeExits = usersData.filter(u => 
                u.employment_status === 'EXIT_INITIATED'
            ).length;

            const redAlerts = alertsData.length;

            setSystemHealth({
                activeTickets,
                ticketsAtRisk,
                activeExits,
                redAlerts
            });

            // Decision Queues
            const exitInitiatedUsers = usersData.filter(u => 
                u.employment_status === 'EXIT_INITIATED'
            );

            // Get tickets crossing SLA in next 24h
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(tomorrow.getHours() + 24);

            const slaRiskTickets = ticketsData.filter(ticket => {
                if (!ticket.delivery_datetime) return false;
                const deliveryDate = new Date(ticket.delivery_datetime);
                return deliveryDate > now && deliveryDate <= tomorrow && 
                       ['ASSIGNED', 'IN_PROGRESS'].includes(ticket.status);
            });

            setDecisionQueues({
                pendingApprovals: pendingApprovals,
                exitInitiated: exitInitiatedUsers,
                slaRisk24h: slaRiskTickets
            });

            // Analytics Snapshot
            const ftr = analyticsData.ftr || 0;
            const avgIterations = analyticsData.raw?.iterations?.avg_per_ticket || 0;
            const slaSuccess = 100 - (ticketsAtRisk / activeTickets * 100) || 0;

            setAnalytics({
                ftr,
                avgIterations: avgIterations.toFixed(1),
                slaSuccess: slaSuccess.toFixed(1),
                topDelayDepts: [] // Would need department analytics
            });
        } catch (err) {
            console.error('Failed to fetch command dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const HealthCard = ({ icon: Icon, label, value, color, onClick }) => (
        <Card
            onClick={onClick}
            style={{
                padding: '1.5rem',
                cursor: onClick ? 'pointer' : 'default',
                border: `2px solid ${color}40`,
                background: `${color}10`,
                transition: 'all 0.2s'
            }}
            onMouseEnter={onClick ? (e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = color;
            } : undefined}
            onMouseLeave={onClick ? (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${color}40`;
            } : undefined}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={24} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: color }}>
                        {value}
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Command Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Decision center - act on what needs attention</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* System Health Row */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>System Health</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <HealthCard
                        icon={Ticket}
                        label="Active Tickets"
                        value={systemHealth.activeTickets}
                        color="#3b82f6"
                        onClick={() => navigate('/dashboard/admin')}
                    />
                    <HealthCard
                        icon={AlertTriangle}
                        label="Tickets at Risk"
                        value={systemHealth.ticketsAtRisk}
                        color="#f97316"
                        onClick={() => navigate('/alerts')}
                    />
                    <HealthCard
                        icon={UserX}
                        label="Active Exits"
                        value={systemHealth.activeExits}
                        color="#ef4444"
                        onClick={() => navigate('/offboarding')}
                    />
                    <HealthCard
                        icon={AlertTriangle}
                        label="Red Alerts"
                        value={systemHealth.redAlerts}
                        color="#ef4444"
                        onClick={() => navigate('/alerts')}
                    />
                </div>
            </div>

            {/* Decision Queues */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Decision Queues</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {/* Pending Approvals */}
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <CheckCircle size={20} color="#3b82f6" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tickets Waiting Approval</h3>
                            <span style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-muted)',
                                marginLeft: 'auto'
                            }}>
                                {decisionQueues.pendingApprovals.length}
                            </span>
                        </div>
                        {decisionQueues.pendingApprovals.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No pending approvals</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {decisionQueues.pendingApprovals.slice(0, 5).map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        style={{
                                            padding: '0.75rem',
                                            background: 'var(--color-bg-card)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ticket.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Iteration #{ticket.iteration_count || 1} • {ticket.assignee_name || 'Unassigned'}
                                        </div>
                                    </div>
                                ))}
                                {decisionQueues.pendingApprovals.length > 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/dashboard/pm')}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        View All ({decisionQueues.pendingApprovals.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Exit Initiated */}
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <UserX size={20} color="#ef4444" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Employees in EXIT_INITIATED</h3>
                            <span style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-muted)',
                                marginLeft: 'auto'
                            }}>
                                {decisionQueues.exitInitiated.length}
                            </span>
                        </div>
                        {decisionQueues.exitInitiated.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No active exits</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {decisionQueues.exitInitiated.slice(0, 5).map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => navigate(`/offboarding`)}
                                        style={{
                                            padding: '0.75rem',
                                            background: 'var(--color-bg-card)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {user.email} • {user.role}
                                        </div>
                                    </div>
                                ))}
                                {decisionQueues.exitInitiated.length > 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/offboarding')}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        View All ({decisionQueues.exitInitiated.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* SLA Risk 24h */}
                    <Card style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Clock size={20} color="#f97316" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>SLA Risk (Next 24h)</h3>
                            <span style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-muted)',
                                marginLeft: 'auto'
                            }}>
                                {decisionQueues.slaRisk24h.length}
                            </span>
                        </div>
                        {decisionQueues.slaRisk24h.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No SLA risks in next 24h</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {decisionQueues.slaRisk24h.slice(0, 5).map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        style={{
                                            padding: '0.75rem',
                                            background: 'var(--color-bg-card)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ticket.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Due: {new Date(ticket.delivery_datetime).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                {decisionQueues.slaRisk24h.length > 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/alerts')}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        View All ({decisionQueues.slaRisk24h.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Analytics Snapshot */}
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Analytics Snapshot</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            FTR %
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: analytics.ftr >= 80 ? '#10b981' : analytics.ftr >= 60 ? '#eab308' : '#ef4444' }}>
                            {analytics.ftr}%
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {analytics.ftr >= 80 ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#ef4444" />}
                            First Time Right
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Avg Iterations
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: analytics.avgIterations <= 1.5 ? '#10b981' : analytics.avgIterations <= 2.5 ? '#eab308' : '#ef4444' }}>
                            {analytics.avgIterations}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            per ticket
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            SLA Success %
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: analytics.slaSuccess >= 90 ? '#10b981' : analytics.slaSuccess >= 70 ? '#eab308' : '#ef4444' }}>
                            {analytics.slaSuccess}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            On-time delivery
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
