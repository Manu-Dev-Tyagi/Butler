import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
    Search, 
    Ticket, 
    FolderKanban, 
    Building2, 
    User, 
    FileText,
    X,
    AlertTriangle,
    Clock
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * Global Search (Ctrl + K)
 * Search across: Tickets, Projects, Clients, Users, Ad names
 * Result cards show: Current state, Owner, Risk (red alert / SLA)
 */
export function GlobalSearch({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({
        tickets: [],
        projects: [],
        clients: [],
        users: [],
        adNames: []
    });
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle Ctrl+K shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    // Open search - would need parent to handle this
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Search when query changes
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults({ tickets: [], projects: [], clients: [], users: [], adNames: [] });
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const [ticketsData, projectsData, clientsData, usersData] = await Promise.all([
                    api.tickets.list({ search: query }),
                    api.projects.list(),
                    api.clients.list(),
                    api.users.list()
                ]);

                // Filter results
                const filteredTickets = ticketsData.filter(t => 
                    t.title?.toLowerCase().includes(query.toLowerCase()) ||
                    t.ad_name?.toLowerCase().includes(query.toLowerCase()) ||
                    t.id.toLowerCase().includes(query.toLowerCase())
                );

                const filteredProjects = projectsData.filter(p =>
                    p.name?.toLowerCase().includes(query.toLowerCase())
                );

                const filteredClients = clientsData.filter(c =>
                    c.name?.toLowerCase().includes(query.toLowerCase())
                );

                const filteredUsers = usersData.filter(u =>
                    u.name?.toLowerCase().includes(query.toLowerCase()) ||
                    u.email?.toLowerCase().includes(query.toLowerCase())
                );

                // Get ad names from tickets
                const adNames = filteredTickets
                    .filter(t => t.ad_name)
                    .map(t => ({ id: t.id, name: t.ad_name, ticket_id: t.id }));

                setResults({
                    tickets: filteredTickets,
                    projects: filteredProjects,
                    clients: filteredClients,
                    users: filteredUsers,
                    adNames: adNames
                });
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleResultClick = (type, id, entityType) => {
        onClose();
        if (type === 'ticket') {
            navigate(`/tickets/${id}`);
        } else if (type === 'project') {
            navigate(`/projects/${id}`);
        } else if (type === 'user') {
            // Navigate to user profile if exists
            navigate(`/users/${id}`);
        }
    };

    const getRiskLevel = (item) => {
        if (item.red_alert_count > 0) return { level: 'high', text: 'Red Alert', color: '#ef4444' };
        if (item.sla_breach) return { level: 'medium', text: 'SLA Risk', color: '#f97316' };
        return null;
    };

    if (!isOpen) return null;

    const totalResults = results.tickets.length + results.projects.length + 
                        results.clients.length + results.users.length + results.adNames.length;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '10vh',
                zIndex: 2000
            }}
            onClick={onClose}
        >
            <Card
                style={{
                    width: '90%',
                    maxWidth: '700px',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
                className="animate-scaleIn"
            >
                {/* Search Input */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-muted)'
                        }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tickets, projects, clients, users, ad names... (Ctrl+K)"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-input)',
                                color: 'var(--color-text-main)',
                                fontSize: '1rem'
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    {query && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {loading ? 'Searching...' : `${totalResults} results found`}
                        </div>
                    )}
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {!query ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>Start typing to search...</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Press Ctrl+K to open search</p>
                        </div>
                    ) : loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            Searching...
                        </div>
                    ) : totalResults === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Tickets */}
                            {results.tickets.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Tickets ({results.tickets.length})
                                    </h3>
                                    {results.tickets.map(ticket => {
                                        const risk = getRiskLevel(ticket);
                                        return (
                                            <div
                                                key={ticket.id}
                                                onClick={() => handleResultClick('ticket', ticket.id)}
                                                style={{
                                                    padding: '1rem',
                                                    background: 'var(--color-bg-card)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--color-border)',
                                                    marginBottom: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--color-bg-card)';
                                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                                    <Ticket size={18} style={{ marginTop: '2px', color: 'var(--color-primary)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                                                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{ticket.title}</h4>
                                                            {risk && (
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    background: `${risk.color}20`,
                                                                    color: risk.color,
                                                                    fontWeight: 600
                                                                }}>
                                                                    {risk.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                            <span>Status: {ticket.status}</span>
                                                            {ticket.assignee_name && <span>Owner: {ticket.assignee_name}</span>}
                                                            {ticket.delivery_datetime && (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                    <Clock size={12} />
                                                                    {new Date(ticket.delivery_datetime).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Projects */}
                            {results.projects.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Projects ({results.projects.length})
                                    </h3>
                                    {results.projects.map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => handleResultClick('project', project.id)}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                marginBottom: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <FolderKanban size={18} style={{ color: 'var(--color-primary)' }} />
                                                <div>
                                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{project.name}</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Client: {project.client_name} • Status: {project.status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Clients */}
                            {results.clients.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Clients ({results.clients.length})
                                    </h3>
                                    {results.clients.map(client => (
                                        <div
                                            key={client.id}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                marginBottom: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
                                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{client.name}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Users */}
                            {results.users.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Users ({results.users.length})
                                    </h3>
                                    {results.users.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleResultClick('user', user.id)}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                marginBottom: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <User size={18} style={{ color: 'var(--color-primary)' }} />
                                                <div>
                                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{user.name}</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        {user.email} • {user.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ad Names */}
                            {results.adNames.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Ad Names ({results.adNames.length})
                                    </h3>
                                    {results.adNames.map(ad => (
                                        <div
                                            key={ad.id}
                                            onClick={() => handleResultClick('ticket', ad.ticket_id)}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-card)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                marginBottom: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card-hover)';
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--color-bg-card)';
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{ad.name}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
