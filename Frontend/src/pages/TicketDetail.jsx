import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TicketTimeline } from '../components/ticket/TicketTimeline';
import { ApprovalPanel } from '../components/ticket/ApprovalPanel';
import { CommentsList } from '../components/ticket/CommentsList';
import { FileUpload } from '../components/ticket/FileUpload';
import { ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [commentAdded, setCommentAdded] = useState(0);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.tickets.get(id);
            setTicket(data);
        } catch (err) {
            console.error('Failed to fetch ticket', err);
            setError('Failed to load ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const handleCommentSubmit = async () => {
        if (!comment.trim()) {
            alert('Please enter a comment');
            return;
        }
        setSubmittingComment(true);
        try {
            await api.tickets.addComment(id, user.id, comment);
            setComment('');
            setCommentAdded(prev => prev + 1); // Trigger CommentsList refresh
        } catch (err) {
            console.error("Failed to post comment", err);
            alert('Failed to post comment. Please try again.');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem' }}>
                <Skeleton style={{ height: '300px' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem' }}>
                <Card style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <AlertCircle size={24} color="var(--color-danger)" />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-danger)' }}>Error Loading Ticket</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{error}</p>
                    <Button onClick={fetchTicket}>Retry</Button>
                </Card>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem' }}>
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ticket Not Found</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>The ticket you're looking for doesn't exist or has been deleted.</p>
                    <Button onClick={() => navigate('/dashboard/pm')}>Go to Dashboard</Button>
                </Card>
            </div>
        );
    }

    const showApproval = (ticket.status === 'SUBMITTED' && (user.role === 'ADMIN' || user.role === 'PM'));

    return (
        <div className="animate-fadeIn">
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>#{ticket.id}</span>
                        <Badge variant={ticket.priority === 'HIGH' ? 'danger' : 'warning'}>{ticket.priority}</Badge>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{ticket.title}</h1>
                </div>
                <Badge variant="neutral" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {ticket.status.replace('_', ' ')}
                </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <Card style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Requirement</h3>
                        <p style={{ lineHeight: 1.6 }}>{ticket.description || 'No description provided.'}</p>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Department</span>
                                <span style={{ fontWeight: 500 }}>{ticket.department_name}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Deadline</span>
                                <span style={{ fontWeight: 500 }}>{ticket.delivery_datetime ? new Date(ticket.delivery_datetime).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </Card>

                    <FileUpload ticketId={id} />

                    <Card style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <MessageSquare size={18} /> <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Comments</h3>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                            <textarea
                                placeholder="Write a comment..."
                                rows={3}
                                style={{
                                    width: '100%', background: 'transparent', border: 'none',
                                    color: 'var(--color-text-main)', resize: 'vertical',
                                    fontFamily: 'inherit', fontSize: '0.9375rem'
                                }}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleCommentSubmit();
                                    }
                                }}
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Press Ctrl+Enter to submit</span>
                            <Button size="sm" onClick={handleCommentSubmit} isLoading={submittingComment} disabled={!comment.trim()}>
                                Post Comment
                            </Button>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <CommentsList ticketId={id} onCommentAdded={commentAdded} />
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {showApproval && <ApprovalPanel ticketId={ticket.id} onAction={() => navigate('/dashboard/pm')} />}

                    <TicketTimeline ticketId={ticket.id} />

                    <Card style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Assignee</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {ticket.assignee_name?.[0] || 'U'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 500 }}>{ticket.assignee_name || 'Unassigned'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ticket.department_name}</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
