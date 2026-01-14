import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { CommentsList } from '../components/ticket/CommentsList';
import { FileUpload } from '../components/ticket/FileUpload';
import { TicketTimeline } from '../components/ticket/TicketTimeline';
import { 
    ArrowLeft, 
    MessageSquare, 
    Upload, 
    CheckCircle, 
    AlertCircle,
    Lock,
    Clock,
    FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Ticket Workbench (Employee Mode)
 * Enhanced Ticket Detail – Employee Mode
 * Employee can:
 * - Upload files
 * - Comment
 * - Submit work
 * Employee CANNOT:
 * - Change priority
 * - Change delivery date
 * - Change assignment
 */
export default function TicketWorkbench() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [commentAdded, setCommentAdded] = useState(0);

    useEffect(() => {
        fetchTicketData();
    }, [id]);

    const fetchTicketData = async () => {
        try {
            setLoading(true);
            const [ticketData, filesData] = await Promise.all([
                api.tickets.get(id),
                api.files.list(id)
            ]);
            setTicket(ticketData);
            setFiles(filesData);
        } catch (err) {
            console.error('Failed to fetch ticket data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!comment.trim()) {
            alert('Please enter a comment');
            return;
        }
        setSubmittingComment(true);
        try {
            await api.tickets.addComment(id, user.id, comment);
            setComment('');
            setCommentAdded(prev => prev + 1);
        } catch (err) {
            console.error("Failed to post comment", err);
            alert('Failed to post comment. Please try again.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSubmitWork = async () => {
        if (files.length === 0) {
            alert('Please upload at least one file before submitting');
            return;
        }

        if (!confirm('Submit this work for approval? You cannot make changes after submission.')) {
            return;
        }

        setSubmittingWork(true);
        try {
            // Update status to SUBMITTED
            await api.tickets.updateStatus(id, 'SUBMITTED');
            alert('Work submitted successfully! Waiting for approval.');
            fetchTicketData(); // Refresh to show new status
        } catch (err) {
            console.error('Failed to submit work:', err);
            alert('Failed to submit work. Please try again.');
        } finally {
            setSubmittingWork(false);
        }
    };

    const handleAcceptTicket = async () => {
        try {
            await api.tickets.accept(id);
            fetchTicketData();
        } catch (err) {
            console.error('Failed to accept ticket:', err);
            alert('Failed to accept ticket');
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem' }}>
                <Skeleton style={{ height: '300px' }} />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="page-container" style={{ paddingTop: '4rem' }}>
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ticket Not Found</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>The ticket you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate('/my-work')}>Go to My Work</Button>
                </Card>
            </div>
        );
    }

    // Check if user is assigned to this ticket
    const isAssigned = ticket.assignee_id === user.id;
    const canWork = isAssigned && ['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUIRED'].includes(ticket.status);
    const canSubmit = isAssigned && ticket.status === 'IN_PROGRESS' && files.length > 0;
    const isLocked = ['SUBMITTED', 'APPROVED', 'DELIVERED', 'CLOSED'].includes(ticket.status);

    const deliveryDate = ticket.delivery_datetime ? new Date(ticket.delivery_datetime) : null;
    const isOverdue = deliveryDate && deliveryDate < new Date();
    const isDueSoon = deliveryDate && deliveryDate <= new Date(Date.now() + 24 * 60 * 60 * 1000);

    return (
        <div className="animate-fadeIn">
            <button
                onClick={() => navigate('/my-work')}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back to My Work
            </button>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            #{ticket.id?.substring(0, 8)}
                        </span>
                        <Badge variant={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'danger' : 'warning'}>
                            {ticket.priority}
                        </Badge>
                        {isLocked && (
                            <Badge variant="neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Lock size={12} />
                                Locked
                            </Badge>
                        )}
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ticket.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        <span>Project: {ticket.project_name || 'N/A'}</span>
                        <span>Status: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{ticket.status.replace('_', ' ')}</span></span>
                    </div>
                </div>
                <Badge variant="neutral" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {ticket.status.replace('_', ' ')}
                </Badge>
            </div>

            {/* Action Banner */}
            {!isAssigned && ticket.status === 'ASSIGNED' && (
                <Card style={{ 
                    padding: '1.5rem', 
                    marginBottom: '2rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Accept This Ticket</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                This ticket has been assigned to you. Accept it to start working.
                            </p>
                        </div>
                        <Button onClick={handleAcceptTicket}>
                            <CheckCircle size={18} />
                            Accept Ticket
                        </Button>
                    </div>
                </Card>
            )}

            {/* Deadline Warning */}
            {deliveryDate && (isOverdue || isDueSoon) && (
                <Card style={{ 
                    padding: '1rem', 
                    marginBottom: '2rem',
                    background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                    border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={20} color={isOverdue ? '#ef4444' : '#f97316'} />
                        <div>
                            <div style={{ fontWeight: 600, color: isOverdue ? '#ef4444' : '#f97316' }}>
                                {isOverdue ? 'Overdue' : 'Due Soon'}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Delivery deadline: {deliveryDate.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main Work Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Requirement */}
                    <Card style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            Requirement
                        </h3>
                        <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {ticket.description || 'No description provided.'}
                        </p>

                        <div style={{ 
                            marginTop: '2rem', 
                            paddingTop: '1rem', 
                            borderTop: '1px solid var(--color-border)',
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Department</span>
                                <span style={{ fontWeight: 500 }}>{ticket.department_name || 'N/A'}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Deadline</span>
                                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Lock size={14} style={{ opacity: 0.5 }} />
                                    {deliveryDate ? deliveryDate.toLocaleString() : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Priority</span>
                                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Lock size={14} style={{ opacity: 0.5 }} />
                                    {ticket.priority}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ad Name</span>
                                <span style={{ fontWeight: 500 }}>{ticket.ad_name || 'N/A'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* File Upload */}
                    {canWork && (
                        <Card style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Upload size={18} />
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Upload Files</h3>
                            </div>
                            <FileUpload ticketId={id} onFilesUpdated={fetchTicketData} />
                            {files.length > 0 && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                        Uploaded Files ({files.length})
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {files.map(file => (
                                            <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                <FileText size={14} />
                                                <span>{file.file_url.split('/').pop() || 'File'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Comments */}
                    <Card style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <MessageSquare size={18} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Comments</h3>
                        </div>
                        {canWork && (
                            <>
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
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Press Ctrl+Enter to submit</span>
                                    <Button size="sm" onClick={handleCommentSubmit} isLoading={submittingComment} disabled={!comment.trim()}>
                                        Post Comment
                                    </Button>
                                </div>
                            </>
                        )}
                        <CommentsList ticketId={id} onCommentAdded={commentAdded} />
                    </Card>

                    {/* Submit Work Button */}
                    {canSubmit && (
                        <Card style={{ 
                            padding: '1.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Ready to Submit?</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {files.length} file{files.length !== 1 ? 's' : ''} uploaded. Submit for approval.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleSubmitWork} 
                                    isLoading={submittingWork}
                                    style={{ background: '#10b981' }}
                                >
                                    <CheckCircle size={18} />
                                    Submit Work
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Locked Message */}
                    {isLocked && (
                        <Card style={{ 
                            padding: '1.5rem',
                            background: 'rgba(107, 114, 128, 0.1)',
                            border: '1px solid rgba(107, 114, 128, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Lock size={20} color="#6b7280" />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Ticket Locked</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        This ticket is {ticket.status.toLowerCase()}. You cannot make changes.
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <TicketTimeline ticketId={id} />

                    <Card style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Ticket Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Assignee</span>
                                <span style={{ fontWeight: 500 }}>{ticket.assignee_name || 'Unassigned'}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Created</span>
                                <span style={{ fontWeight: 500 }}>
                                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            {ticket.iteration_count > 0 && (
                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Iteration</span>
                                    <span style={{ fontWeight: 500 }}>#{ticket.iteration_count}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Restrictions Notice */}
                    <Card style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={14} />
                            Restricted Actions
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>❌ Cannot change priority</div>
                            <div>❌ Cannot change delivery date</div>
                            <div>❌ Cannot change assignment</div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
