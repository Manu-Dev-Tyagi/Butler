import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function TicketTable({ tickets, title, emptyMessage = "No tickets found", onAccept, loading = false }) {
    const navigate = useNavigate();

    return (
        <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
            </div>


            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                    <p>Loading tickets...</p>
                </div>
            ) : tickets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    {emptyMessage}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ticket ID</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Title</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Priority</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Deadline</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket, i) => (
                                <tr
                                    key={ticket.id}
                                    className="hover-bg-card-hover"
                                    style={{
                                        borderBottom: i === tickets.length - 1 ? 'none' : '1px solid var(--color-border)',
                                        transition: 'background 0.1s',
                                        background: ticket.slaRisk ? 'rgba(239, 68, 68, 0.05)' : undefined // Light red background for risk
                                    }}
                                >
                                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: ticket.slaRisk ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                        {ticket.slaRisk && <AlertTriangle size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                                        #{ticket.id}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{ticket.title}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <Badge variant={ticket.priority === 'HIGH' ? 'danger' : ticket.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                                            {ticket.priority}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <Badge variant={ticket.status === 'IN_PROGRESS' || ticket.status === 'SUBMITTED' ? 'info' : 'neutral'}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{ticket.delivery_datetime ? new Date(ticket.delivery_datetime).toLocaleDateString() : 'N/A'}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {ticket.status === 'ASSIGNED' && onAccept ? (
                                            <button
                                                onClick={() => onAccept(ticket.id)}
                                                style={{
                                                    background: 'var(--color-primary)', border: 'none',
                                                    padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)',
                                                    color: '#fff', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
                                                    marginRight: '0.5rem'
                                                }}
                                            >
                                                <CheckCircle size={14} /> Accept
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                style={{
                                                    background: 'transparent', border: '1px solid var(--color-border)',
                                                    padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)',
                                                    color: 'var(--color-text-main)', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem'
                                                }}
                                                className="hover-border-primary"
                                            >
                                                View <ArrowRight size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
