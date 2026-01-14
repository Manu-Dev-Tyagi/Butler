import React from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';

export function DistributionCharts({ data }) {
    if (!data || !data.status_distribution || !data.priority_distribution) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <Card style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <p>No distribution data available</p>
                </Card>
                <Card style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <p>No distribution data available</p>
                </Card>
            </div>
        );
    }

    const { status_distribution, priority_distribution } = data;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Ticket Status Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {status_distribution.map((item, i) => (
                        <div key={item.status}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{item.status.replace('_', ' ')}</span>
                                <span style={{ fontWeight: 600 }}>{item.count} ({item.percentage}%)</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percentage}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    style={{
                                        height: '100%',
                                        background: item.status === 'APPROVED' ? 'var(--color-success)' :
                                            item.status === 'IN_PROGRESS' ? 'var(--color-primary)' :
                                                item.status === 'SUBMITTED' ? 'var(--color-info)' :
                                                    'var(--color-text-muted)',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Priority Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {priority_distribution.map((item, i) => (
                        <div key={item.priority}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>{item.priority}</span>
                                <span style={{ fontWeight: 600 }}>{item.count} ({item.percentage}%)</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percentage}%` }}
                                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                    style={{
                                        height: '100%',
                                        background: item.priority === 'URGENT' ? 'var(--color-danger)' :
                                            item.priority === 'HIGH' ? '#f97316' :
                                                item.priority === 'MEDIUM' ? '#eab308' :
                                                    '#3b82f6',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
