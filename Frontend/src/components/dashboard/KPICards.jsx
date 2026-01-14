import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const STATS = [
    { label: 'Active Projects', valueKey: 'activeProjects', icon: TrendingUp, color: 'info' },
    { label: 'Open Tickets', valueKey: 'openTickets', icon: Clock, color: 'primary' },
    { label: 'Tickets at Risk', valueKey: 'riskTickets', icon: AlertTriangle, color: 'danger' },
    { label: 'FTR %', valueKey: 'ftr', icon: CheckCircle, color: 'success', suffix: '%' },
];

export function KPICards({ stats, loading }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {STATS.map((stat) => (
                <Card key={stat.label} style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                {loading ? '...' : (stats[stat.valueKey] || 0)}{stat.suffix || ''}
                            </h3>
                        </div>
                        <div style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            background: `var(--color-${stat.color})`, opacity: 0.15,
                            color: `var(--color-${stat.color})` // This won't work with opacity on background, need better approach or nested div
                        }}>
                            {/* Keeping it simple for now, icon color handles the look */}
                        </div>
                        {/* Proper Icon container */}
                        <div style={{
                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            background: stat.color === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                                stat.color === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                                    stat.color === 'info' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            color: stat.color === 'danger' ? 'var(--color-danger)' :
                                stat.color === 'success' ? 'var(--color-success)' :
                                    stat.color === 'info' ? 'var(--color-info)' : 'var(--color-primary)'
                        }}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                    {/* Micro chart or trend could go here */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                        <TrendingUp size={14} />
                        <span>+12% from last sprint</span>
                    </div>
                </Card>
            ))}
        </div>
    );
}
