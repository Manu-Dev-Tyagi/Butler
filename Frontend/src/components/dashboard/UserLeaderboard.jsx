import React from 'react';
import { Card } from '../ui/Card';
import { Trophy, Medal, Award } from 'lucide-react';

export function UserLeaderboard({ data }) {
    if (!data || !data.leaderboard || data.leaderboard.length === 0) {
        return (
            <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <p>No leaderboard data available</p>
            </Card>
        );
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy size={20} color="#eab308" />;
        if (rank === 2) return <Medal size={20} color="#94a3b8" />;
        if (rank === 3) return <Award size={20} color="#cd7f32" />;
        return <span style={{ width: '20px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{rank}</span>;
    };

    return (
        <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Top Performers</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ranked by FTR % and Tickets Completed</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Rank</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Team Member</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>FTR %</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Completed</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Avg. Resolution</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.leaderboard.map((entry, i) => (
                            <tr key={entry.user.id} style={{ borderBottom: i === data.leaderboard.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {getRankIcon(entry.metrics.rank)}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'var(--color-bg-card-hover)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)'
                                        }}>
                                            {entry.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{entry.user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{entry.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: entry.metrics.ftr_percentage > 80 ? 'var(--color-success)' : 'inherit' }}>
                                    {entry.metrics.ftr_percentage}%
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>{entry.metrics.tickets_completed}</td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>{entry.metrics.avg_resolution_hours.toFixed(1)}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
