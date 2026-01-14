import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal } from 'lucide-react';

export function UserTable({ users }) {
    return (
        <Card>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>System Users</h3>
                <button className="btn-ghost" style={{ padding: '0.5rem' }}>View All</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Name</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Email</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Role</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.name}</td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>{user.email}</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <Badge variant="outline">{user.role}</Badge>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                                        {user.status}
                                    </Badge>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
