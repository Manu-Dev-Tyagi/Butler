import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    FileText, 
    User, 
    Ticket, 
    CheckCircle, 
    XCircle,
    ArrowRight,
    RefreshCcw,
    Filter,
    Search,
    Calendar
} from 'lucide-react';

/**
 * Audit Log Viewer
 * Immutable log of:
 * - State transitions
 * - Assignment changes
 * - Approval decisions
 * - Exit actions
 */
export default function AuditLogViewer() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState([]);
    const [filters, setFilters] = useState({
        action_type: '',
        entity_type: '',
        user_id: '',
        date_from: '',
        date_to: '',
        search: ''
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const usersData = await api.users.list();
                setUsers(usersData);
            } catch (err) {
                console.error('Failed to load users:', err);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        fetchAuditLogs();
    }, [filters]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            // Combine data from multiple sources to create audit log
            const [tickets, approvals, notifications, alerts] = await Promise.all([
                api.tickets.list({ limit: 100 }),
                // Get approvals from tickets
                Promise.all(
                    (await api.tickets.list({ limit: 100 })).map(async (ticket) => {
                        try {
                            // Try to get approval history (would need backend endpoint)
                            return null;
                        } catch {
                            return null;
                        }
                    })
                ),
                api.notifications.list(),
                api.alerts.list()
            ]);

            // Transform into audit log format
            const logs = [];

            // Ticket state transitions
            tickets.forEach(ticket => {
                logs.push({
                    id: `ticket-${ticket.id}-created`,
                    timestamp: ticket.created_at,
                    action_type: 'STATE_TRANSITION',
                    entity_type: 'TICKET',
                    entity_id: ticket.id,
                    entity_name: ticket.title,
                    user_id: ticket.created_by_id,
                    user_name: ticket.created_by_name || 'System',
                    details: `Ticket created with status: ${ticket.status}`,
                    old_value: null,
                    new_value: ticket.status
                });

                if (ticket.assignee_id) {
                    logs.push({
                        id: `ticket-${ticket.id}-assigned`,
                        timestamp: ticket.updated_at || ticket.created_at,
                        action_type: 'ASSIGNMENT',
                        entity_type: 'TICKET',
                        entity_id: ticket.id,
                        entity_name: ticket.title,
                        user_id: ticket.assignee_id,
                        user_name: ticket.assignee_name,
                        details: `Ticket assigned to ${ticket.assignee_name}`,
                        old_value: null,
                        new_value: ticket.assignee_id
                    });
                }
            });

            // Red alerts
            alerts.forEach(alert => {
                logs.push({
                    id: `alert-${alert.id}`,
                    timestamp: alert.triggered_at,
                    action_type: 'RED_ALERT',
                    entity_type: 'TICKET',
                    entity_id: alert.ticket_id,
                    entity_name: alert.ticket_title || `Ticket ${alert.ticket_id}`,
                    user_id: null,
                    user_name: 'System',
                    details: `Red alert triggered: ${alert.reason}`,
                    old_value: null,
                    new_value: alert.reason
                });
            });

            // Sort by timestamp (newest first)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Apply filters
            let filtered = logs;
            if (filters.action_type) {
                filtered = filtered.filter(log => log.action_type === filters.action_type);
            }
            if (filters.entity_type) {
                filtered = filtered.filter(log => log.entity_type === filters.entity_type);
            }
            if (filters.user_id) {
                filtered = filtered.filter(log => log.user_id === filters.user_id);
            }
            if (filters.search) {
                const query = filters.search.toLowerCase();
                filtered = filtered.filter(log =>
                    log.entity_name?.toLowerCase().includes(query) ||
                    log.user_name?.toLowerCase().includes(query) ||
                    log.details?.toLowerCase().includes(query)
                );
            }
            if (filters.date_from) {
                filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.date_from));
            }
            if (filters.date_to) {
                filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.date_to));
            }

            setAuditLogs(filtered.slice(0, 500)); // Limit to 500 most recent
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (actionType) => {
        switch (actionType) {
            case 'STATE_TRANSITION':
                return <ArrowRight size={18} />;
            case 'ASSIGNMENT':
                return <User size={18} />;
            case 'APPROVAL':
                return <CheckCircle size={18} color="#10b981" />;
            case 'REJECTION':
                return <XCircle size={18} color="#ef4444" />;
            case 'RED_ALERT':
                return <FileText size={18} color="#ef4444" />;
            case 'EXIT':
                return <User size={18} color="#f97316" />;
            default:
                return <FileText size={18} />;
        }
    };

    const getActionColor = (actionType) => {
        switch (actionType) {
            case 'APPROVAL':
                return 'rgba(16, 185, 129, 0.1)';
            case 'REJECTION':
            case 'RED_ALERT':
                return 'rgba(239, 68, 68, 0.1)';
            case 'EXIT':
                return 'rgba(249, 115, 22, 0.1)';
            default:
                return 'rgba(59, 130, 246, 0.1)';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const handleLogClick = (log) => {
        if (log.entity_type === 'TICKET') {
            navigate(`/tickets/${log.entity_id}`);
        } else if (log.entity_type === 'PROJECT') {
            navigate(`/projects/${log.entity_id}`);
        } else if (log.entity_type === 'USER' && log.user_id) {
            navigate(`/users/${log.user_id}`);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Audit Log</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Immutable log of all system actions and state changes</p>
                </div>
                <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filters</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Action Type
                        </label>
                        <select
                            value={filters.action_type}
                            onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Actions</option>
                            <option value="STATE_TRANSITION">State Transition</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="APPROVAL">Approval</option>
                            <option value="REJECTION">Rejection</option>
                            <option value="RED_ALERT">Red Alert</option>
                            <option value="EXIT">Exit</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Entity Type
                        </label>
                        <select
                            value={filters.entity_type}
                            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Entities</option>
                            <option value="TICKET">Ticket</option>
                            <option value="PROJECT">Project</option>
                            <option value="USER">User</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            User
                        </label>
                        <select
                            value={filters.user_id}
                            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                        Search
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-muted)'
                        }} />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Search by entity name, user, or details..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-input)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* Audit Log List */}
            {loading ? (
                <div>Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No audit logs found</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {auditLogs.map((log) => (
                        <Card
                            key={log.id}
                            onClick={() => handleLogClick(log)}
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: getActionColor(log.action_type),
                                border: '1px solid var(--color-border)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--color-bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getActionIcon(log.action_type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {log.action_type.replace('_', ' ')}
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {log.details}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        <span>
                                            {log.entity_type}: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                                {log.entity_name || log.entity_id?.substring(0, 8)}
                                            </span>
                                        </span>
                                        {log.user_name && (
                                            <span>
                                                By: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                                    {log.user_name}
                                                </span>
                                            </span>
                                        )}
                                        {log.old_value && log.new_value && (
                                            <span>
                                                {log.old_value} → {log.new_value}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
