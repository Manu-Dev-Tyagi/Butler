import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, Send, Plus, X, Mail } from 'lucide-react';
import { api } from '../services/api';

export default function ResponseSheet() {
    const [sheets, setSheets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const [emailAddresses, setEmailAddresses] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchSheets();
        fetchProjects();
    }, []);

    const fetchSheets = async () => {
        try {
            setLoading(true);
            const data = await api.responseSheets.list();
            setSheets(data || []);
        } catch (err) {
            console.error('Failed to fetch response sheets', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await api.projects.list();
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProject) {
            alert('Please select a project');
            return;
        }
        setGenerating(true);
        try {
            await api.responseSheets.generate(selectedProject);
            await fetchSheets();
            setShowGenerateModal(false);
            setSelectedProject('');
        } catch (err) {
            console.error('Failed to generate response sheet', err);
            alert('Failed to generate response sheet. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSend = async (sheetId) => {
        if (!emailAddresses.trim()) {
            alert('Please enter at least one email address');
            return;
        }
        const emails = emailAddresses.split(',').map(e => e.trim()).filter(e => e);
        setSending(true);
        try {
            await api.responseSheets.send(sheetId, emails);
            await fetchSheets();
            setShowSendModal(null);
            setEmailAddresses('');
            alert('Response sheet sent successfully!');
        } catch (err) {
            console.error('Failed to send response sheet', err);
            alert('Failed to send response sheet. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'DRAFT': 'warning',
            'SENT': 'success',
            'GENERATED': 'neutral'
        };
        return statusMap[status] || 'neutral';
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Response Sheets</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Generate and send project status reports to clients</p>
                </div>
                <Button onClick={() => setShowGenerateModal(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    Generate New Sheet
                </Button>
            </div>

            {loading ? (
                <Card style={{ padding: '2rem' }}>
                    <Skeleton style={{ height: '200px' }} />
                </Card>
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    {sheets.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Response Sheets</h3>
                            <p>Generate your first response sheet to get started.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Generated At</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Project</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Client</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sheets.map((sheet) => (
                                    <tr key={sheet.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover-row">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {new Date(sheet.created_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                                            {sheet.project_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {sheet.client_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <Badge variant={getStatusBadge(sheet.status)}>
                                                {sheet.status || 'DRAFT'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {sheet.status === 'DRAFT' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => setShowSendModal(sheet.id)}
                                                    >
                                                        <Send size={14} style={{ marginRight: '0.25rem' }} />
                                                        Send
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => window.open(`/response-sheets/${sheet.id}`, '_blank')}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {/* Generate Modal */}
            {showGenerateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '500px', padding: '2rem', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Generate Response Sheet</h3>
                            <button 
                                onClick={() => { setShowGenerateModal(false); setSelectedProject(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Select Project
                            </label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                    color: 'var(--color-text-main)', fontSize: '0.9375rem'
                                }}
                            >
                                <option value="">Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                This will create a snapshot of the project's current state including all tickets, members, and status information.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => { setShowGenerateModal(false); setSelectedProject(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerate} isLoading={generating} disabled={!selectedProject}>
                                <FileText size={16} style={{ marginRight: '0.5rem' }} />
                                Generate
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Send Modal */}
            {showSendModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ width: '500px', padding: '2rem', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Send Response Sheet</h3>
                            <button 
                                onClick={() => { setShowSendModal(null); setEmailAddresses(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Email Addresses <span style={{ color: 'var(--color-text-muted)' }}>(comma-separated)</span>
                            </label>
                            <textarea
                                value={emailAddresses}
                                onChange={(e) => setEmailAddresses(e.target.value)}
                                placeholder="client@example.com, manager@example.com"
                                rows={4}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                                    color: 'var(--color-text-main)', fontSize: '0.9375rem', resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => { setShowSendModal(null); setEmailAddresses(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSend(showSendModal)} isLoading={sending} disabled={!emailAddresses.trim()}>
                                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                                Send
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
