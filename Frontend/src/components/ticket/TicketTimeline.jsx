import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { api } from '../../services/api';

export function TicketTimeline({ ticketId }) {
    const [iterations, setIterations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIterations = async () => {
            try {
                setLoading(true);
                const data = await api.tickets.iterations(ticketId);
                setIterations(data || []);
            } catch (err) {
                console.error('Failed to fetch iterations', err);
            } finally {
                setLoading(false);
            }
        };
        fetchIterations();
    }, [ticketId]);

    if (loading) {
        return (
            <Card style={{ padding: '1.5rem' }}>
                <Skeleton style={{ height: '100px' }} />
            </Card>
        );
    }

    return (
        <Card style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Iteration History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'var(--color-border)' }}></div>

                {iterations.map((iter, i) => (
                    <div key={iter.id} className="animate-slideUp" style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--color-bg-card)', border: '2px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{iter.iteration_number}</span>
                        </div>
                        <div style={{ flex: 1, paddingBottom: '1rem', borderBottom: i !== iterations.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 500 }}>Iteration #{iter.iteration_number}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(iter.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                                <Badge variant={iter.outcome === 'APPROVED' ? 'success' : iter.outcome === 'REVISION_REQUIRED' ? 'danger' : 'neutral'}>
                                    {iter.outcome}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ))}
                {iterations.length === 0 && !loading && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '0.875rem' }}>No iterations yet</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
