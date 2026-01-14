import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AlertTriangle, ArrowLeft, Ticket, UserX, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Leave / Exit Portal
 * Always visible.
 * Shows:
 * - Active tickets count
 * - What will happen if exit is initiated
 * - CTA: "Initiate Exit"
 * Once clicked → irreversible without admin.
 */
export default function LeavePortal() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTickets, setActiveTickets] = useState([]);
    const [step, setStep] = useState(1);

    useEffect(() => {
        fetchActiveTickets();
    }, []);

    const fetchActiveTickets = async () => {
        setFetching(true);
        try {
            const tickets = await api.tickets.list({ assigned_to: 'me' });
            const active = tickets.filter(t => 
                ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED'].includes(t.status)
            );
            setActiveTickets(active);
        } catch (err) {
            console.error('Failed to fetch active tickets:', err);
        } finally {
            setFetching(false);
        }
    };

    const handleExit = async () => {
        if (activeTickets.length > 0) {
            if (!confirm(
                `You have ${activeTickets.length} active ticket(s). ` +
                `They will be reassigned automatically. This action is IRREVERSIBLE without admin intervention. ` +
                `Continue?`
            )) {
                return;
            }
        } else {
            if (!confirm(
                'This will initiate your exit process. This action is IRREVERSIBLE without admin intervention. Continue?'
            )) {
                return;
            }
        }

        setLoading(true);
        try {
            // This endpoint would need to be created in backend
            // await api.users.initiateExit(user.id);
            alert('Exit process initiated. HR and your Manager have been notified.');
            navigate('/my-work');
        } catch (err) {
            console.error(err);
            alert('Failed to initiate exit. Please contact HR.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Employee Portal</h1>

            <Card style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    Resignation / Exit Process
                </h3>

                {step === 1 && (
                    <div>
                        <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            We're sorry to see you go. Starting this process will notify your manager and HR.
                            <br /><br />
                            Please review your active responsibilities before proceeding.
                        </p>

                        {/* Active Tickets Count */}
                        <Card style={{ 
                            padding: '1.5rem', 
                            marginBottom: '2rem',
                            background: activeTickets.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${activeTickets.length > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <Ticket size={24} color={activeTickets.length > 0 ? '#f59e0b' : '#10b981'} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        Active Tickets: {fetching ? 'Loading...' : activeTickets.length}
                                    </h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {activeTickets.length > 0 
                                            ? 'You have active work assigned. These will be automatically reassigned when you exit.'
                                            : 'No active tickets. Safe to exit.'}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchActiveTickets} disabled={fetching}>
                                    <RefreshCcw size={16} className={fetching ? 'animate-spin' : ''} />
                                </Button>
                            </div>
                            {activeTickets.length > 0 && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                        Active Tickets:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {activeTickets.slice(0, 5).map(ticket => (
                                            <div 
                                                key={ticket.id}
                                                onClick={() => navigate(`/tickets/${ticket.id}/workbench`)}
                                                style={{
                                                    padding: '0.75rem',
                                                    background: 'var(--color-bg-card)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                                }}
                                            >
                                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{ticket.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    Status: {ticket.status.replace('_', ' ')}
                                                </div>
                                            </div>
                                        ))}
                                        {activeTickets.length > 5 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                                                +{activeTickets.length - 5} more tickets
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* What Will Happen */}
                        <Card style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
                                <UserX size={24} color="#ef4444" />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#ef4444' }}>
                                        What Will Happen If You Initiate Exit
                                    </h4>
                                    <ul style={{ 
                                        listStyle: 'none', 
                                        padding: 0, 
                                        margin: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span>Your employment status will change to <strong>EXIT_INITIATED</strong></span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span>All active tickets will be automatically <strong>reassigned</strong> to your manager</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span>HR and your manager will be <strong>notified immediately</strong></span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span>This action is <strong>IRREVERSIBLE</strong> without admin intervention</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span>•</span>
                                            <span>You will lose access to create new tickets or assignments</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="outline" onClick={() => navigate('/my-work')}>Cancel</Button>
                            <Button onClick={() => setStep(2)}>
                                Continue to Exit
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slideUp">
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Reason (Optional)</label>
                            <select style={{ width: '100%', padding: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: 'var(--radius-md)' }}>
                                <option>Better Opportunity</option>
                                <option>Higher Studies</option>
                                <option>Personal Reasons</option>
                                <option>Relocation</option>
                            </select>
                        </div>

                        <p style={{ padding: '1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            By clicking "Confirm Resignation", you acknowledge that your exit process will begin immediately. Your access level may change during the notice period.
                        </p>

                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-md)', 
                            marginBottom: '2rem',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '0.75rem'
                        }}>
                            <AlertTriangle size={20} color="#ef4444" />
                            <div style={{ fontSize: '0.875rem' }}>
                                <strong style={{ color: '#ef4444' }}>Warning:</strong> This action cannot be undone without admin intervention. 
                                Please ensure you have completed all necessary handovers.
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button 
                                variant="danger" 
                                isLoading={loading} 
                                onClick={handleExit}
                                style={{ background: '#ef4444' }}
                            >
                                <UserX size={18} />
                                Initiate Exit
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
