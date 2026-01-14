import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export function RedAlertsWidget({ limit = 5 }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const data = await api.alerts.list({ status: 'ACTIVE' });
            setAlerts(data.slice(0, limit));
        } catch (err) {
            console.error('Failed to fetch alerts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAlerts();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <Card style={{ padding: '1.5rem' }}>
                <Skeleton style={{ height: '150px' }} />
            </Card>
        );
    }

    return (
        <Card style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} color="var(--color-danger)" />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Red Alerts</h3>
                    {alerts.length > 0 && (
                        <Badge variant="danger" style={{ fontSize: '0.75rem' }}>
                            {alerts.length}
                        </Badge>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </Button>
            </div>

            {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    <AlertTriangle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.875rem' }}>No active alerts</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            style={{
                                padding: '0.75rem',
                                background: 'var(--color-bg-card)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover-row"
                            onClick={() => alert.ticket_id && navigate(`/tickets/${alert.ticket_id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Badge variant={alert.type} style={{ fontSize: '0.7rem' }}>
                                            {alert.reason?.replace('_', ' ') || alert.title}
                                        </Badge>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
                                        {alert.message || alert.ticket_title || `Ticket #${alert.ticket_id}`}
                                    </p>
                                    {alert.project_name && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {alert.project_name}
                                        </p>
                                    )}
                                </div>
                                {alert.ticket_id && (
                                    <ExternalLink size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
