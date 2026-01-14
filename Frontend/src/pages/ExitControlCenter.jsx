import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserX, Ticket, AlertTriangle, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react';

/**
 * Exit Control Center
 * Auto-populated list of:
 * - EXIT_INITIATED users
 * - Their active tickets
 * - Risk level per ticket
 * Actions:
 * - Reassign tickets
 * - Finalize exit
 * No exit without resolution → enforced here.
 */
export default function ExitControlCenter() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [exitUsers, setExitUsers] = useState([]);

    useEffect(() => {
        fetchExitUsers();
    }, []);

    const fetchExitUsers = async () => {
        setLoading(true);
        try {
            const users = await api.users.list();
            const exitInitiated = users.filter(u => u.employment_status === 'EXIT_INITIATED');

            // Enrich with active tickets and risk levels
            const enrichedUsers = await Promise.all(
                exitInitiated.map(async (user) => {
                    try {
                        // Get user's active tickets
                        const tickets = await api.tickets.list({ assigned_to: user.id });
                        const activeTickets = tickets.filter(t =>
                            ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(t.status)
                        );

                        // Calculate risk levels for each ticket
                        const ticketsWithRisk = await Promise.all(
                            activeTickets.map(async (ticket) => {
                                let riskLevel = 'low';
                                let riskReasons = [];

                                // Check for red alerts
                                try {
                                    const alerts = await api.tickets.alerts(ticket.id);
                                    if (alerts.length > 0) {
                                        riskLevel = 'high';
                                        riskReasons.push('Red Alert');
                                    }
                                } catch (err) {
                                    // Ignore
                                }

                                // Check SLA breach
                                if (ticket.delivery_datetime) {
                                    const deliveryDate = new Date(ticket.delivery_datetime);
                                    const now = new Date();
                                    if (deliveryDate < now) {
                                        riskLevel = 'high';
                                        riskReasons.push('SLA Breached');
                                    } else if (deliveryDate <= new Date(Date.now() + 24 * 60 * 60 * 1000)) {
                                        if (riskLevel === 'low') riskLevel = 'medium';
                                        riskReasons.push('SLA Risk (24h)');
                                    }
                                }

                                // Check iteration count
                                try {
                                    const iterations = await api.tickets.iterations(ticket.id);
                                    if (iterations.length > 3) {
                                        if (riskLevel === 'low') riskLevel = 'medium';
                                        riskReasons.push('High Iterations');
                                    }
                                } catch (err) {
                                    // Ignore
                                }

                                return {
                                    ...ticket,
                                    risk_level: riskLevel,
                                    risk_reasons: riskReasons
                                };
                            })
                        );

                        // Calculate overall risk for user
                        const highRiskTickets = ticketsWithRisk.filter(t => t.risk_level === 'high').length;
                        const mediumRiskTickets = ticketsWithRisk.filter(t => t.risk_level === 'medium').length;
                        const overallRisk = highRiskTickets > 0 ? 'high' : mediumRiskTickets > 0 ? 'medium' : 'low';

                        return {
                            ...user,
                            active_tickets: ticketsWithRisk,
                            active_tickets_count: ticketsWithRisk.length,
                            overall_risk: overallRisk,
                            high_risk_count: highRiskTickets,
                            medium_risk_count: mediumRiskTickets
                        };
                    } catch (err) {
                        console.error(`Failed to fetch tickets for user ${user.id}:`, err);
                        return {
                            ...user,
                            active_tickets: [],
                            active_tickets_count: 0,
                            overall_risk: 'low',
                            high_risk_count: 0,
                            medium_risk_count: 0
                        };
                    }
                })
            );

            // Sort by overall risk (high first)
            enrichedUsers.sort((a, b) => {
                const riskOrder = { high: 0, medium: 1, low: 2 };
                return riskOrder[a.overall_risk] - riskOrder[b.overall_risk];
            });

            setExitUsers(enrichedUsers);
        } catch (err) {
            console.error('Failed to fetch exit users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReassignTickets = (userId) => {
        navigate(`/offboarding?user_id=${userId}&action=reassign`);
    };

    const handleFinalizeExit = (userId) => {
        if (!confirm('Are you sure you want to finalize this exit? This action cannot be undone.')) return;
        
        // Navigate to offboarding page to finalize
        navigate(`/offboarding?user_id=${userId}&action=finalize`);
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'high': return '#ef4444';
            case 'medium': return '#f97316';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const UserExitCard = ({ user }) => {
        const riskColor = getRiskColor(user.overall_risk);

        return (
            <Card style={{
                padding: '1.5rem',
                border: `2px solid ${riskColor}40`,
                background: `${riskColor}10`,
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', flex: 1 }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: `${riskColor}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <UserX size={28} color={riskColor} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                {user.name}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                {user.email} • {user.role}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    Exit Requested: {user.exit_requested_at ? new Date(user.exit_requested_at).toLocaleDateString() : 'N/A'}
                                </span>
                                {user.exit_effective_at && (
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        Effective: {new Date(user.exit_effective_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: `${riskColor}20`,
                            color: riskColor,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
                            {user.overall_risk.toUpperCase()} RISK
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            {user.high_risk_count} High • {user.medium_risk_count} Medium
                        </div>
                    </div>
                </div>

                {/* Active Tickets */}
                {user.active_tickets_count === 0 ? (
                    <Card style={{
                        padding: '1rem',
                        background: 'var(--color-bg-card)',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            No active tickets - Safe to finalize exit
                        </p>
                    </Card>
                ) : (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Ticket size={18} />
                            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>
                                Active Tickets ({user.active_tickets_count})
                            </h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {user.active_tickets.map(ticket => (
                                <Card
                                    key={ticket.id}
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        border: `1px solid ${getRiskColor(ticket.risk_level)}40`,
                                        background: `${getRiskColor(ticket.risk_level)}10`,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                        e.currentTarget.style.borderColor = getRiskColor(ticket.risk_level);
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateX(0)';
                                        e.currentTarget.style.borderColor = `${getRiskColor(ticket.risk_level)}40`;
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {ticket.title}
                                            </h5>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                Project: {ticket.project_name || 'N/A'} • Status: {ticket.status}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: `${getRiskColor(ticket.risk_level)}20`,
                                                color: getRiskColor(ticket.risk_level),
                                                fontWeight: 600,
                                                fontSize: '0.75rem'
                                            }}>
                                                {ticket.risk_level.toUpperCase()}
                                            </span>
                                            {ticket.risk_reasons.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {ticket.risk_reasons.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    {user.active_tickets_count > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => handleReassignTickets(user.id)}
                            style={{ flex: 1 }}
                        >
                            <ArrowRight size={18} />
                            Reassign {user.active_tickets_count} Ticket{user.active_tickets_count !== 1 ? 's' : ''}
                        </Button>
                    )}
                    {user.active_tickets_count === 0 && (
                        <Button
                            onClick={() => handleFinalizeExit(user.id)}
                            style={{ flex: 1, background: '#10b981' }}
                        >
                            <CheckCircle size={18} />
                            Finalize Exit
                        </Button>
                    )}
                    {user.active_tickets_count > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => handleFinalizeExit(user.id)}
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                            <AlertTriangle size={18} />
                            Force Finalize (Risky)
                        </Button>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Exit Control Center</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Manage exits - No exit without resolution
                    </p>
                </div>
                <Button variant="outline" onClick={fetchExitUsers} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {loading ? (
                <div>Loading exit users...</div>
            ) : exitUsers.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#10b981' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No users with EXIT_INITIATED status</p>
                </Card>
            ) : (
                <div>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Total Exit Initiated: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{exitUsers.length}</span>
                            {' • '}
                            With Active Tickets: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {exitUsers.filter(u => u.active_tickets_count > 0).length}
                            </span>
                            {' • '}
                            High Risk: <span style={{ fontWeight: 600, color: '#ef4444' }}>
                                {exitUsers.filter(u => u.overall_risk === 'high').length}
                            </span>
                        </div>
                    </div>
                    {exitUsers.map(user => (
                        <UserExitCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}
