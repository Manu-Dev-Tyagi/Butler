import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ApprovalPanel({ ticketId, onAction }) {
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();

    const handleAction = async (type) => {
        if (!comment.trim()) {
            alert('Please provide a comment for this action.');
            return;
        }
        setLoading(true);
        try {
            if (type === 'approve') {
                await api.tickets.approve(ticketId, user.id);
            } else {
                await api.tickets.reject(ticketId, user.id, comment);
            }
            if (onAction) onAction();
        } catch (err) {
            console.error('Failed to process approval', err);
            alert(`Failed to ${type === 'approve' ? 'approve' : 'reject'} ticket. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Approval Required</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                    placeholder="Enter feedback or approval notes (Mandatory)..."
                    rows={3}
                    style={{
                        width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)', resize: 'vertical'
                    }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        variant="ghost"
                        className="hover-danger"
                        onClick={() => handleAction('reject')}
                        isLoading={loading}
                        style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    >
                        <XCircle size={18} style={{ marginRight: '0.5rem' }} /> Request Revision
                    </Button>
                    <Button
                        onClick={() => handleAction('approve')}
                        isLoading={loading}
                        style={{ flex: 1, background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                    >
                        <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Approve
                    </Button>
                </div>
            </div>
        </Card>
    );
}
