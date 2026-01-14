import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusSelect } from '../ui/StatusSelect';
import { Mail, Phone } from 'lucide-react';

export function ProjectOverview({ project }) {
    if (!project) return null;

    return (
        <div className="animate-slideUp" style={{ display: 'grid', gap: '1.5rem' }}>
            <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{project.name}</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Client: <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{project.client_name}</span></p>
                    </div>
                    <StatusSelect
                        initialStatus={project.status}
                        onChange={(newStatus) => console.log(`Project ${project.id} status updated to ${newStatus}`)}
                        readOnly={true}
                    />
                </div>

                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-info)', marginBottom: '0.5rem' }}>Slack Channel</h4>
                    <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>#{project.name?.toLowerCase().replace(/\s/g, '-')}</a>
                </div>
            </Card>

            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Points of Contact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {(project.pocs || []).map((poc, i) => (
                        <Card key={i} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                                    {poc.name?.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{poc.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>POC from {project.client_name}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <Mail size={16} /> {poc.email}
                                </div>
                                {poc.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                    <Phone size={16} /> {poc.phone}
                                </div>}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
