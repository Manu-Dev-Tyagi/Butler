import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusSelect } from '../ui/StatusSelect';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProjectTable({ projects, loading = false }) {
    const navigate = useNavigate();

    return (
        <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Projects</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </div>
            </div>
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                    <p>Loading projects...</p>
                </div>
            ) : projects.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <p>No projects found</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Project Name</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Client</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>POCs</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project, i) => (
                                <tr
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    style={{
                                        borderBottom: i === projects.length - 1 ? 'none' : '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        transition: 'background 0.1s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{project.name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{project.client_name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '-0.5rem' }}>
                                            {(project.pocs || []).map((poc, idx) => (
                                                <div key={idx} style={{
                                                    width: '24px', height: '24px', borderRadius: '50%', background: '#374151',
                                                    border: '2px solid var(--color-bg-card)', fontSize: '0.625rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginLeft: idx > 0 ? '-0.5rem' : '0'
                                                }} title={poc.name}>
                                                    {poc.name.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div
                                            style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                display: 'inline-block',
                                                background:
                                                    project.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' :
                                                        project.status === 'IN_PROGRESS' ? 'rgba(234, 179, 8, 0.2)' :
                                                            project.status === 'DELAYED' ? 'rgba(249, 115, 22, 0.2)' :
                                                                'rgba(59, 130, 246, 0.2)',
                                                color:
                                                    project.status === 'ACTIVE' ? '#10b981' :
                                                        project.status === 'IN_PROGRESS' ? '#eab308' :
                                                            project.status === 'DELAYED' ? '#f97316' :
                                                                '#3b82f6',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {project.status.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                            <MoreHorizontal size={18} />
                                        </button>
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
