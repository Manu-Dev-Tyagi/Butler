import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { UserX, RefreshCw, CheckCircle } from 'lucide-react';

export default function Offboarding() {
    const [loading, setLoading] = useState(true);
    const [exitingUsers, setExitingUsers] = useState([]);

    useEffect(() => {
        const fetchExits = async () => {
            try {
                setLoading(true);
                const users = await api.users.list();
                setExitingUsers(users.filter(u => u.employment_status === 'EXIT_INITIATED'));
            } catch (err) {
                console.error('Failed to fetch exiting users', err);
            } finally {
                setLoading(false);
            }
        };
        fetchExits();
    }, []);

    const handleOffboard = async (id) => {
        if (!confirm('Are you sure you want to complete offboarding for this user? This action cannot be undone.')) {
            return;
        }
        try {
            await api.users.offboard(id);
            alert('User offboarded successfully.');
            setExitingUsers(exitingUsers.filter(u => u.id !== id));
        } catch (err) {
            console.error('Failed to offboard user', err);
            alert('Failed to offboard user. Please try again.');
        }
    };

    return (
        <div className="animate-fadeIn">
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Offboarding Management</h1>

            {loading ? (
                <Card style={{ padding: '2rem' }}>
                    <Skeleton style={{ height: '200px' }} />
                </Card>
            ) : exitingUsers.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <UserX size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>No pending exits</h3>
                    <p>All active employees are in good standing.</p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {exitingUsers.map(user => (
                        <Card key={user.id} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{user.name}</h3>
                                    <p style={{ color: 'var(--color-text-muted)' }}>{user.role} • {user.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>3</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Open Tickets</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>1</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Project</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline">
                                    <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Reassign Assets
                                </Button>
                                <Button variant="danger" onClick={() => handleOffboard(user.id)}>
                                    <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Complete Offboarding
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
