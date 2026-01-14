import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    RefreshCcw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    RotateCw,
    Filter
} from 'lucide-react';

/**
 * Event Queue Monitor
 * Shows:
 * - Pending events
 * - Failed events
 * - Retry count
 * Actions:
 * - Retry
 * - Mark failed
 * - Inspect payload
 */
export default function EventQueueMonitor() {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all' // 'all', 'PENDING', 'PROCESSING', 'DONE', 'FAILED'
    });
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // This endpoint would need to be created in backend
            // For now, we'll use a placeholder
            const response = await api.events?.list(filters) || [];
            setEvents(response);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            // Show empty state if endpoint doesn't exist yet
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (eventId) => {
        if (!confirm('Retry processing this event?')) return;
        
        try {
            await api.events?.retry(eventId);
            fetchEvents();
        } catch (err) {
            console.error('Failed to retry event:', err);
            alert('Failed to retry event. Backend endpoint may not be implemented yet.');
        }
    };

    const handleMarkFailed = async (eventId) => {
        if (!confirm('Mark this event as permanently failed?')) return;
        
        try {
            await api.events?.markFailed(eventId);
            fetchEvents();
        } catch (err) {
            console.error('Failed to mark event as failed:', err);
            alert('Failed to mark event. Backend endpoint may not be implemented yet.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <Clock size={18} color="#eab308" />;
            case 'PROCESSING':
                return <RefreshCcw size={18} color="#3b82f6" className="animate-spin" />;
            case 'DONE':
                return <CheckCircle size={18} color="#10b981" />;
            case 'FAILED':
                return <XCircle size={18} color="#ef4444" />;
            default:
                return <AlertCircle size={18} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return '#eab308';
            case 'PROCESSING':
                return '#3b82f6';
            case 'DONE':
                return '#10b981';
            case 'FAILED':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const filteredEvents = filters.status === 'all' 
        ? events 
        : events.filter(e => e.status === filters.status);

    const groupedEvents = {
        PENDING: filteredEvents.filter(e => e.status === 'PENDING'),
        PROCESSING: filteredEvents.filter(e => e.status === 'PROCESSING'),
        DONE: filteredEvents.filter(e => e.status === 'DONE'),
        FAILED: filteredEvents.filter(e => e.status === 'FAILED')
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Event Queue Monitor</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Monitor system event processing queue</p>
                </div>
                <Button variant="outline" onClick={fetchEvents} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </Button>
            </div>

            {/* Summary */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            Pending
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>
                            {groupedEvents.PENDING.length}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            Processing
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                            {groupedEvents.PROCESSING.length}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            Done
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                            {groupedEvents.DONE.length}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                            Failed
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                            {groupedEvents.FAILED.length}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Filters */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Filter size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filter by Status</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {['all', 'PENDING', 'PROCESSING', 'DONE', 'FAILED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilters({ ...filters, status })}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: filters.status === status ? 'var(--color-primary)' : 'var(--color-bg-card)',
                                color: filters.status === status ? '#fff' : 'var(--color-text-main)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Events List */}
            {loading ? (
                <div>Loading events...</div>
            ) : filteredEvents.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#10b981' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No events found</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        {!api.events && 'Note: Events API endpoint needs to be implemented in backend'}
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredEvents.map(event => {
                        const statusColor = getStatusColor(event.status);
                        return (
                            <Card
                                key={event.id}
                                style={{
                                    padding: '1.5rem',
                                    border: `1px solid ${statusColor}40`,
                                    background: `${statusColor}10`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            {getStatusIcon(event.status)}
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                                {event.event_type}
                                            </h3>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: `${statusColor}20`,
                                                color: statusColor,
                                                fontWeight: 600,
                                                fontSize: '0.75rem'
                                            }}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            Entity: {event.entity_type} • ID: {event.entity_id?.substring(0, 8)}...
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Created: {new Date(event.created_at).toLocaleString()}
                                            {event.processed_at && (
                                                <> • Processed: {new Date(event.processed_at).toLocaleString()}</>
                                            )}
                                        </div>
                                        {event.error_message && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                padding: '0.75rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.875rem',
                                                color: '#ef4444'
                                            }}>
                                                <strong>Error:</strong> {event.error_message}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                        {event.retry_count > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                                                Retries: {event.retry_count}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                <Eye size={14} />
                                                Inspect
                                            </Button>
                                            {event.status === 'FAILED' && event.retry_count < 3 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRetry(event.id)}
                                                >
                                                    <RotateCw size={14} />
                                                    Retry
                                                </Button>
                                            )}
                                            {event.status === 'FAILED' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkFailed(event.id)}
                                                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                                >
                                                    <XCircle size={14} />
                                                    Mark Failed
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Payload Inspector Modal */}
            {selectedEvent && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '1rem'
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <Card
                        style={{
                            width: '90%',
                            maxWidth: '700px',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="animate-scaleIn"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Event Payload</h2>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Event Type: <strong>{selectedEvent.event_type}</strong>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Entity: <strong>{selectedEvent.entity_type}</strong> • <strong>{selectedEvent.entity_id}</strong>
                            </div>
                        </div>
                        <pre style={{
                            padding: '1rem',
                            background: 'var(--color-bg-input)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'auto',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {JSON.stringify(selectedEvent.payload, null, 2)}
                        </pre>
                    </Card>
                </div>
            )}
        </div>
    );
}
