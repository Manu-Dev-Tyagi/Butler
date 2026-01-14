import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { api } from '../../services/api';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export function SprintAnalytics() {
    const [sprints, setSprints] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSprints = async () => {
            try {
                const res = await api.meta.sprints.list();
                setSprints(res);
                if (res.length > 0) setSelectedId(res[0].id);
            } catch (err) {
                console.error(err);
            }
        };
        loadSprints();
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.analytics.sprint(selectedId);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedId]);

    if (!data && loading) return (
        <Card style={{ padding: '1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" />
        </Card>
    );

    if (!data) return null;

    return (
        <Card style={{ padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Sprint Velocity</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{data.sprint.name}</p>
                </div>
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    style={{
                        background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)'
                    }}
                >
                    {sprints.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Timeline Visualization */}
            <div style={{ position: 'relative', height: '200px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '100%', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    {data.timeline.map((point, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} title={`Date: ${point.date}, Completed: ${point.tickets_completed}`}>
                            <div style={{
                                width: '100%',
                                height: `${(point.cumulative_completed / (data.tickets.total || 1)) * 100}%`,
                                background: 'var(--gradient-brand)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: 0.8,
                                minHeight: point.tickets_completed > 0 ? '4px' : '0'
                            }} className="hover-glow" />
                        </div>
                    ))}
                </div>
                {/* Target Line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                    borderTop: '1px dashed var(--color-text-muted)', opacity: 0.3,
                    transform: 'translateY(20px)'
                }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Completion Rate</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {data.tickets.completion_rate}%
                        {data.velocity.on_track ? <TrendingUp size={16} color="var(--color-success)" /> : <TrendingDown size={16} color="var(--color-danger)" />}
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Velocity (Tickets/Day)</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{data.velocity.tickets_per_day}</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%', marginRight: '0.4rem' }}></span>
                    Progress
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', border: '1px dashed var(--color-text-muted)', borderRadius: '50%', marginRight: '0.4rem' }}></span>
                    Scope ({data.tickets.total})
                </div>
            </div>
        </Card>
    );
}
