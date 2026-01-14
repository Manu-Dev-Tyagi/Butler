import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    FileText, 
    AlertTriangle,
    ArrowLeft,
    Download,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Approval View (Dedicated Screen)
 * Not inside ticket detail.
 * Side-by-side:
 * - Submitted files
 * - Previous iteration comparison
 * - SLA + iteration impact
 * Mandatory:
 * - Comment required on reject
 * - One-click approve / reject
 */
export default function ApprovalView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [currentIteration, setCurrentIteration] = useState(null);
    const [previousIteration, setPreviousIteration] = useState(null);
    const [files, setFiles] = useState([]);
    const [rejectComment, setRejectComment] = useState('');
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTicketData();
        }
    }, [id]);

    const fetchTicketData = async () => {
        setLoading(true);
        try {
            const [ticketData, iterationsData, filesData] = await Promise.all([
                api.tickets.get(id),
                api.tickets.iterations(id),
                api.files.list(id)
            ]);

            setTicket(ticketData);

            // Get current iteration (latest)
            const sortedIterations = iterationsData.sort((a, b) => 
                b.iteration_number - a.iteration_number
            );
            const latest = sortedIterations[0];
            setCurrentIteration(latest);

            // Get previous iteration (if exists)
            if (sortedIterations.length > 1) {
                setPreviousIteration(sortedIterations[1]);
            }

            // Get files for current iteration
            const currentFiles = filesData.filter(f => 
                f.iteration_id === latest?.id || !f.iteration_id
            );
            setFiles(currentFiles);
        } catch (err) {
            console.error('Failed to fetch ticket data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!user) return;
        
        setApproving(true);
        try {
            await api.tickets.approve(id, user.id);
            alert('Ticket approved successfully');
            navigate(`/tickets/${id}`);
        } catch (err) {
            console.error('Failed to approve ticket:', err);
            alert('Failed to approve ticket');
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!user) return;
        
        if (!rejectComment.trim()) {
            alert('Comment is required when rejecting');
            return;
        }

        setRejecting(true);
        try {
            await api.tickets.reject(id, user.id, rejectComment);
            alert('Ticket rejected');
            navigate(`/tickets/${id}`);
        } catch (err) {
            console.error('Failed to reject ticket:', err);
            alert('Failed to reject ticket');
        } finally {
            setRejecting(false);
        }
    };

    const calculateSlaImpact = () => {
        if (!ticket?.delivery_datetime) return null;
        
        const deliveryDate = new Date(ticket.delivery_datetime);
        const now = new Date();
        const diffMs = deliveryDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return {
            hoursRemaining: diffHours,
            isOverdue: diffHours < 0,
            isAtRisk: diffHours > 0 && diffHours <= 24
        };
    };

    const slaImpact = calculateSlaImpact();

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (!ticket) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Ticket not found</div>;
    }

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/tickets/${id}`)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Ticket
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Approval: {ticket.title}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Project: {ticket.project_name || 'N/A'} • Iteration #{currentIteration?.iteration_number || 1}
                    </p>
                </div>
            </div>

            {/* SLA & Iteration Impact */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem', background: slaImpact?.isOverdue ? 'rgba(239, 68, 68, 0.1)' : slaImpact?.isAtRisk ? 'rgba(249, 115, 22, 0.1)' : 'var(--color-bg-card)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            SLA Status
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {slaImpact?.isOverdue ? (
                                <>
                                    <AlertTriangle size={20} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>Overdue</span>
                                </>
                            ) : slaImpact?.isAtRisk ? (
                                <>
                                    <Clock size={20} color="#f97316" />
                                    <span style={{ color: '#f97316', fontWeight: 600 }}>
                                        {Math.floor(slaImpact.hoursRemaining)}h remaining
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} color="#10b981" />
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>On Track</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Iteration Count
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (currentIteration?.iteration_number || 1) > 3 ? '#ef4444' : '#3b82f6' }}>
                            #{currentIteration?.iteration_number || 1}
                            {(currentIteration?.iteration_number || 1) > 3 && (
                                <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#ef4444' }}>
                                    (High)
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Employee
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {ticket.assignee_name || 'Unassigned'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                            Priority
                        </div>
                        <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: ticket.priority === 'URGENT' ? '#ef4444' :
                                  ticket.priority === 'HIGH' ? '#f97316' :
                                  ticket.priority === 'MEDIUM' ? '#eab308' : '#3b82f6'
                        }}>
                            {ticket.priority}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Side-by-Side Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Current Submission */}
                <Card style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Current Submission (Iteration #{currentIteration?.iteration_number || 1})
                    </h2>
                    
                    {files.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>No files submitted</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {files.map(file => (
                                <Card
                                    key={file.id}
                                    style={{
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ImageIcon size={20} color="#3b82f6" />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {file.file_url.split('/').pop() || 'File'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {file.file_type || 'Unknown type'}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '0.5rem',
                                            background: 'var(--color-primary)',
                                            color: '#fff',
                                            borderRadius: 'var(--radius-sm)',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <Download size={16} />
                                        View
                                    </a>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Previous Iteration (if exists) */}
                <Card style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Previous Iteration {previousIteration ? `#${previousIteration.iteration_number}` : ''}
                    </h2>
                    
                    {!previousIteration ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>No previous iteration</p>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Outcome
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    color: previousIteration.outcome === 'APPROVED' ? '#10b981' :
                                          previousIteration.outcome === 'REVISION_REQUIRED' ? '#f97316' : '#6b7280'
                                }}>
                                    {previousIteration.outcome || 'PENDING'}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Created: {new Date(previousIteration.created_at).toLocaleString()}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Approval Actions */}
            <Card style={{ padding: '1.5rem', background: 'var(--color-bg-card)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Decision</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                        Rejection Comment (Required if rejecting)
                    </label>
                    <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Enter feedback or rejection reason..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-input)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.875rem',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={rejecting || approving || !rejectComment.trim()}
                        style={{
                            borderColor: '#ef4444',
                            color: '#ef4444'
                        }}
                    >
                        <XCircle size={18} />
                        {rejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={approving || rejecting}
                        style={{ background: '#10b981' }}
                    >
                        <CheckCircle size={18} />
                        {approving ? 'Approving...' : 'Approve'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
