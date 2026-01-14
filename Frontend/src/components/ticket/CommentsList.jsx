import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { api } from '../../services/api';
import { Skeleton } from '../ui/Skeleton';
import { MessageSquare, User } from 'lucide-react';

export function CommentsList({ ticketId, onCommentAdded }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComments();
    }, [ticketId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.tickets.comments(ticketId);
            setComments(data || []);
        } catch (err) {
            console.error('Failed to fetch comments', err);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (onCommentAdded) {
            fetchComments();
        }
    }, [onCommentAdded]);

    if (loading) {
        return (
            <Card style={{ padding: '1.5rem' }}>
                <Skeleton style={{ height: '100px' }} />
            </Card>
        );
    }

    if (error) {
        return (
            <Card style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</p>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.length === 0 ? (
                <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <MessageSquare size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No comments yet. Be the first to comment!</p>
                </Card>
            ) : (
                comments.map((comment) => (
                    <Card key={comment.id} style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--color-primary)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 600, flexShrink: 0
                            }}>
                                {comment.user_name?.[0] || <User size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                                        {comment.user_name || 'Unknown User'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--color-text-main)' }}>
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}
