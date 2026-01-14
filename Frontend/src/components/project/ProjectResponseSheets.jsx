import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { FileText, Download, Send, Clock } from 'lucide-react';

export function ProjectResponseSheets({ projectId }) {
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSheets = async () => {
            try {
                const data = await api.projects.responseSheets(projectId);
                setSheets(data);
            } catch (err) {
                console.error("Failed to fetch response sheets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSheets();
    }, [projectId]);

    if (loading) return <Skeleton style={{ height: '200px' }} />;

    if (sheets.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No response sheets generated for this project yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {sheets.map(sheet => (
                <Card key={sheet.id} style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                            <h4 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Report - {new Date(sheet.generated_at).toLocaleDateString()}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                <Clock size={14} />
                                <span>{new Date(sheet.generated_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="ghost" size="sm" title="Download PDF">
                                <Download size={16} />
                            </Button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Tickets</span>
                            <span style={{ fontWeight: 500 }}>{sheet.snapshot_data.summary.total_tickets}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>FTR %</span>
                            <span style={{ fontWeight: 500 }}>{sheet.snapshot_data.summary.ftr_percentage}%</span>
                        </div>
                    </div>

                    <Button style={{ width: '100%', gap: '0.5rem' }}>
                        <Send size={16} /> Send to Client
                    </Button>
                </Card>
            ))}
        </div>
    );
}
