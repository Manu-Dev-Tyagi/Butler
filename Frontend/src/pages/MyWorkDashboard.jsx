import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ticket, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * My Work Dashboard (Employee)
 * This is the most important employee screen
 * Sections: Due Today, High Priority, Revision Required, Upcoming (next 3 days)
 * Each ticket card shows: Deadline, Priority, Iteration #, SLA risk
 * No Kanban here. Focus > cosmetics.
 */
export default function MyWorkDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState({
        dueToday: [],
        highPriority: [],
        revisionRequired: [],
        upcoming: []
    });

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const fetchMyTickets = async () => {
        setLoading(true);
        try {
            // Get all assigned tickets
            const allTickets = await api.tickets.list({ assigned_to: 'me' });
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const threeDaysLater = new Date(today);
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            // Categorize tickets
            const dueToday = [];
            const highPriority = [];
            const revisionRequired = [];
            const upcoming = [];

            for (const ticket of allTickets) {
                const deliveryDate = ticket.delivery_datetime ? new Date(ticket.delivery_datetime) : null;
                const isDueToday = deliveryDate && 
                    deliveryDate.getDate() === today.getDate() &&
                    deliveryDate.getMonth() === today.getMonth() &&
                    deliveryDate.getFullYear() === today.getFullYear();

                const isUpcoming = deliveryDate && 
                    deliveryDate > today && 
                    deliveryDate <= threeDaysLater;

                // Check for alerts (SLA risk)
                let hasSlaRisk = false;
                try {
                    const alerts = await api.tickets.alerts(ticket.id);
                    hasSlaRisk = alerts.length > 0;
                } catch (err) {
                    // Ignore errors
                }

                // Due Today
                if (isDueToday) {
                    dueToday.push({ ...ticket, hasSlaRisk });
                }

                // High Priority
                if (ticket.priority === 'HIGH' || ticket.priority === 'URGENT') {
                    highPriority.push({ ...ticket, hasSlaRisk });
                }

                // Revision Required
                if (ticket.status === 'REVISION_REQUIRED') {
                    revisionRequired.push({ ...ticket, hasSlaRisk });
                }

                // Upcoming (next 3 days)
                if (isUpcoming && !isDueToday) {
                    upcoming.push({ ...ticket, hasSlaRisk });
                }
            }

            // Remove duplicates and sort
            const uniqueTickets = (arr) => {
                const seen = new Set();
                return arr.filter(t => {
                    if (seen.has(t.id)) return false;
                    seen.add(t.id);
                    return true;
                }).sort((a, b) => {
                    // Sort by priority and delivery date
                    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    if (a.delivery_datetime && b.delivery_datetime) {
                        return new Date(a.delivery_datetime) - new Date(b.delivery_datetime);
                    }
                    return 0;
                });
            };

            setTickets({
                dueToday: uniqueTickets(dueToday),
                highPriority: uniqueTickets(highPriority),
                revisionRequired: uniqueTickets(revisionRequired),
                upcoming: uniqueTickets(upcoming)
            });
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const TicketCard = ({ ticket }) => {
        const deliveryDate = ticket.delivery_datetime ? new Date(ticket.delivery_datetime) : null;
        const isOverdue = deliveryDate && deliveryDate < new Date();
        
        return (
            <Card
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                style={{
                    padding: '1.25rem',
                    cursor: 'pointer',
                    border: ticket.hasSlaRisk ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                    background: ticket.hasSlaRisk ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-card)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, flex: 1 }}>{ticket.title}</h4>
                    {ticket.hasSlaRisk && (
                        <AlertTriangle size={18} color="var(--color-danger)" style={{ marginLeft: '0.5rem' }} />
                    )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: ticket.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.2)' :
                                   ticket.priority === 'HIGH' ? 'rgba(249, 115, 22, 0.2)' :
                                   ticket.priority === 'MEDIUM' ? 'rgba(234, 179, 8, 0.2)' :
                                   'rgba(59, 130, 246, 0.2)',
                        color: ticket.priority === 'URGENT' ? '#ef4444' :
                              ticket.priority === 'HIGH' ? '#f97316' :
                              ticket.priority === 'MEDIUM' ? '#eab308' :
                              '#3b82f6',
                        fontWeight: 600
                    }}>
                        {ticket.priority}
                    </span>
                    <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        fontWeight: 600
                    }}>
                        Iteration #{ticket.iteration_count || 1}
                    </span>
                    {deliveryDate && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            fontWeight: isOverdue ? 600 : 400
                        }}>
                            <Clock size={14} />
                            {isOverdue ? 'Overdue' : deliveryDate.toLocaleDateString()}
                        </span>
                    )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Status: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{ticket.status.replace('_', ' ')}</span>
                </div>
            </Card>
        );
    };

    const Section = ({ title, tickets, emptyMessage, icon: Icon }) => (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {Icon && <Icon size={20} />}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
                <span style={{
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-bg-card)',
                    color: 'var(--color-text-muted)'
                }}>
                    {tickets.length}
                </span>
            </div>
            {tickets.length === 0 ? (
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>{emptyMessage}</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {tickets.map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Work</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Focus on what matters - your assigned work</p>
                </div>
                <Button onClick={fetchMyTickets} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <Section
                        title="Due Today"
                        tickets={tickets.dueToday}
                        emptyMessage="No tickets due today. Great work!"
                        icon={Clock}
                    />

                    <Section
                        title="High Priority"
                        tickets={tickets.highPriority}
                        emptyMessage="No high priority tickets"
                        icon={AlertTriangle}
                    />

                    <Section
                        title="Revision Required"
                        tickets={tickets.revisionRequired}
                        emptyMessage="No revisions needed"
                        icon={XCircle}
                    />

                    <Section
                        title="Upcoming (Next 3 Days)"
                        tickets={tickets.upcoming}
                        emptyMessage="No upcoming deadlines"
                        icon={CheckCircle}
                    />
                </div>
            )}
        </div>
    );
}
