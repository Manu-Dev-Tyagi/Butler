import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Ticket, Clock, User, AlertTriangle, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

/**
 * Ticket Decision Queue (PM)
 * Only shows tickets needing PM action:
 * - SUBMITTED
 * - REVISION_REQUIRED (re-submit)
 * - SLA breach risk
 * Each row shows: Iteration count, SLA status, Employee name, Last activity time
 * PM never hunts for work — decisions come to them.
 */
export default function TicketDecisionQueue() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all', // 'all', 'submitted', 'revision_required', 'sla_risk'
        project_id: '',
        sprint_id: ''
    });
    const [projects, setProjects] = useState([]);
    const [sprints, setSprints] = useState([]);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [projectsData, sprintsData] = await Promise.all([
                    api.projects.list(),
                    api.meta.sprints.list()
                ]);
                setProjects(projectsData);
                setSprints(sprintsData);
            } catch (err) {
                console.error('Failed to load filters:', err);
            }
        };
        loadFilters();
    }, []);

    useEffect(() => {
        fetchDecisionTickets();
    }, [filters]);

    const fetchDecisionTickets = async () => {
        setLoading(true);
        try {
            // Get all tickets that need PM action
            const [submittedTickets, revisionTickets, allTickets] = await Promise.all([
                api.tickets.list({ status: 'SUBMITTED' }),
                api.tickets.list({ status: 'REVISION_REQUIRED' }),
                api.tickets.list()
            ]);

            // Get tickets with SLA risk (delivery date in next 24h or overdue)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(tomorrow.getHours() + 24);

            const slaRiskTickets = allTickets.filter(ticket => {
                if (!ticket.delivery_datetime) return false;
                const deliveryDate = new Date(ticket.delivery_datetime);
                return (deliveryDate <= tomorrow && deliveryDate >= now) || deliveryDate < now;
            });

            // Combine and enrich with additional data
            let decisionTickets = [
                ...submittedTickets.map(t => ({ ...t, decisionType: 'SUBMITTED' })),
                ...revisionTickets.map(t => ({ ...t, decisionType: 'REVISION_REQUIRED' })),
                ...slaRiskTickets.map(t => ({ ...t, decisionType: 'SLA_RISK' }))
            ];

            // Remove duplicates
            const uniqueTickets = [];
            const seen = new Set();
            for (const ticket of decisionTickets) {
                if (!seen.has(ticket.id)) {
                    seen.add(ticket.id);
                    uniqueTickets.push(ticket);
                }
            }

            // Enrich with iteration count and last activity
            const enrichedTickets = await Promise.all(
                uniqueTickets.map(async (ticket) => {
                    try {
                        const iterations = await api.tickets.iterations(ticket.id);
                        const comments = await api.tickets.comments(ticket.id);
                        
                        const lastComment = comments.length > 0 
                            ? comments[comments.length - 1] 
                            : null;
                        
                        return {
                            ...ticket,
                            iteration_count: iterations.length,
                            last_activity: lastComment?.created_at || ticket.updated_at || ticket.created_at
                        };
                    } catch (err) {
                        return {
                            ...ticket,
                            iteration_count: 0,
                            last_activity: ticket.created_at
                        };
                    }
                })
            );

            // Apply filters
            let filtered = enrichedTickets;
            if (filters.status !== 'all') {
                filtered = filtered.filter(t => t.decisionType === filters.status);
            }
            if (filters.project_id) {
                filtered = filtered.filter(t => t.project_id === filters.project_id);
            }
            if (filters.sprint_id) {
                filtered = filtered.filter(t => t.sprint_id === filters.sprint_id);
            }

            // Sort by priority: SLA risk first, then by last activity
            filtered.sort((a, b) => {
                if (a.decisionType === 'SLA_RISK' && b.decisionType !== 'SLA_RISK') return -1;
                if (b.decisionType === 'SLA_RISK' && a.decisionType !== 'SLA_RISK') return 1;
                return new Date(b.last_activity) - new Date(a.last_activity);
            });

            setTickets(filtered);
        } catch (err) {
            console.error('Failed to fetch decision tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDecisionTypeBadge = (type) => {
        switch (type) {
            case 'SUBMITTED':
                return { label: 'Awaiting Approval', color: '#3b82f6', icon: CheckCircle };
            case 'REVISION_REQUIRED':
                return { label: 'Revision Required', color: '#f97316', icon: XCircle };
            case 'SLA_RISK':
                return { label: 'SLA Risk', color: '#ef4444', icon: AlertTriangle };
            default:
                return { label: type, color: '#6b7280', icon: Ticket };
        }
    };

    const formatLastActivity = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Decision Queue</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Tickets requiring your action - decisions come to you</p>
                </div>
                <Button variant="outline" onClick={fetchDecisionTickets} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Decision Type
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="all">All Decisions</option>
                            <option value="SUBMITTED">Awaiting Approval</option>
                            <option value="REVISION_REQUIRED">Revision Required</option>
                            <option value="SLA_RISK">SLA Risk</option>
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
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Sprint
                        </label>
                        <select
                            value={filters.sprint_id}
                            onChange={(e) => setFilters({ ...filters, sprint_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Sprints</option>
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Tickets List */}
            {loading ? (
                <div>Loading...</div>
            ) : tickets.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--color-success)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No tickets requiring your decision</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tickets.map(ticket => {
                        const badge = getDecisionTypeBadge(ticket.decisionType);
                        const BadgeIcon = badge.icon;
                        const deliveryDate = ticket.delivery_datetime ? new Date(ticket.delivery_datetime) : null;
                        const isOverdue = deliveryDate && deliveryDate < new Date();
                        const isDueSoon = deliveryDate && deliveryDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);

                        return (
                            <Card
                                key={ticket.id}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    border: ticket.decisionType === 'SLA_RISK' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                                    background: ticket.decisionType === 'SLA_RISK' ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-card)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                    e.currentTarget.style.borderColor = badge.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)';
                                    e.currentTarget.style.borderColor = ticket.decisionType === 'SLA_RISK' ? 'var(--color-danger)' : 'var(--color-border)';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: `${badge.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <BadgeIcon size={24} color={badge.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                    {ticket.title}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                    <span>Project: {ticket.project_name || 'N/A'}</span>
                                                    {ticket.assignee_name && <span>Employee: {ticket.assignee_name}</span>}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                background: `${badge.color}20`,
                                                color: badge.color,
                                                fontWeight: 600,
                                                fontSize: '0.875rem'
                                            }}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Iterations: </span>
                                                <span style={{ fontWeight: 600, color: ticket.iteration_count > 3 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                                                    {ticket.iteration_count || 1}
                                                </span>
                                            </div>
                                            {deliveryDate && (
                                                <div>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Delivery: </span>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: isOverdue ? 'var(--color-danger)' : isDueSoon ? 'var(--color-warning)' : 'var(--color-text-main)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <Clock size={14} />
                                                        {isOverdue ? 'Overdue' : deliveryDate.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Last Activity: </span>
                                                <span style={{ fontWeight: 600 }}>{formatLastActivity(ticket.last_activity)}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Priority: </span>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: ticket.priority === 'URGENT' ? '#ef4444' :
                                                          ticket.priority === 'HIGH' ? '#f97316' :
                                                          ticket.priority === 'MEDIUM' ? '#eab308' : '#3b82f6'
                                                }}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
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
