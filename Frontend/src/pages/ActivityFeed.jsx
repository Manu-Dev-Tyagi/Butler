import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { 
    Ticket, 
    User, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    UserX, 
    Calendar,
    Filter,
    RefreshCcw
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

/**
 * Global Activity Feed (READ-ONLY)
 * Purpose: System truth stream - audit backbone
 * Shows: Ticket created/assigned/submitted/approved/rejected, Red alerts, Employee exits, Sprint start/end
 * Rules: No editing, Time-ordered, Filterable by project/user/ticket
 */
export default function ActivityFeed() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [filters, setFilters] = useState({
        project_id: '',
        user_id: '',
        ticket_id: '',
        event_type: ''
    });
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    // Fetch filter options
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [projectsData, usersData] = await Promise.all([
                    api.projects.list(),
                    api.users.list()
                ]);
                setProjects(projectsData);
                setUsers(usersData);
            } catch (err) {
                console.error('Failed to load filter options:', err);
            }
        };
        loadFilters();
    }, []);

    // Fetch activities
    const fetchActivities = async () => {
        setLoading(true);
        try {
            // Combine data from multiple sources to create activity feed
            const [tickets, alerts, notifications] = await Promise.all([
                api.tickets.list({ limit: 50 }),
                api.alerts.recent(),
                api.notifications.list()
            ]);

            // Transform into activity feed format
            const activitiesList = [];

            // Add ticket activities (created, assigned, status changes)
            tickets.forEach(ticket => {
                activitiesList.push({
                    id: `ticket-${ticket.id}-created`,
                    type: 'TICKET_CREATED',
                    entity_type: 'TICKET',
                    entity_id: ticket.id,
                    title: ticket.title,
                    description: `Ticket "${ticket.title}" was created`,
                    user: ticket.created_by_name || 'System',
                    timestamp: ticket.created_at,
                    project_id: ticket.project_id,
                    project_name: ticket.project_name
                });
            });

            // Add red alerts
            alerts.forEach(alert => {
                activitiesList.push({
                    id: `alert-${alert.id}`,
                    type: 'RED_ALERT',
                    entity_type: 'TICKET',
                    entity_id: alert.ticket_id,
                    title: 'Red Alert Triggered',
                    description: alert.reason,
                    user: 'System',
                    timestamp: alert.triggered_at,
                    project_id: alert.project_id,
                    severity: 'high'
                });
            });

            // Add notifications as activities
            notifications.forEach(notif => {
                activitiesList.push({
                    id: `notif-${notif.id}`,
                    type: notif.event_type || 'NOTIFICATION',
                    entity_type: 'TICKET',
                    entity_id: notif.ticket_id,
                    title: notif.title,
                    description: notif.message,
                    user: notif.user_name || 'System',
                    timestamp: notif.created_at
                });
            });

            // Sort by timestamp (newest first)
            activitiesList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Apply filters
            let filtered = activitiesList;
            if (filters.project_id) {
                filtered = filtered.filter(a => a.project_id === filters.project_id);
            }
            if (filters.user_id) {
                filtered = filtered.filter(a => a.user_id === filters.user_id);
            }
            if (filters.ticket_id) {
                filtered = filtered.filter(a => a.entity_id === filters.ticket_id);
            }
            if (filters.event_type) {
                filtered = filtered.filter(a => a.type === filters.event_type);
            }

            setActivities(filtered.slice(0, 100)); // Limit to 100 most recent
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [filters]);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'TICKET_CREATED':
            case 'TICKET_ASSIGNED':
                return <Ticket size={18} />;
            case 'TICKET_APPROVED':
                return <CheckCircle size={18} color="#10b981" />;
            case 'TICKET_REJECTED':
            case 'REVISION_REQUIRED':
                return <XCircle size={18} color="#ef4444" />;
            case 'RED_ALERT':
                return <AlertTriangle size={18} color="#ef4444" />;
            case 'EXIT_INITIATED':
                return <UserX size={18} color="#f97316" />;
            case 'SPRINT_START':
            case 'SPRINT_END':
                return <Calendar size={18} />;
            default:
                return <Ticket size={18} />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'TICKET_APPROVED':
                return 'rgba(16, 185, 129, 0.1)';
            case 'TICKET_REJECTED':
            case 'RED_ALERT':
                return 'rgba(239, 68, 68, 0.1)';
            case 'EXIT_INITIATED':
                return 'rgba(249, 115, 22, 0.1)';
            default:
                return 'rgba(59, 130, 246, 0.1)';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleActivityClick = (activity) => {
        if (activity.entity_type === 'TICKET' && activity.entity_id) {
            navigate(`/tickets/${activity.entity_id}`);
        } else if (activity.entity_type === 'PROJECT' && activity.entity_id) {
            navigate(`/projects/${activity.entity_id}`);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Activity Feed</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>System truth stream - complete audit trail</p>
                </div>
                <Button variant="outline" onClick={fetchActivities} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filters</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                            Event Type
                        </label>
                        <select
                            value={filters.event_type}
                            onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="">All Events</option>
                            <option value="TICKET_CREATED">Ticket Created</option>
                            <option value="TICKET_ASSIGNED">Ticket Assigned</option>
                            <option value="TICKET_APPROVED">Ticket Approved</option>
                            <option value="TICKET_REJECTED">Ticket Rejected</option>
                            <option value="RED_ALERT">Red Alert</option>
                            <option value="EXIT_INITIATED">Exit Initiated</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Activity List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} style={{ height: '80px' }} />
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>No activities found</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activities.map((activity) => (
                        <Card
                            key={activity.id}
                            onClick={() => handleActivityClick(activity)}
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                background: getActivityColor(activity.type),
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
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {activity.title}
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {activity.description}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                            {formatTimestamp(activity.timestamp)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {activity.project_name && (
                                            <span>Project: {activity.project_name}</span>
                                        )}
                                        {activity.user && (
                                            <span>By: {activity.user}</span>
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
